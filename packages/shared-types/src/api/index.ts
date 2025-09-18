// API-related types for tRPC and HTTP responses

import type { User, PaginatedResponse, SearchFilters } from '../common';

// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Content API types
export interface ContentSearchRequest {
  filters: SearchFilters;
  page?: number;
  limit?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: 'movie' | 'tv' | 'documentary';
  releaseDate: string;
  rating?: number;
  duration?: number; // in minutes
  genres: string[];
  networks: string[];
  imageUrl?: string;
  trailerUrl?: string;
  externalIds: {
    tmdbId?: string;
    imdbId?: string;
    tvdbId?: string;
  };
  availability: PlatformAvailability[];
  crimeCase?: CrimeCaseInfo;
}

export interface PlatformAvailability {
  platformId: string;
  platformName: string;
  type: 'subscription' | 'rent' | 'buy' | 'free';
  price?: number;
  currency?: string;
  url?: string;
  lastUpdated: string;
}

export interface CrimeCaseInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  dateRange: {
    start: string;
    end?: string;
  };
  status: 'solved' | 'unsolved' | 'cold-case';
  keyPersons: string[];
  tags: string[];
}

// User Content Tracking
export interface UserContentStatus {
  contentId: string;
  status: 'want-to-watch' | 'watching' | 'completed' | 'dropped';
  rating?: number;
  notes?: string;
  progress?: EpisodeProgress;
  addedAt: string;
  updatedAt: string;
}

export interface EpisodeProgress {
  currentSeason: number;
  currentEpisode: number;
  totalSeasons: number;
  watchedEpisodes: {
    season: number;
    episode: number;
    watchedAt: string;
  }[];
}

// Social Features
export interface UserList {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: UserListItem[];
  followers?: number;
  likes?: number;
}

export interface UserListItem {
  contentId: string;
  addedAt: string;
  notes?: string;
  order: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

// Notifications
export interface NotificationItem {
  id: string;
  userId: string;
  type: 'friend-request' | 'new-content' | 'list-shared' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// tRPC Router types
export interface AuthRouter {
  login: {
    input: LoginRequest;
    output: AuthResponse;
  };
  register: {
    input: RegisterRequest;
    output: AuthResponse;
  };
  refresh: {
    input: { refreshToken: string };
    output: { accessToken: string; expiresIn: number };
  };
  logout: {
    input: void;
    output: { success: boolean };
  };
}

export interface ContentRouter {
  search: {
    input: ContentSearchRequest;
    output: PaginatedResponse<ContentItem>;
  };
  getById: {
    input: { id: string };
    output: ContentItem;
  };
  getUserContent: {
    input: { userId?: string };
    output: UserContentStatus[];
  };
  updateStatus: {
    input: Omit<UserContentStatus, 'addedAt' | 'updatedAt'>;
    output: UserContentStatus;
  };
}