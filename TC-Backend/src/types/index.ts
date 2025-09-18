// Shared types for TCWatch Backend
import { z } from 'zod';

// User types
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

// Content types
export const ContentTypeSchema = z.enum(['MOVIE', 'TV_SERIES', 'DOCUMENTARY', 'PODCAST']);

export const ContentSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string(),
  type: ContentTypeSchema,
  title: z.string(),
  description: z.string().optional(),
  releaseDate: z.string().optional(),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  genres: z.array(z.string()),
  trueCrimeCategory: z.string().optional(),
  caseName: z.string().optional(),
  caseYear: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Content = z.infer<typeof ContentSchema>;

// User content tracking
export const TrackingStatusSchema = z.enum([
  'WANT_TO_WATCH',
  'WATCHING',
  'COMPLETED',
  'ON_HOLD',
  'DROPPED',
]);

export const UserContentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  contentId: z.string().uuid(),
  status: TrackingStatusSchema,
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserContent = z.infer<typeof UserContentSchema>;

// Social types
export const ListVisibilitySchema = z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']);

export const CustomListSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  visibility: ListVisibilitySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CustomList = z.infer<typeof CustomListSchema>;

// Notification types
export const NotificationTypeSchema = z.enum([
  'FRIEND_REQUEST',
  'LIST_SHARED',
  'NEW_CONTENT',
  'RECOMMENDATION',
  'SYSTEM_UPDATE',
]);

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: NotificationTypeSchema,
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  data: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// API Response types
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  total: z.number().optional(),
  hasMore: z.boolean().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    pagination: PaginationSchema.optional(),
  });

// Error types
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// Search types
export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  contentType: ContentTypeSchema.optional(),
  genres: z.array(z.string()).optional(),
  trueCrimeCategory: z.string().optional(),
  yearRange: z.object({
    from: z.number(),
    to: z.number(),
  }).optional(),
  platforms: z.array(z.string()).optional(),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// Platform availability
export const PlatformAvailabilitySchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  platformId: z.string(),
  platformName: z.string(),
  availabilityType: z.enum(['SUBSCRIPTION', 'RENT', 'BUY', 'FREE']),
  price: z.number().optional(),
  currency: z.string().optional(),
  availableFrom: z.date().optional(),
  availableUntil: z.date().optional(),
  deepLink: z.string().url().optional(),
  lastUpdated: z.date(),
});

export type PlatformAvailability = z.infer<typeof PlatformAvailabilitySchema>;