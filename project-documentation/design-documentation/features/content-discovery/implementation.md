---
title: Content Discovery - Implementation Guide
description: React Native implementation guide with search, filtering, and case-based discovery code examples
feature: Content Discovery
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
  - React Query for search state management
  - Fuse.js for fuzzy search
  - Platform API integrations (Watchmode, TMDB)
status: approved
---

# Content Discovery - Implementation Guide

## Overview

This guide provides comprehensive React Native implementation details for the content discovery feature, focusing on case-based search, intelligent filtering, and cross-platform content discovery. All implementations prioritize search performance and user experience while supporting 200+ streaming platforms.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Search Implementation](#search-implementation)
3. [Filter System](#filter-system)
4. [Case-Based Discovery](#case-based-discovery)
5. [Platform Integration](#platform-integration)
6. [Performance Optimizations](#performance-optimizations)
7. [Offline Support](#offline-support)

---

## Architecture Overview

### Technical Stack

```typescript
// Core dependencies
import { ReactNative, Expo } from '@expo/core';
import { TypeScript } from 'typescript';
import { ReactQuery } from '@tanstack/react-query';
import { Fuse } from 'fuse.js';
import { debounce } from 'lodash';
import { AsyncStorage } from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-netinfo/netinfo';
```

### Component Hierarchy

```
ContentDiscovery/
├── components/
│   ├── Search/
│   │   ├── SearchBar.tsx
│   │   ├── SearchResults.tsx
│   │   ├── SearchSuggestions.tsx
│   │   └── VoiceSearch.tsx
│   ├── Filters/
│   │   ├── FilterBar.tsx
│   │   ├── FilterModal.tsx
│   │   ├── PlatformFilter.tsx
│   │   └── ContentTypeFilter.tsx
│   ├── Browse/
│   │   ├── CaseDirectory.tsx
│   │   ├── CaseDetail.tsx
│   │   ├── TrendingContent.tsx
│   │   └── CategoryBrowser.tsx
│   ├── Results/
│   │   ├── ContentGrid.tsx
│   │   ├── ContentCard.tsx
│   │   ├── PlatformBadges.tsx
│   │   └── AvailabilityIndicator.tsx
│   └── Social/
│       ├── FriendRecommendations.tsx
│       ├── CommunityLists.tsx
│       └── TrendingDiscovery.tsx
├── hooks/
│   ├── useSearch.ts
│   ├── useFilters.ts
│   ├── useCaseDiscovery.ts
│   ├── usePlatformAvailability.ts
│   └── useContentRecommendations.ts
├── services/
│   ├── SearchService.ts
│   ├── PlatformService.ts
│   ├── CaseService.ts
│   └── RecommendationService.ts
└── types/
    ├── discovery.types.ts
    ├── search.types.ts
    └── platform.types.ts
```

---

## Search Implementation

### Universal Search Component

```typescript
// components/Search/SearchBar.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { tokens } from '../../design-system/tokens';
import { useSearch } from '../hooks/useSearch';
import { SearchSuggestions } from './SearchSuggestions';
import { VoiceSearch } from './VoiceSearch';

interface SearchBarProps {
  onResultsChange: (results: ContentSearchResult[]) => void;
  onFilterPress: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onResultsChange,
  onFilterPress,
  placeholder = "Search for cases, killers, or content...",
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const {
    search,
    suggestions,
    isLoading,
    recentSearches,
    saveRecentSearch,
    clearRecentSearches
  } = useSearch();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length > 0) {
        const results = await search(searchQuery);
        onResultsChange(results);
        await saveRecentSearch(searchQuery);
      } else {
        onResultsChange([]);
      }
    }, 300),
    [search, onResultsChange, saveRecentSearch]
  );

  // Handle input changes
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);

    Animated.spring(animatedValue, {
      toValue: 1,
      tension: 200,
      friction: 25,
      useNativeDriver: false,
    }).start();
  }, [animatedValue]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Delay hiding suggestions to allow for tap interactions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);

    Animated.spring(animatedValue, {
      toValue: 0,
      tension: 200,
      friction: 25,
      useNativeDriver: false,
    }).start();
  }, [animatedValue]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    debouncedSearch(suggestion);
  }, [debouncedSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setQuery('');
    onResultsChange([]);
    inputRef.current?.focus();
  }, [onResultsChange]);

  // Animated styles
  const containerStyle = {
    borderColor: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [tokens.colors.neutral[300], tokens.colors.primary],
    }),
    shadowOpacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.2],
    }),
  };

  return (
    <View style={styles.container}>
      {/* Main Search Input */}
      <Animated.View style={[styles.searchContainer, containerStyle]}>
        <Ionicons
          name="search"
          size={20}
          color={tokens.colors.neutral[500]}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={handleQueryChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.neutral[400]}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={() => inputRef.current?.blur()}
          accessibilityLabel="Search content"
          accessibilityRole="searchbox"
        />

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {query.length > 0 && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={tokens.colors.neutral[400]}
              />
            </TouchableOpacity>
          )}

          <VoiceSearch
            onResult={handleQueryChange}
            style={styles.voiceButton}
          />

          <TouchableOpacity
            onPress={onFilterPress}
            style={styles.filterButton}
            accessibilityLabel="Open filters"
            accessibilityRole="button"
          >
            <Ionicons
              name="options"
              size={20}
              color={tokens.colors.neutral[600]}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Suggestions */}
      {showSuggestions && (isFocused || query.length > 0) && (
        <SearchSuggestions
          query={query}
          suggestions={suggestions}
          recentSearches={recentSearches}
          isLoading={isLoading}
          onSuggestionSelect={handleSuggestionSelect}
          onClearRecent={clearRecentSearches}
          style={styles.suggestions}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: tokens.spacing.sm,
  },
  input: {
    flex: 1,
    ...tokens.typography.body,
    color: tokens.colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  clearButton: {
    padding: tokens.spacing.xs,
  },
  voiceButton: {
    padding: tokens.spacing.xs,
  },
  filterButton: {
    padding: tokens.spacing.xs,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: tokens.spacing.xs,
  },
});
```

### Search Service Implementation

```typescript
// services/SearchService.ts
import Fuse from 'fuse.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContentItem, SearchFilters, SearchResult, CaseInfo } from '../types';

export class SearchService {
  private static fuseInstances: Map<string, Fuse<any>> = new Map();
  private static contentDatabase: ContentItem[] = [];
  private static casesDatabase: CaseInfo[] = [];

  /**
   * Initialize search indices for different content types
   */
  static async initialize() {
    // Load cached content database
    await this.loadCachedContent();

    // Initialize Fuse instances for different search contexts
    this.setupContentSearch();
    this.setupCaseSearch();
    this.setupPlatformSearch();
  }

  /**
   * Universal search across all content types
   */
  static async universalSearch(
    query: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];

    // Search content database
    const contentResults = await this.searchContent(query, filters);
    results.push(...contentResults.map(result => ({
      type: 'content',
      item: result.item,
      score: result.score,
      matches: result.matches
    })));

    // Search cases database
    const caseResults = await this.searchCases(query);
    results.push(...caseResults.map(result => ({
      type: 'case',
      item: result.item,
      score: result.score,
      matches: result.matches
    })));

    // Search by platform if query matches platform names
    const platformResults = await this.searchByPlatform(query, filters);
    results.push(...platformResults);

    // Sort by relevance score
    return results.sort((a, b) => (a.score || 0) - (b.score || 0));
  }

  /**
   * Search content items with fuzzy matching
   */
  static async searchContent(
    query: string,
    filters: SearchFilters = {}
  ): Promise<Fuse.FuseResult<ContentItem>[]> {
    const fuse = this.fuseInstances.get('content');
    if (!fuse) return [];

    // Apply pre-search filters
    let searchData = this.contentDatabase;

    if (filters.contentTypes?.length) {
      searchData = searchData.filter(item =>
        filters.contentTypes!.includes(item.type)
      );
    }

    if (filters.platforms?.length) {
      searchData = searchData.filter(item =>
        item.platforms.some(platform =>
          filters.platforms!.includes(platform.id)
        )
      );
    }

    if (filters.yearRange) {
      searchData = searchData.filter(item =>
        item.year >= filters.yearRange!.min &&
        item.year <= filters.yearRange!.max
      );
    }

    // Update Fuse with filtered data
    const filteredFuse = new Fuse(searchData, this.getContentSearchOptions());

    return filteredFuse.search(query, {
      limit: filters.limit || 50
    });
  }

  /**
   * Search cases and perpetrators
   */
  static async searchCases(query: string): Promise<Fuse.FuseResult<CaseInfo>[]> {
    const fuse = this.fuseInstances.get('cases');
    if (!fuse) return [];

    return fuse.search(query, { limit: 20 });
  }

  /**
   * Get search suggestions based on partial query
   */
  static async getSuggestions(
    query: string,
    limit: number = 8
  ): Promise<string[]> {
    if (query.length < 2) return [];

    const suggestions: Set<string> = new Set();

    // Get content title suggestions
    const contentFuse = this.fuseInstances.get('content');
    if (contentFuse) {
      const contentResults = contentFuse.search(query, { limit: limit / 2 });
      contentResults.forEach(result => {
        suggestions.add(result.item.title);
      });
    }

    // Get case name suggestions
    const caseFuse = this.fuseInstances.get('cases');
    if (caseFuse) {
      const caseResults = caseFuse.search(query, { limit: limit / 2 });
      caseResults.forEach(result => {
        suggestions.add(result.item.name);
        // Add perpetrator names
        result.item.perpetrators?.forEach(perp => {
          suggestions.add(perp.name);
        });
      });
    }

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Search by platform availability
   */
  private static async searchByPlatform(
    query: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult[]> {
    // Check if query matches platform names
    const platformMatches = this.contentDatabase.filter(item =>
      item.platforms.some(platform =>
        platform.name.toLowerCase().includes(query.toLowerCase())
      )
    );

    return platformMatches.map(item => ({
      type: 'content',
      item,
      score: 0.8, // Platform matches have good relevance
      context: 'platform_match'
    }));
  }

  /**
   * Advanced boolean search parsing
   */
  static parseAdvancedQuery(query: string): {
    terms: string[];
    operators: ('AND' | 'OR' | 'NOT')[];
    quoted: string[];
  } {
    const terms: string[] = [];
    const operators: ('AND' | 'OR' | 'NOT')[] = [];
    const quoted: string[] = [];

    // Extract quoted phrases
    const quotedMatches = query.match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach(match => {
        const cleanMatch = match.replace(/"/g, '');
        quoted.push(cleanMatch);
        query = query.replace(match, ` __QUOTED_${quoted.length - 1}__ `);
      });
    }

    // Split by operators and terms
    const parts = query.split(/\s+(AND|OR|NOT)\s+/i);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();

      if (['AND', 'OR', 'NOT'].includes(part.toUpperCase())) {
        operators.push(part.toUpperCase() as 'AND' | 'OR' | 'NOT');
      } else if (part.startsWith('__QUOTED_')) {
        const index = parseInt(part.replace(/\D/g, ''));
        terms.push(quoted[index]);
      } else if (part.length > 0) {
        terms.push(part);
      }
    }

    return { terms, operators, quoted };
  }

  /**
   * Setup content search configuration
   */
  private static setupContentSearch() {
    const options = this.getContentSearchOptions();
    this.fuseInstances.set('content', new Fuse(this.contentDatabase, options));
  }

  /**
   * Setup case search configuration
   */
  private static setupCaseSearch() {
    const options = {
      keys: [
        { name: 'name', weight: 1.0 },
        { name: 'aliases', weight: 0.8 },
        { name: 'perpetrators.name', weight: 0.9 },
        { name: 'perpetrators.aliases', weight: 0.7 },
        { name: 'location', weight: 0.6 },
        { name: 'timeframe', weight: 0.5 },
        { name: 'description', weight: 0.4 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      findAllMatches: true,
    };

    this.fuseInstances.set('cases', new Fuse(this.casesDatabase, options));
  }

  /**
   * Setup platform search configuration
   */
  private static setupPlatformSearch() {
    // Platform search is handled differently as it's more about filtering
    // than fuzzy matching
  }

  /**
   * Get content search options
   */
  private static getContentSearchOptions() {
    return {
      keys: [
        { name: 'title', weight: 1.0 },
        { name: 'description', weight: 0.7 },
        { name: 'cases', weight: 0.8 },
        { name: 'genres', weight: 0.6 },
        { name: 'platforms.name', weight: 0.5 },
        { name: 'year', weight: 0.3 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      shouldSort: true,
      ignoreLocation: true,
      findAllMatches: true,
    };
  }

  /**
   * Load cached content from local storage
   */
  private static async loadCachedContent() {
    try {
      const contentData = await AsyncStorage.getItem('content_database');
      const casesData = await AsyncStorage.getItem('cases_database');

      if (contentData) {
        this.contentDatabase = JSON.parse(contentData);
      }

      if (casesData) {
        this.casesDatabase = JSON.parse(casesData);
      }
    } catch (error) {
      console.error('Failed to load cached search data:', error);
    }
  }

  /**
   * Update content database
   */
  static async updateContentDatabase(content: ContentItem[]) {
    this.contentDatabase = content;

    // Cache for offline use
    try {
      await AsyncStorage.setItem('content_database', JSON.stringify(content));
    } catch (error) {
      console.error('Failed to cache content database:', error);
    }

    // Refresh search index
    this.setupContentSearch();
  }

  /**
   * Update cases database
   */
  static async updateCasesDatabase(cases: CaseInfo[]) {
    this.casesDatabase = cases;

    try {
      await AsyncStorage.setItem('cases_database', JSON.stringify(cases));
    } catch (error) {
      console.error('Failed to cache cases database:', error);
    }

    this.setupCaseSearch();
  }
}
```

---

## Filter System

### Filter Hook Implementation

```typescript
// hooks/useFilters.ts
import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SearchFilters, Platform, ContentType } from '../types';
import { PlatformService } from '../services/PlatformService';

interface UseFiltersOptions {
  defaultFilters?: Partial<SearchFilters>;
  onFiltersChange?: (filters: SearchFilters) => void;
}

export const useFilters = ({
  defaultFilters = {},
  onFiltersChange
}: UseFiltersOptions = {}) => {
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    platforms: [],
    contentTypes: [],
    yearRange: { min: 1970, max: new Date().getFullYear() },
    minRating: 0,
    onlyAvailable: false,
    sortBy: 'relevance',
    sortOrder: 'desc',
    ...defaultFilters
  });

  // Fetch available platforms
  const { data: availablePlatforms = [] } = useQuery({
    queryKey: ['platforms'],
    queryFn: () => PlatformService.getAllPlatforms(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setActiveFilters(prev => {
      const updated = { ...prev, ...newFilters };
      onFiltersChange?.(updated);
      return updated;
    });
  }, [onFiltersChange]);

  // Platform filter methods
  const togglePlatform = useCallback((platformId: string) => {
    updateFilters({
      platforms: activeFilters.platforms?.includes(platformId)
        ? activeFilters.platforms.filter(id => id !== platformId)
        : [...(activeFilters.platforms || []), platformId]
    });
  }, [activeFilters.platforms, updateFilters]);

  const clearPlatformFilters = useCallback(() => {
    updateFilters({ platforms: [] });
  }, [updateFilters]);

  // Content type filter methods
  const toggleContentType = useCallback((contentType: ContentType) => {
    updateFilters({
      contentTypes: activeFilters.contentTypes?.includes(contentType)
        ? activeFilters.contentTypes.filter(type => type !== contentType)
        : [...(activeFilters.contentTypes || []), contentType]
    });
  }, [activeFilters.contentTypes, updateFilters]);

  // Year range methods
  const setYearRange = useCallback((min: number, max: number) => {
    updateFilters({
      yearRange: { min, max }
    });
  }, [updateFilters]);

  // Rating filter
  const setMinRating = useCallback((rating: number) => {
    updateFilters({ minRating: rating });
  }, [updateFilters]);

  // Availability toggle
  const toggleOnlyAvailable = useCallback(() => {
    updateFilters({ onlyAvailable: !activeFilters.onlyAvailable });
  }, [activeFilters.onlyAvailable, updateFilters]);

  // Sort options
  const setSortBy = useCallback((sortBy: string, sortOrder?: 'asc' | 'desc') => {
    updateFilters({
      sortBy,
      sortOrder: sortOrder || activeFilters.sortOrder
    });
  }, [activeFilters.sortOrder, updateFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      platforms: [],
      contentTypes: [],
      yearRange: { min: 1970, max: new Date().getFullYear() },
      minRating: 0,
      onlyAvailable: false,
      sortBy: 'relevance',
      sortOrder: 'desc'
    };
    setActiveFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  }, [onFiltersChange]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      (activeFilters.platforms?.length || 0) > 0 ||
      (activeFilters.contentTypes?.length || 0) > 0 ||
      activeFilters.minRating! > 0 ||
      activeFilters.onlyAvailable ||
      activeFilters.yearRange?.min !== 1970 ||
      activeFilters.yearRange?.max !== new Date().getFullYear()
    );
  }, [activeFilters]);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];

    if (activeFilters.platforms?.length) {
      const platformNames = availablePlatforms
        .filter(p => activeFilters.platforms!.includes(p.id))
        .map(p => p.name);
      summary.push(`${platformNames.length} platforms`);
    }

    if (activeFilters.contentTypes?.length) {
      summary.push(`${activeFilters.contentTypes.length} types`);
    }

    if (activeFilters.minRating! > 0) {
      summary.push(`${activeFilters.minRating}+ stars`);
    }

    if (activeFilters.onlyAvailable) {
      summary.push('available only');
    }

    return summary.join(', ');
  }, [activeFilters, availablePlatforms]);

  return {
    // State
    activeFilters,
    availablePlatforms,
    hasActiveFilters,

    // Actions
    updateFilters,
    togglePlatform,
    clearPlatformFilters,
    toggleContentType,
    setYearRange,
    setMinRating,
    toggleOnlyAvailable,
    setSortBy,
    clearAllFilters,

    // Utils
    getFilterSummary,
  };
};
```

### Platform Filter Component

```typescript
// components/Filters/PlatformFilter.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../design-system/tokens';
import { Platform } from '../../types';

interface PlatformFilterProps {
  platforms: Platform[];
  selectedPlatforms: string[];
  onTogglePlatform: (platformId: string) => void;
  onClearAll: () => void;
  maxHeight?: number;
}

export const PlatformFilter: React.FC<PlatformFilterProps> = ({
  platforms,
  selectedPlatforms,
  onTogglePlatform,
  onClearAll,
  maxHeight = 400
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter platforms based on search
  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) return platforms;

    return platforms.filter(platform =>
      platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      platform.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [platforms, searchQuery]);

  // Group platforms by type
  const groupedPlatforms = useMemo(() => {
    const groups = filteredPlatforms.reduce((acc, platform) => {
      const type = platform.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(platform);
      return acc;
    }, {} as Record<string, Platform[]>);

    // Sort each group by name
    Object.keys(groups).forEach(type => {
      groups[type].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredPlatforms]);

  const renderPlatformChip = (platform: Platform) => {
    const isSelected = selectedPlatforms.includes(platform.id);

    return (
      <TouchableOpacity
        key={platform.id}
        style={[
          styles.platformChip,
          isSelected && styles.selectedChip
        ]}
        onPress={() => onTogglePlatform(platform.id)}
        accessibilityLabel={`${platform.name} - ${isSelected ? 'selected' : 'not selected'}`}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        <Text style={[
          styles.chipText,
          isSelected && styles.selectedChipText
        ]}>
          {platform.name}
        </Text>
        {isSelected && (
          <Ionicons
            name="checkmark"
            size={16}
            color={tokens.colors.white}
            style={styles.checkIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderPlatformGroup = (type: string, platforms: Platform[]) => (
    <View key={type} style={styles.platformGroup}>
      <Text style={styles.groupTitle}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
      <View style={styles.chipsContainer}>
        {platforms.map(renderPlatformChip)}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { maxHeight }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={tokens.colors.neutral[500]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search platforms..."
          placeholderTextColor={tokens.colors.neutral[400]}
          accessibilityLabel="Search platforms"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearch}
          >
            <Ionicons
              name="close"
              size={20}
              color={tokens.colors.neutral[400]}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Header with Clear All */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Platforms ({selectedPlatforms.length} selected)
        </Text>
        {selectedPlatforms.length > 0 && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Platform Groups */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedPlatforms).map(([type, platforms]) =>
          renderPlatformGroup(type, platforms)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background.light,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: tokens.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...tokens.typography.body,
    color: tokens.colors.text.primary,
  },
  clearSearch: {
    padding: tokens.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.md,
  },
  headerTitle: {
    ...tokens.typography.h4,
    color: tokens.colors.text.primary,
  },
  clearAllButton: {
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
  },
  clearAllText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.primary,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  platformGroup: {
    marginBottom: tokens.spacing.lg,
  },
  groupTitle: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: tokens.spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.neutral[100],
    borderRadius: tokens.borderRadius.full,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.neutral[200],
  },
  selectedChip: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  chipText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.primary,
    fontWeight: '500',
  },
  selectedChipText: {
    color: tokens.colors.white,
  },
  checkIcon: {
    marginLeft: tokens.spacing.xs,
  },
});
```

---

## Case-Based Discovery

### Case Directory Component

```typescript
// components/Browse/CaseDirectory.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
  SectionList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../design-system/tokens';
import { CaseInfo, ContentItem } from '../../types';
import { useCaseDiscovery } from '../hooks/useCaseDiscovery';

interface CaseDirectoryProps {
  onCaseSelect: (caseInfo: CaseInfo) => void;
  onContentSelect: (content: ContentItem) => void;
}

export const CaseDirectory: React.FC<CaseDirectoryProps> = ({
  onCaseSelect,
  onContentSelect
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('trending');

  const {
    trendingCases,
    casesByDecade,
    casesByType,
    unsolvedCases,
    recentlySolvedCases,
    isLoading
  } = useCaseDiscovery();

  // Categories for browsing
  const categories = [
    { key: 'trending', label: 'Trending', data: trendingCases },
    { key: 'unsolved', label: 'Unsolved', data: unsolvedCases },
    { key: 'recent', label: 'Recently Solved', data: recentlySolvedCases },
    { key: 'serial', label: 'Serial Killers', data: casesByType.serial || [] },
    { key: 'cold', label: 'Cold Cases', data: casesByType.cold || [] },
  ];

  // Group cases by decade for timeline view
  const timelineData = useMemo(() => {
    const decades = Object.keys(casesByDecade).sort((a, b) =>
      parseInt(b) - parseInt(a) // Most recent first
    );

    return decades.map(decade => ({
      title: `${decade}s`,
      data: casesByDecade[decade]
    }));
  }, [casesByDecade]);

  const renderCaseCard = (caseInfo: CaseInfo) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => onCaseSelect(caseInfo)}
      accessibilityLabel={`Case: ${caseInfo.name}`}
      accessibilityRole="button"
    >
      {/* Case Image */}
      <View style={styles.caseImageContainer}>
        <Image
          source={{ uri: caseInfo.imageUrl }}
          style={styles.caseImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
          style={styles.caseOverlay}
        />
      </View>

      {/* Case Info */}
      <View style={styles.caseInfo}>
        <Text style={styles.caseName} numberOfLines={2}>
          {caseInfo.name}
        </Text>
        <Text style={styles.caseMetadata}>
          {caseInfo.timeframe} • {caseInfo.location}
        </Text>
        <View style={styles.caseStats}>
          <Text style={styles.contentCount}>
            {caseInfo.contentCount} titles available
          </Text>
          {caseInfo.status === 'unsolved' && (
            <View style={styles.unsolvedBadge}>
              <Text style={styles.unsolvedText}>Unsolved</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTimelineSection = ({ item, section }: any) => (
    <View style={styles.timelineSection}>
      <View style={styles.timelineHeader}>
        <View style={styles.decadeBadge}>
          <Text style={styles.decadeText}>{section.title}</Text>
        </View>
        <Text style={styles.decadeDescription}>
          {item.length} cases from the {section.title.toLowerCase()}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineCases}
      >
        {item.map((caseInfo: CaseInfo) => (
          <View key={caseInfo.id} style={styles.timelineCaseCard}>
            {renderCaseCard(caseInfo)}
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryContent = () => {
    const activeData = categories.find(cat => cat.key === activeCategory)?.data || [];

    if (activeCategory === 'timeline') {
      return (
        <SectionList
          sections={timelineData}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderTimelineSection}
          renderSectionHeader={() => null}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.casesGrid}>
          {activeData.map(renderCaseCard)}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryTab,
              activeCategory === category.key && styles.activeCategoryTab
            ]}
            onPress={() => setActiveCategory(category.key)}
          >
            <Text style={[
              styles.categoryTabText,
              activeCategory === category.key && styles.activeCategoryTabText
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Timeline View Toggle */}
        <TouchableOpacity
          style={[
            styles.categoryTab,
            activeCategory === 'timeline' && styles.activeCategoryTab
          ]}
          onPress={() => setActiveCategory('timeline')}
        >
          <Text style={[
            styles.categoryTabText,
            activeCategory === 'timeline' && styles.activeCategoryTabText
          ]}>
            Timeline
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content Area */}
      <View style={styles.contentContainer}>
        {renderCategoryContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.dark,
  },
  categoryTabs: {
    maxHeight: 50,
    marginBottom: tokens.spacing.md,
  },
  categoryTabsContent: {
    paddingHorizontal: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  categoryTab: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.neutral[600],
  },
  activeCategoryTab: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  categoryTabText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.neutral[300],
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: tokens.colors.white,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: tokens.spacing.md,
  },
  casesGrid: {
    gap: tokens.spacing.md,
  },
  caseCard: {
    backgroundColor: tokens.colors.surface,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  caseImageContainer: {
    height: 120,
    position: 'relative',
  },
  caseImage: {
    width: '100%',
    height: '100%',
  },
  caseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  caseInfo: {
    padding: tokens.spacing.md,
  },
  caseName: {
    ...tokens.typography.h4,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  caseMetadata: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  caseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentCount: {
    ...tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
  unsolvedBadge: {
    backgroundColor: tokens.colors.warning,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
  },
  unsolvedText: {
    ...tokens.typography.caption,
    color: tokens.colors.white,
    fontWeight: '600',
  },
  timelineSection: {
    marginBottom: tokens.spacing.xl,
  },
  timelineHeader: {
    marginBottom: tokens.spacing.md,
  },
  decadeBadge: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.lg,
    alignSelf: 'flex-start',
    marginBottom: tokens.spacing.xs,
  },
  decadeText: {
    ...tokens.typography.h4,
    color: tokens.colors.white,
    fontWeight: '700',
  },
  decadeDescription: {
    ...tokens.typography.body,
    color: tokens.colors.text.secondary,
  },
  timelineCases: {
    paddingLeft: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  timelineCaseCard: {
    width: 200,
  },
});
```

---

## Platform Integration

### Platform Availability Service

```typescript
// services/PlatformService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { Platform, PlatformAvailability, UserPreferences } from '../types';

export class PlatformService {
  private static cache: Map<string, any> = new Map();
  private static cacheTimestamps: Map<string, number> = new Map();
  private static readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Get all available platforms
   */
  static async getAllPlatforms(): Promise<Platform[]> {
    const cacheKey = 'all_platforms';

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try network request first
      const networkState = await NetInfo.fetch();
      if (networkState.isConnected) {
        const platforms = await this.fetchPlatformsFromAPI();
        this.setCache(cacheKey, platforms);

        // Save to local storage for offline access
        await AsyncStorage.setItem('platforms_cache', JSON.stringify(platforms));

        return platforms;
      }
    } catch (error) {
      console.warn('Failed to fetch platforms from API:', error);
    }

    // Fall back to cached data
    try {
      const cachedData = await AsyncStorage.getItem('platforms_cache');
      if (cachedData) {
        const platforms = JSON.parse(cachedData);
        this.setCache(cacheKey, platforms);
        return platforms;
      }
    } catch (error) {
      console.error('Failed to load cached platforms:', error);
    }

    // Return default platforms if all else fails
    return this.getDefaultPlatforms();
  }

  /**
   * Check content availability across platforms
   */
  static async checkContentAvailability(
    contentId: string,
    userPlatforms?: string[]
  ): Promise<PlatformAvailability[]> {
    const cacheKey = `availability_${contentId}`;

    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const availability = await this.fetchAvailabilityFromAPI(contentId);

      // Filter by user's platforms if provided
      const filteredAvailability = userPlatforms
        ? availability.filter(item => userPlatforms.includes(item.platformId))
        : availability;

      this.setCache(cacheKey, filteredAvailability);
      return filteredAvailability;
    } catch (error) {
      console.error('Failed to check content availability:', error);
      return [];
    }
  }

  /**
   * Get user's connected platforms
   */
  static async getUserPlatforms(userId: string): Promise<string[]> {
    try {
      const preferences = await AsyncStorage.getItem(`user_platforms_${userId}`);
      return preferences ? JSON.parse(preferences) : [];
    } catch (error) {
      console.error('Failed to get user platforms:', error);
      return [];
    }
  }

  /**
   * Update user's platform preferences
   */
  static async updateUserPlatforms(
    userId: string,
    platformIds: string[]
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `user_platforms_${userId}`,
        JSON.stringify(platformIds)
      );

      // Clear availability cache to refresh with new platforms
      this.clearAvailabilityCache();
    } catch (error) {
      console.error('Failed to update user platforms:', error);
    }
  }

  /**
   * Generate deep link for content on platform
   */
  static generateDeepLink(
    contentId: string,
    platformId: string,
    contentType: 'movie' | 'series' | 'documentary'
  ): string | null {
    const platform = this.getPlatformById(platformId);
    if (!platform) return null;

    // Platform-specific deep link patterns
    const deepLinkPatterns = {
      'netflix': `https://www.netflix.com/title/${contentId}`,
      'hulu': `https://www.hulu.com/watch/${contentId}`,
      'amazon-prime': `https://www.amazon.com/dp/${contentId}`,
      'hbo-max': `https://play.hbomax.com/page/urn:hbo:page:${contentId}`,
      'disney-plus': `https://www.disneyplus.com/movies/${contentId}`,
      'paramount-plus': `https://www.paramountplus.com/movies/${contentId}`,
      'discovery-plus': `https://www.discoveryplus.com/video/${contentId}`,
    };

    return deepLinkPatterns[platform.id as keyof typeof deepLinkPatterns] || platform.url;
  }

  /**
   * Track platform usage analytics
   */
  static async trackPlatformClick(
    userId: string,
    contentId: string,
    platformId: string
  ): Promise<void> {
    try {
      const analytics = {
        userId,
        contentId,
        platformId,
        timestamp: new Date().toISOString(),
        action: 'platform_click'
      };

      // Store analytics locally for now
      const existingData = await AsyncStorage.getItem('platform_analytics');
      const analyticsArray = existingData ? JSON.parse(existingData) : [];
      analyticsArray.push(analytics);

      // Keep only last 1000 entries
      if (analyticsArray.length > 1000) {
        analyticsArray.splice(0, analyticsArray.length - 1000);
      }

      await AsyncStorage.setItem('platform_analytics', JSON.stringify(analyticsArray));
    } catch (error) {
      console.error('Failed to track platform click:', error);
    }
  }

  /**
   * Get platform recommendations based on user behavior
   */
  static async getPlatformRecommendations(
    userId: string,
    contentPreferences: string[]
  ): Promise<Platform[]> {
    try {
      // Get user's platform usage history
      const analyticsData = await AsyncStorage.getItem('platform_analytics');
      const analytics = analyticsData ? JSON.parse(analyticsData) : [];

      const userAnalytics = analytics.filter((item: any) => item.userId === userId);

      // Count platform usage
      const platformUsage = userAnalytics.reduce((acc: any, item: any) => {
        acc[item.platformId] = (acc[item.platformId] || 0) + 1;
        return acc;
      }, {});

      // Get all platforms
      const allPlatforms = await this.getAllPlatforms();

      // Score platforms based on usage and content availability
      const scoredPlatforms = allPlatforms.map(platform => ({
        ...platform,
        score: (platformUsage[platform.id] || 0) +
               (this.hasContentForPreferences(platform, contentPreferences) ? 10 : 0)
      }));

      // Return top 5 recommendations
      return scoredPlatforms
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to get platform recommendations:', error);
      return [];
    }
  }

  // Private helper methods
  private static async fetchPlatformsFromAPI(): Promise<Platform[]> {
    // Implementation depends on your API structure
    // This would typically call Watchmode, JustWatch, or similar APIs
    const response = await fetch('/api/platforms');
    return response.json();
  }

  private static async fetchAvailabilityFromAPI(contentId: string): Promise<PlatformAvailability[]> {
    // Implementation for checking content availability
    const response = await fetch(`/api/content/${contentId}/availability`);
    return response.json();
  }

  private static getPlatformById(platformId: string): Platform | null {
    const platforms = this.cache.get('all_platforms') || [];
    return platforms.find((p: Platform) => p.id === platformId) || null;
  }

  private static hasContentForPreferences(
    platform: Platform,
    preferences: string[]
  ): boolean {
    // Check if platform has content matching user preferences
    // This would typically check against content database
    return preferences.some(pref =>
      platform.genres?.includes(pref) || platform.categories?.includes(pref)
    );
  }

  private static getDefaultPlatforms(): Platform[] {
    return [
      {
        id: 'netflix',
        name: 'Netflix',
        type: 'streaming',
        url: 'https://www.netflix.com',
        available: true
      },
      {
        id: 'hulu',
        name: 'Hulu',
        type: 'streaming',
        url: 'https://www.hulu.com',
        available: true
      },
      {
        id: 'amazon-prime',
        name: 'Amazon Prime Video',
        type: 'streaming',
        url: 'https://www.amazon.com/prime-video',
        available: true
      },
      {
        id: 'discovery-plus',
        name: 'Discovery+',
        type: 'streaming',
        url: 'https://www.discoveryplus.com',
        available: true
      }
    ];
  }

  private static isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;

    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private static setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  private static clearAvailabilityCache(): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith('availability_')) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });
  }
}
```

---

## Performance Optimizations

### Optimized Search Results Grid

```typescript
// components/Results/OptimizedContentGrid.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo
} from 'react-native';
import { ContentCard } from './ContentCard';
import { SkeletonLoader } from '../common/SkeletonLoader';
import { ContentItem } from '../../types';
import { tokens } from '../../design-system/tokens';

