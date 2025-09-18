---
title: Content Tracking - Implementation Guide
description: React Native implementation guide with code examples and technical specifications
feature: Content Tracking
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - README.md
  - user-journey.md
  - screen-states.md
  - ../../design-system/style-guide.md
dependencies:
  - React Native/Expo framework
  - TypeScript for type safety
  - AsyncStorage for local persistence
  - React Navigation for screen management
  - React Query for state management
status: approved
---

# Content Tracking - Implementation Guide

## Overview

This guide provides comprehensive React Native implementation details for the content tracking feature, including component architecture, state management, and platform-specific optimizations. All code examples use TypeScript and follow the established design system.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Components](#core-components)
3. [State Management](#state-management)
4. [Data Models](#data-models)
5. [Screen Implementations](#screen-implementations)
6. [Platform Integration](#platform-integration)
7. [Performance Optimizations](#performance-optimizations)

---

## Architecture Overview

### Technical Stack

```typescript
// Core dependencies
import { ReactNative, Expo } from '@expo/core';
import { TypeScript } from 'typescript';
import { ReactQuery } from '@tanstack/react-query';
import { AsyncStorage } from '@react-native-async-storage/async-storage';
import { ReactNavigation } from '@react-navigation/native';
import { Reanimated } from 'react-native-reanimated';
```

### Component Hierarchy

```
ContentTracking/
├── components/
│   ├── QuickAdd/
│   │   ├── QuickAddButton.tsx
│   │   ├── StatusSelector.tsx
│   │   └── ManualEntry.tsx
│   ├── Dashboard/
│   │   ├── TrackingDashboard.tsx
│   │   ├── StatusTabs.tsx
│   │   ├── ContentGrid.tsx
│   │   └── ContentCard.tsx
│   ├── Detail/
│   │   ├── ContentDetail.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── NotesEditor.tsx
│   │   └── EpisodeList.tsx
│   └── Lists/
│       ├── CustomLists.tsx
│       ├── ListCreator.tsx
│       └── ListDetail.tsx
├── hooks/
│   ├── useTracking.ts
│   ├── useContentSync.ts
│   ├── useStatusUpdates.ts
│   └── useProgressTracker.ts
├── services/
│   ├── TrackingService.ts
│   ├── SyncService.ts
│   └── StorageService.ts
└── types/
    ├── tracking.types.ts
    ├── content.types.ts
    └── sync.types.ts
```

---

## Core Components

### QuickAddButton Component

```typescript
// components/QuickAdd/QuickAddButton.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { Haptics } from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { tokens } from '../../design-system/tokens';
import { TrackingStatus, ContentItem } from '../../types';

interface QuickAddButtonProps {
  content: ContentItem;
  onStatusChange: (status: TrackingStatus) => void;
  style?: ViewStyle;
}

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  content,
  onStatusChange,
  style
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  const handlePress = async () => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsExpanded(true);

    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 200,
      friction: 25,
      useNativeDriver: true,
    }).start();
  };

  const handleStatusSelect = async (status: TrackingStatus) => {
    // Haptic feedback for selection
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onStatusChange(status);

    // Animate closure
    Animated.spring(animatedValue, {
      toValue: 0,
      tension: 200,
      friction: 25,
      useNativeDriver: true,
    }).start(() => {
      setIsExpanded(false);
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Quick Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityLabel="Add to tracking"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.buttonInner,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.9],
                  }),
                },
              ],
            },
          ]}
        >
          <PlusIcon size={20} color={tokens.colors.white} />
        </Animated.View>
      </TouchableOpacity>

      {/* Status Selection Modal */}
      {isExpanded && (
        <Animated.View
          style={[
            styles.statusModal,
            {
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
              opacity: animatedValue,
            },
          ]}
        >
          <BlurView intensity={95} tint="light" style={styles.blurContainer}>
            <StatusSelector
              onStatusSelect={handleStatusSelect}
              onDismiss={() => setIsExpanded(false)}
            />
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    zIndex: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusModal: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 280,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  blurContainer: {
    padding: tokens.spacing.md,
  },
});
```

### ContentCard Component

```typescript
// components/Dashboard/ContentCard.tsx
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../design-system/tokens';
import { ContentItem, TrackingStatus } from '../../types';

interface ContentCardProps {
  content: ContentItem;
  status: TrackingStatus;
  progress?: number;
  onPress: () => void;
  onStatusChange: (status: TrackingStatus) => void;
  style?: ViewStyle;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  status,
  progress = 0,
  onPress,
  onStatusChange,
  style
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getStatusColor = (status: TrackingStatus): string => {
    switch (status) {
      case 'want-to-watch': return tokens.colors.info;
      case 'currently-watching': return tokens.colors.warning;
      case 'completed': return tokens.colors.success;
      case 'on-hold': return tokens.colors.warning;
      case 'abandoned': return tokens.colors.neutral[500];
      default: return tokens.colors.neutral[400];
    }
  };

  const renderProgressIndicator = () => {
    if (status !== 'currently-watching' || !progress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` }
            ]}
          />
        </View>
      </View>
    );
  };

  const renderStatusBadge = () => (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: getStatusColor(status) }
      ]}
    >
      <StatusIcon status={status} size={16} color={tokens.colors.white} />
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.touchable}
        accessibilityLabel={`${content.title} - ${status}`}
        accessibilityRole="button"
      >
        {/* Content Poster */}
        <View style={styles.posterContainer}>
          <Image
            source={{ uri: content.posterUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
          {renderStatusBadge()}

          {/* Content Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
            style={styles.overlay}
          >
            <View style={styles.contentInfo}>
              <Text style={styles.title} numberOfLines={2}>
                {content.title}
              </Text>
              <Text style={styles.metadata} numberOfLines={1}>
                {content.year} • {content.type}
              </Text>
              {content.rating && (
                <View style={styles.ratingContainer}>
                  <StarRating rating={content.rating} size={12} />
                </View>
              )}
            </View>
          </LinearGradient>

          {renderProgressIndicator()}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  touchable: {
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: tokens.colors.surface,
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  posterContainer: {
    aspectRatio: 0.75, // 3:4 aspect ratio
    position: 'relative',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: tokens.spacing.sm,
    right: tokens.spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    justifyContent: 'flex-end',
    padding: tokens.spacing.md,
  },
  contentInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    ...tokens.typography.h4,
    color: tokens.colors.white,
    marginBottom: tokens.spacing.xs,
  },
  metadata: {
    ...tokens.typography.caption,
    color: tokens.colors.white,
    opacity: 0.8,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginTop: tokens.spacing.xs,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.primary,
  },
});
```

---

## State Management

### Tracking Hook

```typescript
// hooks/useTracking.ts
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrackingService } from '../services/TrackingService';
import { StorageService } from '../services/StorageService';
import { ContentItem, TrackingStatus, UserTracking } from '../types';

interface UseTrackingOptions {
  userId: string;
  enableSync?: boolean;
}

export const useTracking = ({ userId, enableSync = true }: UseTrackingOptions) => {
  const queryClient = useQueryClient();

  // Fetch user's tracking data
  const {
    data: trackingData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tracking', userId],
    queryFn: () => TrackingService.getUserTracking(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update content status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      contentId,
      status,
      progress
    }: {
      contentId: string;
      status: TrackingStatus;
      progress?: number;
    }) => {
      // Optimistic update to local storage first
      await StorageService.updateContentStatus(userId, contentId, status, progress);

      // Then sync to server if enabled
      if (enableSync) {
        return TrackingService.updateContentStatus(userId, contentId, status, progress);
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate tracking queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['tracking', userId] });
    },
    onError: async (error, variables) => {
      // Rollback optimistic update on failure
      console.error('Status update failed:', error);
      await StorageService.rollbackStatusUpdate(userId, variables.contentId);
      queryClient.invalidateQueries({ queryKey: ['tracking', userId] });
    },
  });

  // Batch status update mutation
  const batchUpdateMutation = useMutation({
    mutationFn: async (updates: Array<{
      contentId: string;
      status: TrackingStatus;
      progress?: number;
    }>) => {
      // Update all items locally first
      await Promise.all(
        updates.map(update =>
          StorageService.updateContentStatus(
            userId,
            update.contentId,
            update.status,
            update.progress
          )
        )
      );

      // Sync to server if enabled
      if (enableSync) {
        return TrackingService.batchUpdateStatus(userId, updates);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking', userId] });
    },
  });

  // Helper functions
  const getContentStatus = useCallback((contentId: string): TrackingStatus | null => {
    return trackingData?.items?.[contentId]?.status || null;
  }, [trackingData]);

  const getContentProgress = useCallback((contentId: string): number => {
    return trackingData?.items?.[contentId]?.progress || 0;
  }, [trackingData]);

  const isContentTracked = useCallback((contentId: string): boolean => {
    return Boolean(trackingData?.items?.[contentId]);
  }, [trackingData]);

  const getContentsByStatus = useCallback((status: TrackingStatus): ContentItem[] => {
    if (!trackingData?.items) return [];

    return Object.entries(trackingData.items)
      .filter(([_, item]) => item.status === status)
      .map(([contentId, item]) => ({
        ...item.content,
        id: contentId,
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [trackingData]);

  const addToTracking = useCallback(async (
    content: ContentItem,
    status: TrackingStatus = 'want-to-watch'
  ) => {
    await updateStatusMutation.mutateAsync({
      contentId: content.id,
      status,
    });
  }, [updateStatusMutation]);

  const updateStatus = useCallback(async (
    contentId: string,
    status: TrackingStatus,
    progress?: number
  ) => {
    await updateStatusMutation.mutateAsync({
      contentId,
      status,
      progress,
    });
  }, [updateStatusMutation]);

  const batchUpdateStatus = useCallback(async (
    updates: Array<{
      contentId: string;
      status: TrackingStatus;
      progress?: number;
    }>
  ) => {
    await batchUpdateMutation.mutateAsync(updates);
  }, [batchUpdateMutation]);

  // Statistics
  const statistics = useMemo(() => {
    if (!trackingData?.items) {
      return {
        total: 0,
        wantToWatch: 0,
        currentlyWatching: 0,
        completed: 0,
        onHold: 0,
        abandoned: 0,
      };
    }

    const items = Object.values(trackingData.items);
    return {
      total: items.length,
      wantToWatch: items.filter(item => item.status === 'want-to-watch').length,
      currentlyWatching: items.filter(item => item.status === 'currently-watching').length,
      completed: items.filter(item => item.status === 'completed').length,
      onHold: items.filter(item => item.status === 'on-hold').length,
      abandoned: items.filter(item => item.status === 'abandoned').length,
    };
  }, [trackingData]);

  return {
    // Data
    trackingData,
    statistics,

    // Loading states
    isLoading,
    isUpdating: updateStatusMutation.isLoading || batchUpdateMutation.isLoading,

    // Error states
    error,
    updateError: updateStatusMutation.error,

    // Helper functions
    getContentStatus,
    getContentProgress,
    isContentTracked,
    getContentsByStatus,

    // Actions
    addToTracking,
    updateStatus,
    batchUpdateStatus,
    refetch,
  };
};
```

---

## Data Models

### TypeScript Type Definitions

```typescript
// types/tracking.types.ts
export type TrackingStatus =
  | 'want-to-watch'
  | 'currently-watching'
  | 'completed'
  | 'on-hold'
  | 'abandoned';

export type ContentType =
  | 'documentary'
  | 'series'
  | 'movie'
  | 'podcast'
  | 'limited-series';

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  year: number;
  duration?: number; // minutes
  episodeCount?: number;
  seasonCount?: number;
  posterUrl: string;
  description: string;
  genres: string[];
  platforms: Platform[];
  rating?: number; // 1-5
  tmdbId?: string;
  imdbId?: string;
  cases?: string[]; // Related True Crime cases
}

export interface Platform {
  id: string;
  name: string;
  type: 'streaming' | 'cable' | 'rental' | 'purchase';
  url?: string;
  price?: number;
  currency?: string;
  quality?: 'SD' | 'HD' | '4K';
  available: boolean;
}

export interface TrackingItem {
  contentId: string;
  content: ContentItem;
  status: TrackingStatus;
  progress: number; // 0-1 for overall progress
  episodeProgress?: EpisodeProgress[];
  rating?: number; // User's personal rating 1-5
  notes?: string;
  tags?: string[];
  platformPreference?: string;
  dateAdded: string;
  dateStarted?: string;
  dateCompleted?: string;
  lastUpdated: string;
  viewingHistory: ViewingSession[];
}

export interface EpisodeProgress {
  seasonNumber: number;
  episodeNumber: number;
  completed: boolean;
  watchedAt?: string;
  progress?: number; // 0-1 for partial viewing
}

export interface ViewingSession {
  id: string;
  platform: string;
  startTime: string;
  endTime?: string;
  progress: number;
  device?: string;
}

export interface UserTracking {
  userId: string;
  items: Record<string, TrackingItem>; // contentId -> TrackingItem
  lists: CustomList[];
  preferences: TrackingPreferences;
  statistics: TrackingStatistics;
  lastSyncAt: string;
  version: number;
}

export interface CustomList {
  id: string;
  name: string;
  description?: string;
  contentIds: string[];
  coverImageUrl?: string;
  isPublic: boolean;
  allowCollaboration: boolean;
  createdAt: string;
  updatedAt: string;
  collaborators?: string[];
  tags?: string[];
}

export interface TrackingPreferences {
  autoMarkCompleted: boolean;
  enableNotifications: boolean;
  defaultStatus: TrackingStatus;
  privacyLevel: 'private' | 'friends' | 'public';
  shareCompletions: boolean;
  shareRatings: boolean;
  shareLists: boolean;
}

export interface TrackingStatistics {
  totalTracked: number;
  totalCompleted: number;
  totalHoursWatched: number;
  averageRating: number;
  completionRate: number;
  platformDistribution: Record<string, number>;
  contentTypeDistribution: Record<ContentType, number>;
  monthlyActivity: Record<string, number>; // YYYY-MM -> count
}
```

---

## Screen Implementations

### Tracking Dashboard Screen

```typescript
// screens/TrackingDashboard.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tokens } from '../design-system/tokens';
import { useTracking } from '../hooks/useTracking';
import { useUser } from '../hooks/useUser';
import { TrackingStatus, ContentItem } from '../types';

// Component imports
import { DashboardHeader } from '../components/Dashboard/DashboardHeader';
import { StatusTabs } from '../components/Dashboard/StatusTabs';
import { ContentGrid } from '../components/Dashboard/ContentGrid';
import { EmptyState } from '../components/Dashboard/EmptyState';
import { FloatingActionButton } from '../components/Dashboard/FloatingActionButton';

export const TrackingDashboardScreen: React.FC = () => {
  const { user } = useUser();
  const [activeStatus, setActiveStatus] = useState<TrackingStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    trackingData,
    statistics,
    isLoading,
    getContentsByStatus,
    refetch,
    updateStatus
  } = useTracking({
    userId: user.id,
    enableSync: true
  });

  // Filter content based on active status
  const filteredContent = useMemo(() => {
    if (activeStatus === 'all') {
      return Object.values(trackingData?.items || {})
        .map(item => ({
          ...item.content,
          status: item.status,
          progress: item.progress,
        }))
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }

    return getContentsByStatus(activeStatus);
  }, [trackingData, activeStatus, getContentsByStatus]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Focus effect to refresh data when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Status change handler
  const handleStatusChange = useCallback(async (
    contentId: string,
    newStatus: TrackingStatus
  ) => {
    try {
      await updateStatus(contentId, newStatus);
    } catch (error) {
      console.error('Failed to update status:', error);
      // Show error toast or alert
    }
  }, [updateStatus]);

  // Content press handler (navigate to detail)
  const handleContentPress = useCallback((content: ContentItem) => {
    navigation.navigate('ContentDetail', { contentId: content.id });
  }, [navigation]);

  // Render empty state
  const renderEmptyState = () => (
    <EmptyState
      status={activeStatus}
      onExplorePress={() => navigation.navigate('Discovery')}
    />
  );

  // Status tabs configuration
  const statusTabs = useMemo(() => [
    { key: 'all', label: 'All', count: statistics.total },
    { key: 'want-to-watch', label: 'Want to Watch', count: statistics.wantToWatch },
    { key: 'currently-watching', label: 'Watching', count: statistics.currentlyWatching },
    { key: 'completed', label: 'Completed', count: statistics.completed },
    { key: 'on-hold', label: 'On Hold', count: statistics.onHold },
  ], [statistics]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={tokens.colors.background.dark} />

      {/* Dashboard Header */}
      <DashboardHeader
        userName={user.name}
        statistics={statistics}
        isLoading={isLoading}
      />

      {/* Status Tabs */}
      <StatusTabs
        tabs={statusTabs}
        activeTab={activeStatus}
        onTabPress={setActiveStatus}
      />

      {/* Content Grid */}
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredContent.length > 0 ? (
          <ContentGrid
            content={filteredContent}
            isLoading={isLoading}
            onContentPress={handleContentPress}
            onStatusChange={handleStatusChange}
          />
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => navigation.navigate('Discovery')}
        icon="plus"
        label="Add Content"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.dark,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
  },
});
```

---

## Platform Integration

### Sync Service Implementation

```typescript
// services/SyncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { UserTracking, TrackingItem, SyncQueue } from '../types';

