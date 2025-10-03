import { useCallback, useEffect } from 'react';
import { useSearchStore } from '@/stores/search-store';
import { trpc } from '@/lib/trpc';

export function useSearch() {
  const {
    query,
    filters,
    results,
    currentPage,
    hasNextPage,
    isSearching,
    isLoadingMore,
    searchTrigger,
    setResults,
    appendResults,
    setIsSearching,
    setIsLoadingMore,
    addToHistory,
  } = useSearchStore();

  // Main search query - needs at least 3 characters
  const searchEnabled = query.trim().length > 2;

  console.log('[useSearch] Hook initialized with:', {
    query,
    queryLength: query.length,
    searchEnabled,
    filters,
    currentResults: results.length,
  });

  const searchQuery = trpc.search.content.useQuery(
    {
      query: query.trim(),
      contentType: filters.contentType,
      genreTags: filters.genreTags,
      platforms: filters.platforms,
      caseIds: filters.caseIds,
      releaseYear: filters.releaseYear,
      minRating: filters.minRating,
      limit: 20,
      offset: 0,
      useCache: false, // Disable cache for testing
    },
    {
      enabled: searchEnabled,
      refetchOnWindowFocus: false,
    }
  );

  // Process data whenever query status changes
  useEffect(() => {
    console.log('[useSearch] Query state changed:', {
      isSuccess: searchQuery.isSuccess,
      data: searchQuery.data,
      dataLength: searchQuery.data?.results?.length,
    });

    if (searchQuery.isSuccess && searchQuery.data) {
      const data = searchQuery.data;
      console.log('=== [useSearch] Processing successful query data ===');
      console.log('[useSearch] Raw data received:', JSON.stringify(data, null, 2));
      console.log(`[useSearch] API returned ${data?.results?.length || 0} results`);
      console.log('[useSearch] First result:', JSON.stringify(data?.results?.[0], null, 2));
      console.log('[useSearch] Full results array:', data?.results);

      // Transform backend data to match our SearchResult interface
      // Backend returns camelCase directly
      const searchResults = data?.results?.map((item: any, index: number) => {
        console.log(`[useSearch] Transforming result ${index + 1}:`, item);
        const transformed = {
          id: item.id,
          title: item.title,
          description: item.description,
          contentType: item.contentType,
          posterUrl: item.posterUrl,
          platforms: (item.platforms || []).map((platform: any) => ({
            id: platform.id || platform.name,
            name: platform.name,
            logoUrl: platform.logoUrl,
          })),
          rating: item.rating,
          releaseYear: item.releaseYear || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined),
          genreTags: item.genreTags || [],
          caseIds: item.caseIds || [],
        };
        console.log(`[useSearch] Transformed result ${index + 1}:`, transformed);
        return transformed;
      }) || [];

      console.log(`[useSearch] TOTAL transformed results: ${searchResults.length}`);
      console.log('[useSearch] Transformed results:', JSON.stringify(searchResults, null, 2));
      console.log(`[useSearch] Results with images: ${searchResults.filter((r: any) => r.posterUrl).length}`);

      console.log('[useSearch] CALLING setResults with:', searchResults.length, 'results');
      setResults(searchResults, data.hasMore || false);
      console.log('[useSearch] setResults CALLED - checking store now...');

      // Verify store was updated
      const storeState = useSearchStore.getState();
      console.log('[useSearch] Store state after setResults:', {
        resultsCount: storeState.results.length,
        isSearching: storeState.isSearching,
        query: storeState.query,
      });

      // Add to search history if we have results
      if (query.trim() && searchResults.length > 0) {
        console.log('[useSearch] Adding to history:', query.trim());
        addToHistory(query.trim(), searchResults.length);
      }

      console.log('=== [useSearch] Processing complete ===');
    } else if (searchQuery.isError) {
      console.error('=== [useSearch] Query error ===');
      console.error('[useSearch] Error:', searchQuery.error);
      setResults([]);
    }
  }, [searchQuery.isSuccess, searchQuery.data, searchQuery.isError, searchQuery.error, query, setResults, addToHistory]);

  console.log('[useSearch] searchQuery state:', {
    isLoading: searchQuery.isLoading,
    isFetching: searchQuery.isFetching,
    isError: searchQuery.isError,
    isSuccess: searchQuery.isSuccess,
    data: searchQuery.data,
    error: searchQuery.error,
  });

  // Load more results query
  const loadMoreQuery = trpc.search.content.useQuery(
    {
      query: query.trim(),
      contentType: filters.contentType,
      genreTags: filters.genreTags,
      platforms: filters.platforms,
      caseIds: filters.caseIds,
      releaseYear: filters.releaseYear,
      minRating: filters.minRating,
      limit: 20,
      offset: currentPage * 20,
      useCache: true,
    },
    {
      enabled: false, // Only trigger manually
    }
  );

  // Process load more data
  useEffect(() => {
    if (loadMoreQuery.isSuccess && loadMoreQuery.data) {
      const data = loadMoreQuery.data;
      const searchResults = data.results?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        contentType: item.contentType,
        posterUrl: item.posterUrl,
        platforms: (item.platforms || []).map((platform: any) => ({
          id: platform.id || platform.name,
          name: platform.name,
          logoUrl: platform.logoUrl,
        })),
        rating: item.rating,
        releaseYear: item.releaseYear || (item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined),
        genreTags: item.genreTags || [],
        caseIds: item.caseIds || [],
      })) || [];

      console.log(`[useSearch] Load more: adding ${searchResults.length} more results`);
      appendResults(searchResults, data.hasMore || false);
      setIsLoadingMore(false);
    } else if (loadMoreQuery.isError) {
      console.error('Load more error:', loadMoreQuery.error);
      setIsLoadingMore(false);
    }
  }, [loadMoreQuery.isSuccess, loadMoreQuery.data, loadMoreQuery.isError, appendResults, setIsLoadingMore]);

  // Search function
  const search = useCallback(
    (searchTerm?: string) => {
      const queryToUse = searchTerm || query;
      if (!queryToUse.trim()) return;

      // Don't manually set isSearching - let tRPC handle it
      searchQuery.refetch();
    },
    [query] // Removed searchQuery from deps to avoid stale closure issues
  );

  // Load more function
  const loadMore = useCallback(() => {
    if (!hasNextPage || isLoadingMore || isSearching) return;

    setIsLoadingMore(true);
    loadMoreQuery.refetch();
  }, [hasNextPage, isLoadingMore, isSearching, loadMoreQuery, setIsLoadingMore]);

  // Refresh function
  const refresh = useCallback(() => {
    if (!query.trim()) return;

    // Don't manually set isSearching - let tRPC handle it
    searchQuery.refetch();
  }, [query]); // Removed searchQuery from deps to avoid stale closure issues

  // Clear results when query is empty
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
    }
  }, [query, setResults]);

  // Trigger immediate search when searchTrigger changes (e.g., on Enter press)
  useEffect(() => {
    if (searchTrigger > 0 && query.trim()) {
      searchQuery.refetch();
    }
  }, [searchTrigger, query]);

  return {
    // State
    query,
    filters,
    results,
    // Use searchQuery state when enabled, fallback to store state
    isSearching: searchEnabled ? searchQuery.isFetching : isSearching,
    isLoadingMore: isLoadingMore || loadMoreQuery.isFetching,
    hasNextPage,
    error: searchQuery.error || loadMoreQuery.error,

    // Actions
    search,
    loadMore,
    refresh,

    // Utilities
    canLoadMore: hasNextPage && !isLoadingMore && !isSearching,
  };
}