// Application constants shared across frontend and backend

export const APP_CONFIG = {
  name: 'TCWatch',
  version: '1.0.0',
  description: 'True Crime Tracker',
  supportEmail: 'support@tcwatch.app',
  websiteUrl: 'https://tcwatch.app',
} as const;

export const API_CONFIG = {
  version: 'v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
} as const;

export const CONTENT_TYPES = {
  MOVIE: 'movie',
  TV: 'tv',
  DOCUMENTARY: 'documentary',
} as const;

export const USER_CONTENT_STATUS = {
  WANT_TO_WATCH: 'want-to-watch',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
} as const;

export const CRIME_CASE_STATUS = {
  SOLVED: 'solved',
  UNSOLVED: 'unsolved',
  COLD_CASE: 'cold-case',
} as const;

export const PLATFORM_TYPES = {
  SUBSCRIPTION: 'subscription',
  RENT: 'rent',
  BUY: 'buy',
  FREE: 'free',
} as const;

export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'friend-request',
  NEW_CONTENT: 'new-content',
  LIST_SHARED: 'list-shared',
  SYSTEM: 'system',
} as const;

export const FRIENDSHIP_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;

export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private',
} as const;

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// External API Constants
export const EXTERNAL_APIS = {
  TMDB: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    imageSizes: {
      poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
      backdrop: ['w300', 'w780', 'w1280', 'original'],
    },
  },
  WATCHMODE: {
    baseUrl: 'https://api.watchmode.com/v1',
  },
  TVDB: {
    baseUrl: 'https://api4.thetvdb.com/v4',
  },
  TVMAZE: {
    baseUrl: 'https://api.tvmaze.com',
  },
  WIKIDATA: {
    baseUrl: 'https://www.wikidata.org/w/api.php',
    queryService: 'https://query.wikidata.org/sparql',
  },
} as const;

// Content Rating Mappings
export const CONTENT_RATINGS = {
  US: {
    TV: ['TV-Y', 'TV-Y7', 'TV-Y7-FV', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'],
    MOVIE: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'NR'],
  },
  UK: {
    TV: ['U', 'PG', '12', '15', '18'],
    MOVIE: ['U', 'PG', '12A', '12', '15', '18', 'R18'],
  },
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  minQueryLength: 2,
  maxQueryLength: 100,
  debounceMs: 300,
  maxResults: 50,
  highlightTags: {
    pre: '<mark>',
    post: '</mark>',
  },
} as const;

// File Upload Constraints
export const FILE_UPLOAD = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/webm'],
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 searches per minute
  },
} as const;

// Temporal Workflow Configuration
export const WORKFLOWS = {
  contentSync: {
    cronSchedule: '0 2 * * *', // Daily at 2 AM
    taskQueue: 'content-sync',
    retryPolicy: {
      maximumAttempts: 3,
      initialInterval: '1s',
      maximumInterval: '10s',
      backoffCoefficient: 2,
    },
  },
  weeklyDigest: {
    cronSchedule: '0 9 * * MON', // Monday at 9 AM
    taskQueue: 'notifications',
    retryPolicy: {
      maximumAttempts: 2,
      initialInterval: '30s',
      maximumInterval: '5m',
      backoffCoefficient: 2,
    },
  },
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  content: 3600, // 1 hour
  userContent: 300, // 5 minutes
  searchResults: 1800, // 30 minutes
  platforms: 86400, // 24 hours
  crimeCase: 43200, // 12 hours
} as const;