export class SyncService {
  private static syncQueue: SyncQueue[] = [];
  private static isSyncing = false;
  private static syncInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize sync service with automatic background sync
   */
  static async initialize() {
    // Start periodic sync every 5 minutes
    this.syncInterval = setInterval(() => {
      this.performBackgroundSync();
    }, 5 * 60 * 1000);

    // Sync when network becomes available
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.performBackgroundSync();
      }
    });

    // Sync any pending items on initialization
    await this.processSyncQueue();
  }

  /**
   * Add tracking update to sync queue for offline support
   */
  static async queueTrackingUpdate(
    userId: string,
    contentId: string,
    updates: Partial<TrackingItem>
  ): Promise<void> {
    const queueItem: SyncQueue = {
      id: `${Date.now()}-${Math.random()}`,
      type: 'tracking_update',
      userId,
      contentId,
      data: updates,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);

    // Save queue to local storage
    await AsyncStorage.setItem(
      'sync_queue',
      JSON.stringify(this.syncQueue)
    );

    // Try to sync immediately if online
    const networkState = await NetInfo.fetch();
    if (networkState.isConnected) {
      this.processSyncQueue();
    }
  }

  /**
   * Process queued sync items
   */
  static async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    this.isSyncing = true;

    try {
      // Load queue from storage if needed
      if (this.syncQueue.length === 0) {
        await this.loadSyncQueue();
      }

      const processedItems: string[] = [];

      for (const item of this.syncQueue) {
        try {
          await this.processSyncItem(item);
          processedItems.push(item.id);
        } catch (error) {
          console.error('Sync item failed:', error);

          // Increment retry count
          item.retryCount++;

          // Remove item if max retries reached
          if (item.retryCount >= 3) {
            console.error('Max retries reached for sync item:', item.id);
            processedItems.push(item.id);
          }
        }
      }

      // Remove processed items from queue
      this.syncQueue = this.syncQueue.filter(
        item => !processedItems.includes(item.id)
      );

      // Update stored queue
      await AsyncStorage.setItem(
        'sync_queue',
        JSON.stringify(this.syncQueue)
      );

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync user's complete tracking data
   */
  static async syncUserTracking(userId: string): Promise<UserTracking | null> {
    try {
      // Fetch from server
      const serverData = await this.fetchUserTrackingFromServer(userId);

      // Get local data
      const localData = await this.getLocalTrackingData(userId);

      if (!localData) {
        // First time sync - save server data locally
        await this.saveLocalTrackingData(userId, serverData);
        return serverData;
      }

      // Merge server and local data
      const mergedData = await this.mergeTrackingData(localData, serverData);

      // Save merged data locally
      await this.saveLocalTrackingData(userId, mergedData);

      // Update server with merged data if needed
      if (this.hasLocalChanges(localData, serverData)) {
        await this.updateServerTrackingData(userId, mergedData);
      }

      return mergedData;

    } catch (error) {
      console.error('Sync failed:', error);

      // Return local data if sync fails
      return await this.getLocalTrackingData(userId);
    }
  }

  /**
   * Handle offline content status updates
   */
  static async updateContentStatusOffline(
    userId: string,
    contentId: string,
    status: TrackingStatus,
    progress?: number
  ): Promise<void> {
    // Update local storage immediately
    const localData = await this.getLocalTrackingData(userId);
    if (!localData) return;

    const existingItem = localData.items[contentId];
    const updatedItem: TrackingItem = {
      ...existingItem,
      status,
      progress: progress ?? existingItem?.progress ?? 0,
      lastUpdated: new Date().toISOString(),
    };

    localData.items[contentId] = updatedItem;
    localData.lastSyncAt = new Date().toISOString();

    await this.saveLocalTrackingData(userId, localData);

    // Queue for sync
    await this.queueTrackingUpdate(userId, contentId, {
      status,
      progress,
      lastUpdated: updatedItem.lastUpdated,
    });
  }

  /**
   * Resolve sync conflicts using last-write-wins strategy
   */
  private static async mergeTrackingData(
    localData: UserTracking,
    serverData: UserTracking
  ): Promise<UserTracking> {
    const merged: UserTracking = {
      ...serverData,
      items: { ...serverData.items },
    };

    // Merge tracking items using last-write-wins
    for (const [contentId, localItem] of Object.entries(localData.items)) {
      const serverItem = serverData.items[contentId];

      if (!serverItem) {
        // Item only exists locally - keep it
        merged.items[contentId] = localItem;
      } else {
        // Compare timestamps and keep most recent
        const localTimestamp = new Date(localItem.lastUpdated).getTime();
        const serverTimestamp = new Date(serverItem.lastUpdated).getTime();

        if (localTimestamp > serverTimestamp) {
          merged.items[contentId] = localItem;
        } else {
          merged.items[contentId] = serverItem;
        }
      }
    }

    return merged;
  }

  // Helper methods for storage operations
  private static async getLocalTrackingData(userId: string): Promise<UserTracking | null> {
    try {
      const data = await AsyncStorage.getItem(`tracking_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get local tracking data:', error);
      return null;
    }
  }

  private static async saveLocalTrackingData(
    userId: string,
    data: UserTracking
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(`tracking_${userId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save local tracking data:', error);
    }
  }

  private static async loadSyncQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem('sync_queue');
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  // Network operations (implement based on your API)
  private static async fetchUserTrackingFromServer(userId: string): Promise<UserTracking> {
    // Implement API call to fetch user tracking data
    throw new Error('Not implemented');
  }

  private static async updateServerTrackingData(
    userId: string,
    data: UserTracking
  ): Promise<void> {
    // Implement API call to update server data
    throw new Error('Not implemented');
  }

  private static async processSyncItem(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'tracking_update':
        // Implement API call for tracking update
        break;
      case 'list_create':
        // Implement API call for list creation
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  private static hasLocalChanges(
    localData: UserTracking,
    serverData: UserTracking
  ): boolean {
    return new Date(localData.lastSyncAt) > new Date(serverData.lastSyncAt);
  }

  private static async performBackgroundSync(): Promise<void> {
    // Implement background sync logic
    await this.processSyncQueue();
  }
}
```

---

## Performance Optimizations

### Optimized Content Grid

```typescript
// components/Dashboard/OptimizedContentGrid.tsx
import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo
} from 'react-native';
import { ContentCard } from './ContentCard';
import { ContentItem, TrackingStatus } from '../../types';
import { tokens } from '../../design-system/tokens';

interface OptimizedContentGridProps {
  content: ContentItem[];
  isLoading: boolean;
  onContentPress: (content: ContentItem) => void;
  onStatusChange: (contentId: string, status: TrackingStatus) => void;
}

export const OptimizedContentGrid: React.FC<OptimizedContentGridProps> = ({
  content,
  isLoading,
  onContentPress,
  onStatusChange
}) => {
  const screenWidth = Dimensions.get('window').width;
  const itemMargin = tokens.spacing.md;
  const numColumns = screenWidth > 768 ? 4 : screenWidth > 480 ? 3 : 2;
  const itemWidth = (screenWidth - (itemMargin * (numColumns + 1))) / numColumns;

  // Memoize item size for performance
  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: itemWidth * 1.33 + itemMargin, // aspect ratio 3:4 + margin
      offset: (itemWidth * 1.33 + itemMargin) * Math.floor(index / numColumns),
      index,
    }),
    [itemWidth, numColumns, itemMargin]
  );

  // Memoize render item for performance
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ContentItem>) => (
      <View
        style={[
          styles.itemContainer,
          {
            width: itemWidth,
            marginLeft: index % numColumns === 0 ? itemMargin : itemMargin / 2,
            marginRight: index % numColumns === numColumns - 1 ? itemMargin : itemMargin / 2,
          }
        ]}
      >
        <ContentCard
          content={item}
          status={item.status}
          progress={item.progress}
          onPress={() => onContentPress(item)}
          onStatusChange={(status) => onStatusChange(item.id, status)}
        />
      </View>
    ),
    [itemWidth, numColumns, itemMargin, onContentPress, onStatusChange]
  );

  // Memoize key extractor
  const keyExtractor = useCallback(
    (item: ContentItem) => item.id,
    []
  );

  return (
    <FlatList
      data={content}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // Force re-render on orientation change
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={10}
      updateCellsBatchingPeriod={50}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing.md,
  },
  itemContainer: {
    marginBottom: tokens.spacing.md,
  },
});
```

### Image Caching and Optimization

```typescript
// components/common/OptimizedImage.tsx
import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ImageStyle,
  ViewStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system';