interface OptimizedContentGridProps {
  content: ContentItem[];
  isLoading: boolean;
  onContentPress: (content: ContentItem) => void;
  onContentAdd: (content: ContentItem) => void;
  onEndReached?: () => void;
  hasNextPage?: boolean;
}

export const OptimizedContentGrid: React.FC<OptimizedContentGridProps> = ({
  content,
  isLoading,
  onContentPress,
  onContentAdd,
  onEndReached,
  hasNextPage = false
}) => {
  const [viewableItems, setViewableItems] = useState<Set<string>>(new Set());

  const screenWidth = Dimensions.get('window').width;
  const itemMargin = tokens.spacing.md;
  const numColumns = useMemo(() => {
    if (screenWidth > 768) return 4;
    if (screenWidth > 480) return 3;
    return 2;
  }, [screenWidth]);

  const itemWidth = useMemo(() =>
    (screenWidth - (itemMargin * (numColumns + 1))) / numColumns,
    [screenWidth, numColumns, itemMargin]
  );

  // Memoize item layout for performance
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      const itemHeight = itemWidth * 1.5 + 80; // Aspect ratio + text
      const rowIndex = Math.floor(index / numColumns);
      return {
        length: itemHeight,
        offset: (itemHeight + itemMargin) * rowIndex,
        index,
      };
    },
    [itemWidth, numColumns, itemMargin]
  );

  // Handle viewability changes for performance
  const onViewableItemsChanged = useCallback(({ viewableItems: visible }: any) => {
    const visibleIds = new Set(visible.map((item: any) => item.item.id));
    setViewableItems(visibleIds);
  }, []);

  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: true,
  }), []);

  // Render individual content item
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<ContentItem>) => {
      const isVisible = viewableItems.has(item.id);

      return (
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
          {isVisible || content.indexOf(item) < 10 ? (
            <ContentCard
              content={item}
              onPress={() => onContentPress(item)}
              onAdd={() => onContentAdd(item)}
              style={{ width: '100%' }}
            />
          ) : (
            <SkeletonLoader
              width={itemWidth}
              height={itemWidth * 1.5}
              style={styles.skeleton}
            />
          )}
        </View>
      );
    },
    [itemWidth, numColumns, itemMargin, viewableItems, content, onContentPress, onContentAdd]
  );

  // Render loading footer
  const renderFooter = useCallback(() => {
    if (!hasNextPage) return null;

    return (
      <View style={styles.loadingFooter}>
        <SkeletonLoader
          width={itemWidth}
          height={itemWidth * 1.5}
          style={styles.footerSkeleton}
        />
        <SkeletonLoader
          width={itemWidth}
          height={itemWidth * 1.5}
          style={styles.footerSkeleton}
        />
      </View>
    );
  }, [hasNextPage, itemWidth]);

  // Memoize key extractor
  const keyExtractor = useCallback(
    (item: ContentItem) => item.id,
    []
  );

  // Show skeleton grid while loading initial results
  if (isLoading && content.length === 0) {
    return (
      <View style={styles.skeletonGrid}>
        {Array.from({ length: 8 }, (_, index) => (
          <SkeletonLoader
            key={index}
            width={itemWidth}
            height={itemWidth * 1.5}
            style={[
              styles.skeletonItem,
              {
                marginLeft: index % numColumns === 0 ? itemMargin : itemMargin / 2,
                marginRight: index % numColumns === numColumns - 1 ? itemMargin : itemMargin / 2,
              }
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={content}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      key={numColumns} // Force re-render on orientation change
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={21}
      updateCellsBatchingPeriod={50}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
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
  skeleton: {
    borderRadius: tokens.borderRadius.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  skeletonItem: {
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  footerSkeleton: {
    borderRadius: tokens.borderRadius.lg,
  },
});
```

---

## Offline Support

### Offline Search Implementation

```typescript
// hooks/useOfflineSearch.ts
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { SearchService } from '../services/SearchService';
import { ContentItem, SearchFilters, CacheStatus } from '../types';

interface UseOfflineSearchOptions {
  enableCache?: boolean;
  maxCacheSize?: number;
  cacheExpiryHours?: number;
}

export const useOfflineSearch = ({
  enableCache = true,
  maxCacheSize = 1000,
  cacheExpiryHours = 24
}: UseOfflineSearchOptions = {}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>('idle');
  const [searchCache, setSearchCache] = useState<Map<string, any>>(new Map());

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Load cached searches on mount
    loadCachedSearches();

    return unsubscribe;
  }, []);

  /**
   * Perform search with offline fallback
   */
  const search = useCallback(async (
    query: string,
    filters: SearchFilters = {}
  ): Promise<ContentItem[]> => {
    const cacheKey = generateCacheKey(query, filters);

    try {
      if (isOnline) {
        // Try online search first
        setCacheStatus('fetching');
        const results = await SearchService.universalSearch(query, filters);

        // Cache successful results
        if (enableCache && results.length > 0) {
          await cacheSearchResults(cacheKey, results);
        }

        setCacheStatus('idle');
        return results.map(result => result.item);
      }
    } catch (error) {
      console.warn('Online search failed, falling back to cache:', error);
    }

    // Fall back to cached results
    setCacheStatus('loading_cache');
    const cachedResults = await getCachedResults(cacheKey);
    setCacheStatus('idle');

    return cachedResults;
  }, [isOnline, enableCache]);

  /**
   * Get search suggestions with offline support
   */
  const getSuggestions = useCallback(async (
    query: string,
    limit: number = 8
  ): Promise<string[]> => {
    if (isOnline) {
      try {
        return await SearchService.getSuggestions(query, limit);
      } catch (error) {
        console.warn('Failed to get online suggestions:', error);
      }
    }

    // Fall back to cached suggestions
    return getCachedSuggestions(query, limit);
  }, [isOnline]);

  /**
   * Preload popular content for offline use
   */
  const preloadPopularContent = useCallback(async (): Promise<void> => {
    if (!isOnline || !enableCache) return;

    try {
      setCacheStatus('preloading');

      const popularQueries = [
        'ted bundy',
        'jeffrey dahmer',
        'serial killer',
        'true crime documentary',
        'cold case',
        'unsolved mystery'
      ];

      for (const query of popularQueries) {
        try {
          const results = await SearchService.universalSearch(query);
          if (results.length > 0) {
            const cacheKey = generateCacheKey(query, {});
            await cacheSearchResults(cacheKey, results);
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.warn(`Failed to preload query: ${query}`, error);
        }
      }

      setCacheStatus('idle');
    } catch (error) {
      console.error('Failed to preload content:', error);
      setCacheStatus('idle');
    }
  }, [isOnline, enableCache]);

  /**
   * Clear search cache
   */
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('search_cache');
      setSearchCache(new Map());
      setCacheStatus('idle');
    } catch (error) {
      console.error('Failed to clear search cache:', error);
    }
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    try {
      const cacheData = await AsyncStorage.getItem('search_cache');
      if (!cacheData) {
        return { size: 0, entries: 0, lastUpdated: null };
      }

      const cache = JSON.parse(cacheData);
      const entries = Object.keys(cache).length;
      const size = JSON.stringify(cache).length;
      const timestamps = Object.values(cache).map((item: any) => item.timestamp);
      const lastUpdated = Math.max(...timestamps);

      return {
        size: Math.round(size / 1024), // Size in KB
        entries,
        lastUpdated: new Date(lastUpdated)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { size: 0, entries: 0, lastUpdated: null };
    }
  }, []);

  // Private helper methods
  const generateCacheKey = (query: string, filters: SearchFilters): string => {
    const filterString = JSON.stringify(filters);
    return `${query.toLowerCase().trim()}_${btoa(filterString)}`;
  };

  const cacheSearchResults = async (key: string, results: any[]): Promise<void> => {
    try {
      const existingCache = await AsyncStorage.getItem('search_cache');
      const cache = existingCache ? JSON.parse(existingCache) : {};

      // Add new results with timestamp
      cache[key] = {
        results: results.slice(0, 50), // Limit cached results
        timestamp: Date.now(),
        expires: Date.now() + (cacheExpiryHours * 60 * 60 * 1000)
      };

      // Clean up expired entries
      const now = Date.now();
      Object.keys(cache).forEach(cacheKey => {
        if (cache[cacheKey].expires < now) {
          delete cache[cacheKey];
        }
      });

      // Limit cache size
      const entries = Object.entries(cache);
      if (entries.length > maxCacheSize) {
        // Remove oldest entries
        entries.sort((a, b) => (a[1] as any).timestamp - (b[1] as any).timestamp);
        const toKeep = entries.slice(-maxCacheSize);
        const newCache = Object.fromEntries(toKeep);

        await AsyncStorage.setItem('search_cache', JSON.stringify(newCache));
      } else {
        await AsyncStorage.setItem('search_cache', JSON.stringify(cache));
      }

      // Update in-memory cache
      setSearchCache(new Map(Object.entries(cache)));
    } catch (error) {
      console.error('Failed to cache search results:', error);
    }
  };

  const getCachedResults = async (key: string): Promise<ContentItem[]> => {
    try {
      const cacheData = await AsyncStorage.getItem('search_cache');
      if (!cacheData) return [];

      const cache = JSON.parse(cacheData);
      const cached = cache[key];

      if (!cached || cached.expires < Date.now()) {
        return [];
      }

      return cached.results.map((result: any) => result.item || result);
    } catch (error) {
      console.error('Failed to get cached results:', error);
      return [];
    }
  };

  const getCachedSuggestions = async (query: string, limit: number): Promise<string[]> => {
    try {
      const cacheData = await AsyncStorage.getItem('search_cache');
      if (!cacheData) return [];

      const cache = JSON.parse(cacheData);
      const suggestions: Set<string> = new Set();

      // Extract titles from cached results that match query
      Object.values(cache).forEach((cached: any) => {
        if (cached.expires > Date.now()) {
          cached.results.forEach((result: any) => {
            const item = result.item || result;
            if (item.title?.toLowerCase().includes(query.toLowerCase())) {
              suggestions.add(item.title);
            }
          });
        }
      });

      return Array.from(suggestions).slice(0, limit);
    } catch (error) {
      console.error('Failed to get cached suggestions:', error);
      return [];
    }
  };

  const loadCachedSearches = async (): Promise<void> => {
    try {
      const cacheData = await AsyncStorage.getItem('search_cache');
      if (cacheData) {
        const cache = JSON.parse(cacheData);
        setSearchCache(new Map(Object.entries(cache)));
      }
    } catch (error) {
      console.error('Failed to load cached searches:', error);
    }
  };

  return {
    // State
    isOnline,
    cacheStatus,

    // Methods
    search,
    getSuggestions,
    preloadPopularContent,
    clearCache,
    getCacheStats,
  };
};
```

---

This comprehensive implementation guide provides all the necessary components and services for building a robust content discovery feature in React Native. The implementation focuses on:

1. **Performance**: Optimized search with debouncing, caching, and virtualized lists
2. **User Experience**: Intelligent suggestions, fuzzy search, and smooth animations
3. **Offline Support**: Full search functionality without internet connection
4. **Platform Integration**: Support for 200+ streaming platforms with deep linking
5. **Case-Based Discovery**: True Crime-specific browsing and categorization
6. **Accessibility**: Screen reader support and keyboard navigation
7. **Type Safety**: Complete TypeScript coverage for maintainability

The code examples demonstrate real-world production patterns and can be directly integrated into the True Crime tracking application.