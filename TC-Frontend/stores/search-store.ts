import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchFilters {
  contentType?: 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST';
  genreTags: string[];
  platforms: string[];
  caseIds: string[];
  releaseYear?: number;
  minRating?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  contentType: 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST';
  posterUrl?: string;
  platforms: Array<{
    id: string;
    name: string;
    logoUrl?: string;
  }>;
  rating?: number;
  releaseYear?: number;
  genreTags: string[];
  caseIds: string[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  resultsCount: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'content' | 'case' | 'person';
  metadata?: {
    contentType?: string;
    year?: number;
    platform?: string;
  };
}

interface SearchState {
  // Current search
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  searchTrigger: number; // Timestamp to force search execution

  // UI state
  isSearching: boolean;
  isLoadingSuggestions: boolean;
  showSuggestions: boolean;
  showFilters: boolean;

  // History (persisted)
  searchHistory: SearchHistoryItem[];
  recentSearches: string[];

  // Pagination
  hasNextPage: boolean;
  isLoadingMore: boolean;
  currentPage: number;

  // Actions
  setQuery: (query: string) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setResults: (results: SearchResult[], hasNextPage?: boolean) => void;
  appendResults: (results: SearchResult[], hasNextPage?: boolean) => void;
  setSuggestions: (suggestions: SearchSuggestion[]) => void;
  setIsSearching: (loading: boolean) => void;
  setIsLoadingSuggestions: (loading: boolean) => void;
  setShowSuggestions: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setIsLoadingMore: (loading: boolean) => void;
  setSearchTrigger: (trigger: number) => void;

  // History actions
  addToHistory: (query: string, resultsCount: number) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Reset actions
  clearSearch: () => void;
  resetFilters: () => void;
  resetPagination: () => void;
}

const defaultFilters: SearchFilters = {
  genreTags: [],
  platforms: [],
  caseIds: [],
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      // Initial state
      query: '',
      filters: defaultFilters,
      results: [],
      suggestions: [],
      searchTrigger: 0,

      // UI state
      isSearching: false,
      isLoadingSuggestions: false,
      showSuggestions: false,
      showFilters: false,

      // History
      searchHistory: [],
      recentSearches: [],

      // Pagination
      hasNextPage: false,
      isLoadingMore: false,
      currentPage: 0,

      // Actions
      setQuery: (query: string) => {
        set({ query });

        // Clear suggestions if query is empty
        if (!query.trim()) {
          set({ suggestions: [], showSuggestions: false });
        }
      },

      setSearchTrigger: (trigger: number) => {
        set({ searchTrigger: trigger });
      },

      setFilters: (newFilters: Partial<SearchFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          // Reset pagination when filters change
          currentPage: 0,
        }));
      },

      setResults: (results: SearchResult[], hasNextPage = false) => {
        console.log('=== [search-store] setResults CALLED ===');
        console.log('[search-store] Setting results:', {
          resultsCount: results.length,
          hasNextPage,
          currentPage: results.length > 0 ? 1 : 0,
        });
        console.log('[search-store] Results data:', JSON.stringify(results, null, 2));

        set({
          results,
          hasNextPage,
          currentPage: results.length > 0 ? 1 : 0,
          // Don't set isSearching here - let tRPC manage loading state
          showSuggestions: false,
        });

        // Verify state was updated
        const newState = get();
        console.log('[search-store] State after update:', {
          resultsCount: newState.results.length,
          hasNextPage: newState.hasNextPage,
          currentPage: newState.currentPage,
          isSearching: newState.isSearching,
        });
        console.log('=== [search-store] setResults COMPLETE ===');
      },

      appendResults: (newResults: SearchResult[], hasNextPage = false) => {
        set((state) => ({
          results: [...state.results, ...newResults],
          hasNextPage,
          currentPage: state.currentPage + 1,
          isLoadingMore: false,
        }));
      },

      setSuggestions: (suggestions: SearchSuggestion[]) => {
        set({ suggestions, isLoadingSuggestions: false });
      },

      setIsSearching: (isSearching: boolean) => {
        set({ isSearching });
      },

      setIsLoadingSuggestions: (isLoadingSuggestions: boolean) => {
        set({ isLoadingSuggestions });
      },

      setShowSuggestions: (showSuggestions: boolean) => {
        set({ showSuggestions });
      },

      setShowFilters: (showFilters: boolean) => {
        set({ showFilters });
      },

      setIsLoadingMore: (isLoadingMore: boolean) => {
        set({ isLoadingMore });
      },

      // History actions
      addToHistory: (query: string, resultsCount: number) => {
        const historyItem: SearchHistoryItem = {
          id: `${Date.now()}-${Math.random()}`,
          query,
          timestamp: new Date(),
          resultsCount,
        };

        set((state) => {
          // Remove duplicate if exists and add new item at the beginning
          const filteredHistory = state.searchHistory.filter(
            item => item.query.toLowerCase() !== query.toLowerCase()
          );

          // Keep only last 50 searches
          const newHistory = [historyItem, ...filteredHistory].slice(0, 50);

          return { searchHistory: newHistory };
        });
      },

      clearHistory: () => {
        set({ searchHistory: [] });
      },

      removeFromHistory: (id: string) => {
        set((state) => ({
          searchHistory: state.searchHistory.filter(item => item.id !== id),
        }));
      },

      addRecentSearch: (query: string) => {
        set((state) => {
          // Remove duplicate if exists and add new query at the beginning
          const filteredRecent = state.recentSearches.filter(
            item => item.toLowerCase() !== query.toLowerCase()
          );

          // Keep only last 10 recent searches
          const newRecent = [query, ...filteredRecent].slice(0, 10);

          return { recentSearches: newRecent };
        });
      },

      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },

      // Reset actions
      clearSearch: () => {
        set({
          query: '',
          results: [],
          suggestions: [],
          showSuggestions: false,
          isSearching: false,
          isLoadingSuggestions: false,
          currentPage: 0,
          hasNextPage: false,
          isLoadingMore: false,
        });
      },

      resetFilters: () => {
        set({
          filters: defaultFilters,
          currentPage: 0,
        });
      },

      resetPagination: () => {
        set({
          currentPage: 0,
          hasNextPage: false,
          isLoadingMore: false,
        });
      },
    }),
    {
      name: 'tcwatch-search-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        recentSearches: state.recentSearches,
        filters: state.filters,
      }),
      // Rehydrate callback
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure dates are properly parsed from storage
          state.searchHistory = state.searchHistory.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
        }
      },
    }
  )
);