import { tokens } from '../../design-system/tokens';

interface OptimizedImageProps {
  uri: string;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  style,
  containerStyle,
  placeholder = true,
  resizeMode = 'cover'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cachedUri, setCachedUri] = useState<string>(uri);

  // Cache image locally
  React.useEffect(() => {
    const cacheImage = async () => {
      try {
        const filename = uri.split('/').pop();
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        // Check if image is already cached
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        if (fileInfo.exists) {
          setCachedUri(fileInfo.uri);
        } else {
          // Download and cache image
          const downloadResult = await FileSystem.downloadAsync(uri, fileUri);
          if (downloadResult.status === 200) {
            setCachedUri(downloadResult.uri);
          }
        }
      } catch (error) {
        console.warn('Image caching failed:', error);
        // Fall back to original URI
        setCachedUri(uri);
      }
    };

    if (uri) {
      cacheImage();
    }
  }, [uri]);

  const handleLoadStart = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const renderPlaceholder = () => (
    <LinearGradient
      colors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.placeholder, style]}
    />
  );

  const renderErrorPlaceholder = () => (
    <View style={[styles.errorPlaceholder, style]}>
      <Text style={styles.errorText}>Image unavailable</Text>
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {hasError ? (
        renderErrorPlaceholder()
      ) : (
        <>
          <Image
            source={{ uri: cachedUri }}
            style={[styles.image, style]}
            resizeMode={resizeMode}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
          {isLoading && placeholder && renderPlaceholder()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: tokens.colors.neutral[200],
  },
  errorPlaceholder: {
    backgroundColor: tokens.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...tokens.typography.caption,
    color: tokens.colors.neutral[500],
  },
});
```

---

This comprehensive implementation guide provides the foundation for building the content tracking feature with React Native. The code examples demonstrate best practices for performance, offline functionality, and user experience while maintaining consistency with the True Crime application's design system and requirements.

Key implementation highlights:

1. **Optimistic Updates**: Immediate UI feedback with server sync
2. **Offline Support**: Full functionality without internet connection
3. **Performance Optimization**: Efficient rendering and image caching
4. **Type Safety**: Complete TypeScript coverage
5. **Accessibility**: WCAG-compliant components with proper labels
6. **Platform Integration**: Cross-platform sync with conflict resolution
7. **Error Handling**: Graceful degradation and user feedback
8. **Design System Integration**: Consistent styling and component usage

This implementation ensures the content tracking feature provides excellent user experience while supporting the complex requirements of tracking True Crime content across 200+ platforms.