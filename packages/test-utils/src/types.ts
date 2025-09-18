// Shared test types
export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  privacyLevel: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestContent {
  id: string;
  title: string;
  type: 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST';
  trueCrimeType: 'DOCUMENTARY' | 'DOCUSERIES' | 'MOVIE' | 'PODCAST' | 'TV_SERIES';
  releaseYear: number;
  duration?: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestUserContent {
  id: string;
  userId: string;
  contentId: string;
  trackingState: 'WANT_TO_WATCH' | 'WATCHING' | 'WATCHED' | 'ON_HOLD';
  rating?: number;
  notes?: string;
  progress: number;
  isComplete: boolean;
  watchedOn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestEpisodeProgress {
  id: string;
  userContentId: string;
  seasonNumber: number;
  episodeNumber: number;
  isWatched: boolean;
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestCustomList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MockApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  headers?: Record<string, string>;
}

export interface TestEnvironment {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  REDIS_URL?: string;
  MEILISEARCH_HOST?: string;
  MEILISEARCH_API_KEY?: string;
}