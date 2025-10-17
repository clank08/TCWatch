import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import Reanimated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/error';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShareButton } from '@/components/ui/ShareButton';
import { StatusBarConfig } from '@/utils/platform';
import { ContentHeader } from '@/components/content/ContentHeader';
import { UserActions } from '@/components/content/UserActions';
import { ContentTabs, OverviewTab, CriminalCasesTab } from '@/components/content/ContentTabs';
import { EpisodesTab } from '@/components/content/EpisodeGuide';
import { CastTab } from '@/components/content/CastSection';
import { PlatformsTab } from '@/components/content/PlatformAvailability';
import { ContentDetailSkeleton } from '@/components/content/ContentDetailSkeleton';
import { useContentDetail, useOptimisticContentActions } from '@/hooks/content/useContentDetail';
import { TrackingListType } from '@/types/content';
import { ShareableContent } from '@/types/sharing';
import { shareUtils } from '@/utils/sharing';
import { ContentDetail } from '@/types/content';

// Tab configuration interface (matching ContentTabs)
interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<{ content: ContentDetail }>;
  badge?: number;
}

export default function ContentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const safeArea = StatusBarConfig.getSafeAreaPadding();

  // Data fetching
  const { data: content, isLoading, error, refetch } = useContentDetail(id as string);

  // Debug logging
  useEffect(() => {
    if (content) {
      console.log('[ContentDetailsScreen] Content loaded:', {
        id: content.id,
        title: content.title,
        hasBackdropPath: !!content.backdrop_path,
        hasPosterPath: !!content.poster_path,
        backdropPath: content.backdrop_path,
        posterPath: content.poster_path,
        hasBackdropUrl: !!content.backdropUrl,
        hasPosterUrl: !!content.posterUrl,
        contentKeys: Object.keys(content).slice(0, 20),
      });
    }
  }, [content]);

  // DEBUG: Check which tab components are undefined
  useEffect(() => {
    console.log('[ContentDetailsScreen] Tab component checks:', {
      OverviewTab: typeof OverviewTab,
      CriminalCasesTab: typeof CriminalCasesTab,
      EpisodesTab: typeof EpisodesTab,
      CastTab: typeof CastTab,
      PlatformsTab: typeof PlatformsTab,
      ContentTabs: typeof ContentTabs,
    });
  }, []);

  // User actions
  const {
    addToList,
    removeFromList,
    updateRating,
    isUpdating,
    error: actionError
  } = useOptimisticContentActions(id as string);

  // Local state
  const [activeTab, setActiveTab] = useState('overview');

  // Scroll animations
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Floating header animation
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100, 200],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [-50, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  // TEMPORARILY DISABLED: Commenting out getTabs to isolate the undefined component
  /*
  const getTabs = (): TabConfig[] => {
    if (!content) return [];

    const tabs = [
      { id: 'overview', label: 'Overview', component: OverviewTab },
    ];

    // Add streaming platforms tab if available
    if (content.platforms && content.platforms.length > 0) {
      tabs.push({
        id: 'platforms',
        label: 'Stream',
        component: PlatformsTab,
        badge: content.platforms.length
      });
    }

    // Add episodes tab for TV series
    if (content.type === 'tv' && content.seasons && content.seasons.length > 0) {
      tabs.push({
        id: 'episodes',
        label: 'Episodes',
        component: EpisodesTab,
        badge: content.number_of_episodes
      });
    }

    // Add cast tab if available
    if ((content.cast && content.cast.length > 0) || (content.crew && content.crew.length > 0)) {
      tabs.push({
        id: 'cast',
        label: 'Cast & Crew',
        component: CastTab
      });
    }

    // Add criminal cases tab if available
    if (content.criminal_cases && content.criminal_cases.length > 0) {
      tabs.push({
        id: 'cases',
        label: 'True Crime',
        component: CriminalCasesTab,
        badge: content.criminal_cases.length
      });
    }

    return tabs;
  };
  */

  // Action handlers
  const handleAddToList = async (listType: TrackingListType) => {
    try {
      await addToList(listType);
    } catch (error) {
      Alert.alert('Error', 'Failed to add to list. Please try again.');
    }
  };

  const handleRate = async (rating: number) => {
    try {
      await updateRating(rating);
    } catch (error) {
      Alert.alert('Error', 'Failed to save rating. Please try again.');
    }
  };

  // Convert content to shareable format
  const getShareableContent = useCallback((): ShareableContent | null => {
    if (!content) return null;

    return {
      id: content.id,
      title: content.title,
      type: content.type,
      overview: content.overview,
      posterUrl: content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : undefined,
      backdropUrl: content.backdrop_path ? `https://image.tmdb.org/t/p/w1280${content.backdrop_path}` : undefined,
      releaseDate: content.release_date || content.first_air_date,
      rating: content.vote_average,
      platforms: content.platforms?.map(p => p.name) || [],
    };
  }, [content]);

  const handleShareComplete = useCallback((platform: string, success: boolean) => {
    if (success) {
      console.log(`Content shared successfully via ${platform}`);
    } else {
      console.log(`Share failed for platform ${platform}`);
    }
  }, []);

  // Loading state with skeleton - TEMPORARILY DISABLED ContentDetailSkeleton
  if (isLoading) {
    return (
      <View className="flex-1 bg-background-primary dark:bg-background-dark">
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <View className="flex-1 items-center justify-center">
          <Loading size="large" />
          <Text className="text-white mt-4">Loading content...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-background-primary dark:bg-background-dark" style={{ paddingTop: safeArea.paddingTop }}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Header with back button */}
        <View className="flex-row items-center p-4 bg-background-primary dark:bg-background-dark">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#dc2626"
            />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
            Content Details
          </Text>
        </View>

        <EmptyState
          title="Failed to Load Content"
          description={error.message || "We couldn't load the content details. Please check your connection and try again."}
          actionText="Retry"
          onAction={() => refetch()}
          className="flex-1 justify-center"
        />
      </View>
    );
  }

  // Content not found
  if (!content) {
    return (
      <View className="flex-1 bg-background-primary dark:bg-background-dark" style={{ paddingTop: safeArea.paddingTop }}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />

        {/* Header with back button */}
        <View className="flex-row items-center p-4 bg-background-primary dark:bg-background-dark">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#dc2626"
            />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-text-primary dark:text-text-dark-primary">
            Content Details
          </Text>
        </View>

        <EmptyState
          title="Content Not Found"
          description="The content you're looking for doesn't exist or has been removed."
          actionText="Go Back"
          onAction={() => router.back()}
          className="flex-1 justify-center"
        />
      </View>
    );
  }

  // TEMPORARILY DISABLED: const tabs = getTabs();

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Content details error:', error, errorInfo);
      }}
    >
      <View className="flex-1 bg-background-primary dark:bg-background-dark">
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          bounces={Platform.OS === 'ios'}
        >
          {/* Content Display */}
          <View className="p-4">
            {/* Poster and Title */}
            <View className="flex-row mb-4">
              {content.posterUrl && (
                <Image
                  source={{ uri: content.posterUrl }}
                  className="w-32 h-48 rounded-lg mr-4"
                  resizeMode="cover"
                />
              )}
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold mb-2">
                  {content.title}
                </Text>
                {content.releaseDate && (
                  <Text className="text-gray-400 text-sm mb-1">
                    Released: {new Date(content.releaseDate).getFullYear()}
                  </Text>
                )}
                {content.genreTags && content.genreTags.length > 0 && (
                  <View className="flex-row flex-wrap">
                    {content.genreTags.map((genre, index) => (
                      <View key={index} className="bg-primary-600 px-2 py-1 rounded mr-2 mb-2">
                        <Text className="text-white text-xs">{genre}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <Text className="text-white text-base leading-6">
              {content.description || content.overview || 'No overview available'}
            </Text>

            {/* Cast */}
            {content.cast && content.cast.length > 0 && (
              <View className="mt-4">
                <Text className="text-white text-lg font-semibold mb-2">Cast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {content.cast.slice(0, 10).map((person, index) => (
                    <View key={index} className="mr-3 items-center">
                      <View className="w-16 h-16 bg-gray-600 rounded-full mb-1" />
                      <Text className="text-white text-xs text-center w-16" numberOfLines={2}>
                        {person.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Streaming Platforms */}
            {content.platforms && content.platforms.length > 0 && (
              <View className="mt-4">
                <Text className="text-white text-lg font-semibold mb-2">Available On</Text>
                <View className="flex-row flex-wrap">
                  {content.platforms.map((platform, index) => (
                    <View key={index} className="bg-secondary-600 px-3 py-2 rounded mr-2 mb-2">
                      <Text className="text-white text-sm">{platform}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* TEMPORARILY DISABLED: Navigation Header - Floating over backdrop */}
          {/* ISSUE: Reanimated.View may be undefined on web, causing render crash */}
          {/*
          <Reanimated.View
            className="absolute top-0 left-0 right-0 flex-row items-center justify-between p-4 z-10"
            style={[{ paddingTop: safeArea.paddingTop }, headerAnimatedStyle]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-black/50 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </Reanimated.View>
          */}

          {/* Temporary static back button */}
          <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between p-4 z-10" style={{ paddingTop: safeArea.paddingTop }}>
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 bg-black/50 rounded-full"
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>

          {/* COMMENTED OUT: Content Header
          <ContentHeader content={content} scrollY={scrollY} />
          */}

          {/* COMMENTED OUT: ShareButton in floating header
          {content && getShareableContent() && (
            <ShareButton
              content={getShareableContent()!}
              variant="icon"
              size="medium"
              onShareComplete={handleShareComplete}
            />
          )}
          */}

          {/* COMMENTED OUT: User Actions
          <UserActions
            content={content}
            onAddToList={handleAddToList}
            onRate={handleRate}
            shareableContent={getShareableContent()}
            onShareComplete={handleShareComplete}
          />
          */}

          {/* COMMENTED OUT: Content Tabs
          {tabs.length > 0 && (
            <ContentTabs
              content={content}
              tabs={tabs}
              initialTab={activeTab}
              onTabChange={setActiveTab}
            />
          )}
          */}
        </ScrollView>

        {/* Update indicator */}
        {isUpdating && (
          <View className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-3 flex-row items-center">
            <Loading size="small" className="mr-3" />
            <Text className="text-white text-sm">Updating...</Text>
          </View>
        )}

        {/* Action error indicator */}
        {actionError && (
          <View className="absolute bottom-4 left-4 right-4 bg-error-600 rounded-lg p-3 flex-row items-center">
            <View className="mr-3">
              <Ionicons name="alert-circle" size={20} color="white" />
            </View>
            <Text className="text-white text-sm flex-1">
              {actionError.message || 'An error occurred'}
            </Text>
            <TouchableOpacity onPress={() => {/* Clear error logic can be added */}}>
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ErrorBoundary>
  );
}
