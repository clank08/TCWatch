import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar, SearchResults, SearchFilters } from '@/components/search';
import { SearchEmptyState } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useSearch } from '@/hooks/search/useSearch';
import { useSearchStore } from '@/stores/search-store';
import { useAuth } from '@/hooks/use-auth';
import { Colors } from '@/constants/design-system';
import { cn } from '@/utils/cn';

export default function DiscoverScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    query,
    results,
    filters,
    isSearching,
    isLoadingMore,
    hasNextPage,
    error,
    canLoadMore,
    search,
    loadMore,
    refresh: refreshSearch,
  } = useSearch();

  console.log('=== [DiscoverScreen] Component Rendering ===');
  console.log('[DiscoverScreen] useSearch hook data:', {
    query,
    resultsCount: results.length,
    isSearching,
    isLoadingMore,
    hasNextPage,
    error: error?.message,
  });
  console.log('[DiscoverScreen] Results:', JSON.stringify(results, null, 2));

  const {
    showFilters,
    setShowFilters,
    resetFilters,
    clearSearch,
  } = useSearchStore();

  // Also check store directly
  const storeResults = useSearchStore((state) => state.results);
  console.log('[DiscoverScreen] Store results count:', storeResults.length);
  console.log('[DiscoverScreen] Store vs Hook results match:', results.length === storeResults.length);

  // Handle search result item press
  const handleSearchItemPress = useCallback((item: any) => {
    try {
      router.push({
        pathname: '/content/[id]',
        params: { id: item.id }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Unable to open content details');
    }
  }, [router]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (query.trim()) {
        refreshSearch();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshSearch, query]);

  // Handle search functions
  const handleRefreshSearch = useCallback(() => {
    refreshSearch();
  }, [refreshSearch]);

  const handleLoadMore = useCallback(() => {
    if (canLoadMore) {
      loadMore();
    }
  }, [canLoadMore, loadMore]);

  const handleClearFilters = useCallback(() => {
    resetFilters();
    if (query.trim()) {
      search();
    }
  }, [resetFilters, query, search]);

  const handleTryAgain = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  // Check if filters are active
  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined && value !== null;
  });

  // Determine what to show
  const showEmptyState = !isSearching && results.length === 0 && query.trim().length >= 3;
  const showResults = results.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar
        style="light"
        backgroundColor={Colors.charcoal[900]}
        translucent={false}
      />

      {/* Always show search-focused interface */}
      <View className="flex-1">
        {/* Header with Search Bar */}
        <View className="px-4 pt-6 pb-4 bg-gray-900">
          <View className="mb-4">
            <Text className="text-3xl font-bold text-warm-50">
              Discover True Crime
            </Text>
            <Text className="text-base text-warm-500 mt-1">
              Search across 200+ streaming platforms
            </Text>
          </View>

          {/* Search Bar */}
          <SearchBar
            placeholder="Search true crime content..."
            autoFocus={true}
            className="mb-2"
          />

          {/* Search hint */}
          {query.trim().length > 0 && query.trim().length < 3 && (
            <Text className="text-xs text-warm-500 mt-1 mb-2">
              Type at least 3 characters to search
            </Text>
          )}

          {/* Quick Filters */}
          <View className="flex-row gap-3 mt-3">
            <Button
              variant="outline"
              size="sm"
              onPress={() => setShowFilters(true)}
              className="flex-1"
            >
              <Text className="text-evidence-800 font-semibold">🔍 Filters</Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => router.push('/cases')}
              className="flex-1"
            >
              <Text className="text-evidence-800 font-semibold">📁 Browse Cases</Text>
            </Button>
          </View>

          {/* Search Stats */}
          {showResults && (
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-sm text-warm-500">
                {results.length} result{results.length !== 1 ? 's' : ''}
                {query && ` for "${query}"`}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={handleClearFilters}>
                  <Text className="text-sm text-red-500 font-medium">
                    Clear filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Search Content */}
        <View style={{ flex: 1 }}>
          {!query.trim() ? (
            // Welcome state - no search performed yet
            <View className="flex-1 items-center justify-center px-6">
              <Ionicons name="search" size={64} color="#9CA3AF" />
              <Text className="text-2xl font-bold text-warm-50 mt-4 text-center">
                Start Your Search
              </Text>
              <Text className="text-base text-warm-500 mt-2 text-center">
                Search for true crime content by title, case name, or keyword
              </Text>

              {/* Quick search suggestions */}
              <View className="mt-6 w-full">
                <Text className="text-sm text-warm-500 mb-3">Popular searches:</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['Dahmer', 'Cold Case', 'Serial Killer', 'Forensic Files', 'Making a Murderer'].map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      onPress={() => search(suggestion)}
                      className="bg-gray-800 rounded-full px-4 py-2"
                    >
                      <Text className="text-warm-100 text-sm">{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : showEmptyState ? (
            <SearchEmptyState
              query={query}
              onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
              onTryAgain={handleTryAgain}
              hasFilters={hasActiveFilters}
              className="flex-1"
            />
          ) : (
            // Always show SearchResults for queries 1+ characters
            // (it handles the messaging for 1-2 characters internally)
            <SearchResults
              onItemPress={handleSearchItemPress}
              onRefresh={handleRefreshSearch}
              onLoadMore={handleLoadMore}
              className="flex-1"
            />
          )}
        </View>
      </View>

      {/* Search Filters Modal */}
      {showFilters && (
        <SearchFilters
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          onApply={() => {
            setShowFilters(false);
            // Re-search with new filters
            if (query.trim()) {
              search();
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}