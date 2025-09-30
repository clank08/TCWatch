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
import { TrendingContent } from '@/components/home/TrendingContent';
import { CaseBrowser } from '@/components/home/CaseBrowser';
import { ContentCarousel, ContentItem } from '@/components/home';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { GenreFilter } from '@/components/home/GenreFilter';
import { useSearch } from '@/hooks/search/useSearch';
import { useSearchStore } from '@/stores/search-store';
import { useMultipleCategories, ContentCategory } from '@/hooks/content/useContentByCategory';
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

  const {
    showFilters,
    setShowFilters,
    resetFilters,
    clearSearch,
  } = useSearchStore();

  // Categories to display on discover screen (focused on discovery)
  const discoverCategories: ContentCategory[] = [
    'new-releases',
    'true-crime-classics',
    'investigative-series',
    'unsolved-mysteries',
    'recent-cases',
    'popular-netflix',
  ];

  // Fetch content for multiple categories
  const {
    dataByCategory,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refreshAll: refreshCategories,
  } = useMultipleCategories(discoverCategories, { limit: 10 });

  // Transform category data to ContentItem format
  const transformCategoryData = useCallback((categoryData: any[]): ContentItem[] => {
    return categoryData.map(item => ({
      id: item.id,
      title: item.title,
      subtitle: item.description,
      year: item.releaseYear,
      type: item.contentType === 'TV_SERIES' ? 'tv' : item.contentType.toLowerCase(),
      imageUrl: item.posterUrl,
      platforms: item.platforms?.map((p: any) => p.name) || [],
      rating: item.rating || 0,
      isWatched: false, // This would come from user data
      isWantToWatch: false, // This would come from user data
      isCurrentlyWatching: false, // This would come from user data
      isTrending: item.isPopular,
    }));
  }, []);

  // Handle content item press
  const handleContentPress = useCallback((item: ContentItem) => {
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

  // Handle see all press for categories
  const handleCategorySeeAll = useCallback((category: ContentCategory) => {
    try {
      router.push({
        pathname: '/browse/category/[category]',
        params: { category }
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, [router]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCategories();
      if (query.trim()) {
        refreshSearch();
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCategories, refreshSearch, query]);

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
  const showEmptyState = !isSearching && results.length === 0 && query.trim();
  const showResults = results.length > 0;
  const showDiscoveryContent = !query.trim() || (!showResults && !isSearching);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <StatusBar
        style="light"
        backgroundColor={Colors.charcoal[900]}
        translucent={false}
      />

      {showDiscoveryContent ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#BA0C2F"
              colors={['#BA0C2F']}
            />
          }
        >
          {/* Header with Search Bar */}
          <View className="px-4 pt-6 pb-4 bg-gray-900">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-3xl font-bold text-warm-50">
                  Discover True Crime
                </Text>
                <Text className="text-base text-warm-500 mt-1">
                  Explore the latest cases, classics, and hidden gems
                </Text>
              </View>

              {/* Quick Stats */}
              <View className="items-end">
                <Badge variant="outline" size="sm" className="mb-1">
                  200+ platforms
                </Badge>
                <Badge variant="outline" size="sm">
                  Updated daily
                </Badge>
              </View>
            </View>

            {/* Search Bar */}
            <SearchBar
              placeholder="Search true crime content..."
              autoFocus={false}
              className="mb-2"
            />

            {/* Quick Actions */}
            <View className="flex-row gap-3 mt-3">
              <Button
                variant="primary"
                size="sm"
                onPress={() => {
                  // Focus search bar and show filters
                  setShowFilters(true);
                }}
                className="flex-1"
              >
                <Text className="text-white font-semibold">🔍 Advanced Search</Text>
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
          </View>

          {/* Trending Section */}
          <TrendingContent
            showPeriodSelector={true}
            defaultPeriod="week"
            limit={15}
            onContentPress={handleContentPress}
            onSeeAllPress={() => router.push('/trending')}
          />

          {/* Featured Cases */}
          <CaseBrowser
            limit={6}
            showSeeAll={true}
            onSeeAllPress={() => router.push('/cases')}
          />

          {/* Genre Quick Access */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className="text-xl font-bold text-warm-50 mb-2">
                Browse by Genre
              </Text>
              <Text className="text-sm text-warm-500">
                Find content by your favorite true crime categories
              </Text>
            </View>
            <GenreFilter
              genres={[
                { id: 'serial-killer', name: 'Serial Killer', emoji: '🔪', isActive: false },
                { id: 'cold-case', name: 'Cold Case', emoji: '❄️', isActive: false },
                { id: 'forensic', name: 'Forensic', emoji: '🔬', isActive: false },
                { id: 'white-collar', name: 'White Collar', emoji: '💼', isActive: false },
                { id: 'documentary', name: 'Documentary', emoji: '🎬', isActive: false },
                { id: 'investigative', name: 'Investigative', emoji: '🕵️', isActive: false },
              ]}
              onGenrePress={(genre) => {
                router.push({
                  pathname: '/browse/genre/[genre]',
                  params: { genre: genre.id }
                });
              }}
            />
          </View>

          {/* Content Categories */}
          {discoverCategories.map((category) => {
            const categoryData = dataByCategory[category];
            if (!categoryData || categoryData.results.length === 0) return null;

            return (
              <ContentCarousel
                key={category}
                title={categoryData.title}
                data={transformCategoryData(categoryData.results)}
                isLoading={categoriesLoading}
                onContentPress={handleContentPress}
                onSeeAll={() => handleCategorySeeAll(category)}
                variant="default"
                showPlatforms={true}
                showStatus={true}
                horizontal={true}
                showSeeAll={true}
              />
            );
          })}

          {/* Platform Spotlights */}
          <View className="mb-6">
            <View className="px-4 mb-4">
              <Text className="text-xl font-bold text-warm-50 mb-2">
                Platform Spotlights
              </Text>
              <Text className="text-sm text-warm-500">
                Discover exclusive content from top streaming services
              </Text>
            </View>

            <View className="px-4 flex-row gap-3">
              {['Netflix', 'Hulu', 'HBO Max', 'Amazon Prime'].map((platform) => (
                <Pressable
                  key={platform}
                  onPress={() => router.push({
                    pathname: '/browse/platform/[platform]',
                    params: { platform }
                  })}
                  className="flex-1"
                >
                  <Card variant="outline" padding="md" className="items-center">
                    <Text className="text-sm font-semibold text-warm-100">
                      {platform}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bottom Padding */}
          <View className="h-6" />
        </ScrollView>
      ) : (
        // Search Results View
        <View className="flex-1">
          {/* Header with Search Bar */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 12,
              backgroundColor: Colors.charcoal[900],
              borderBottomWidth: 1,
              borderBottomColor: Colors.charcoal[700],
            }}
          >
            <View className="flex-row items-center mb-4">
              <TouchableOpacity
                onPress={() => clearSearch()}
                className="mr-3"
              >
                <Ionicons name="arrow-back" size={24} color={Colors.softText.primary} />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: Colors.softText.primary,
                }}
              >
                Search Results
              </Text>
            </View>
            <SearchBar
              placeholder="Search true crime content..."
              autoFocus={false}
              className="mb-2"
            />

            {/* Search Stats */}
            {showResults && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: Colors.softText.muted,
                  }}
                >
                  {results.length} result{results.length !== 1 ? 's' : ''}
                  {query && ` for "${query}"`}
                </Text>
                {hasActiveFilters && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: Colors.evidence[600],
                      fontWeight: '500',
                    }}
                    onPress={handleClearFilters}
                  >
                    Clear filters
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Search Content */}
          <View style={{ flex: 1 }}>
            {showEmptyState ? (
              <SearchEmptyState
                query={query}
                onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
                onTryAgain={handleTryAgain}
                hasFilters={hasActiveFilters}
                className="flex-1"
              />
            ) : showResults ? (
              <SearchResults
                onItemPress={handleSearchItemPress}
                onRefresh={handleRefreshSearch}
                onLoadMore={handleLoadMore}
                className="flex-1"
              />
            ) : null}
          </View>
        </View>
      )}

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