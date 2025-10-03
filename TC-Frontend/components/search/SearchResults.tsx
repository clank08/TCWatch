import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  Platform,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '@/components/ui/Loading';
import { SearchResultCard } from './SearchResultCard';
import { useSearchStore, SearchResult } from '@/stores/search-store';
import { Colors } from '@/constants/design-system';

/**
 * Fixed height for SearchResultCard items
 * Based on card structure: 180px poster height + 16px margin bottom
 */
const ITEM_HEIGHT = 196;

/**
 * Spacing between items
 */
const ITEM_SPACING = 0; // Already included in card marginBottom

interface SearchResultsProps {
  onItemPress?: (item: SearchResult) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  style?: any;
}

export function SearchResults({
  onItemPress,
  onRefresh,
  onLoadMore,
  style,
}: SearchResultsProps) {
  const {
    results,
    isSearching,
    isLoadingMore,
    hasNextPage,
    query,
  } = useSearchStore();

  console.log('=== [SearchResults] Component Rendering ===');
  console.log('[SearchResults] Store data:', {
    resultsCount: results.length,
    isSearching,
    isLoadingMore,
    hasNextPage,
    query,
  });
  console.log(`[SearchResults] Rendering ${results.length} results for query: "${query}"`);
  console.log('[SearchResults] Full results array:', JSON.stringify(results, null, 2));

  // Log poster paths for debugging images
  if (results.length > 0) {
    console.log('[SearchResults] Processing individual results:');
    results.forEach((result, index) => {
      console.log(`[SearchResults] Result ${index + 1}:`, {
        id: result.id,
        title: result.title,
        posterUrl: result.posterUrl,
        contentType: result.contentType,
      });
    });
  } else {
    console.log('[SearchResults] NO RESULTS TO DISPLAY');
  }
  console.log('=== [SearchResults] Component Render Data Logged ===');

  // Memoized render item callback
  const renderSearchResultItem: ListRenderItem<SearchResult> = useCallback(
    ({ item }) => (
      <SearchResultCard
        result={item}
        onPress={() => onItemPress?.(item)}
        onAddToList={(result) => {
          // TODO: Implement add to list functionality
          console.log('Add to list:', result.title);
        }}
      />
    ),
    [onItemPress]
  );

  // Memoized key extractor
  const keyExtractor = useCallback(
    (item: SearchResult, index: number) => `${item.id}-${index}`,
    []
  );

  /**
   * Fixed height getItemLayout for optimal scrolling performance
   * This enables:
   * - Instant scroll to any position
   * - Accurate scroll position tracking
   * - Smooth scroll indicators
   * - Reduced layout calculations
   */
  const getItemLayout = useCallback(
    (data: SearchResult[] | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  // Memoized footer component
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerContainer}>
        <Loading size="small" />
      </View>
    );
  }, [isLoadingMore]);

  // Memoized empty component
  const renderEmpty = useCallback(() => {
    if (isSearching) return null;

    // Only show "No results found" if query is long enough to trigger search (3+ characters)
    const queryLength = query.trim().length;
    const hasSearchableQuery = queryLength >= 3;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color={Colors.shadow[400]} />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '500',
            color: Colors.softText.muted,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          {hasSearchableQuery ? 'No results found' :
           queryLength > 0 ? 'Keep typing to search...' :
           'Start typing to search'}
        </Text>
        {hasSearchableQuery && (
          <Text
            style={{
              fontSize: 14,
              color: Colors.softText.subtle,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 32,
            }}
          >
            Try adjusting your search terms or filters
          </Text>
        )}
        {queryLength > 0 && queryLength < 3 && (
          <Text
            style={{
              fontSize: 14,
              color: Colors.softText.subtle,
              textAlign: 'center',
              marginTop: 8,
              paddingHorizontal: 32,
            }}
          >
            Enter at least 3 characters to search
          </Text>
        )}
      </View>
    );
  }, [isSearching, query]);

  // Memoized end reached handler
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoadingMore && !isSearching) {
      onLoadMore?.();
    }
  }, [hasNextPage, isLoadingMore, isSearching, onLoadMore]);

  if (isSearching && results.length === 0) {
    return (
      <View style={StyleSheet.flatten([styles.loadingContainer, style])}>
        <Loading />
        <Text
          style={{
            fontSize: 16,
            color: Colors.softText.muted,
            marginTop: 16,
          }}
        >
          Searching true crime content...
        </Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.flatten([styles.container, style])} testID="search-results-container">
      <FlatList
        data={results}
        renderItem={renderSearchResultItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isSearching}
            onRefresh={onRefresh}
            colors={[Colors.evidence[800]]}
            tintColor={Colors.evidence[800]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        style={{
          backgroundColor: Colors.charcoal[900],
        }}
        contentContainerStyle={{
          padding: 16,
          backgroundColor: Colors.charcoal[900],
          ...(results.length === 0 && { flex: 1 }),
        }}
        keyboardShouldPersistTaps="handled"
        // Performance optimizations
        removeClippedSubviews={true} // Enable on both iOS and Android
        maxToRenderPerBatch={10} // Increased for better initial render
        initialNumToRender={8} // Optimized for typical screen size
        windowSize={21} // Optimized render window (10 screens above + current + 10 below)
        updateCellsBatchingPeriod={50}
        // Maintain visible content position during prepends
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        // Smooth scrolling
        scrollEventThrottle={16} // 60 FPS
        // Accessibility
        testID="search-results-list"
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  footerContainer: {
    paddingVertical: 16,
  },
});