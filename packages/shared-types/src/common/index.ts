// Common types used across the application

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  contentFilters: ContentFilters;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newContentAlerts: boolean;
  friendActivity: boolean;
  weeklyDigest: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
}

export interface ContentFilters {
  excludeGraphicContent: boolean;
  minRating?: number;
  preferredGenres: string[];
  blockedNetworks: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface SearchFilters {
  query?: string;
  genres?: string[];
  networks?: string[];
  contentType?: 'movie' | 'tv' | 'documentary';
  releaseYear?: {
    min?: number;
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  availableOn?: string[];
}