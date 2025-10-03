import { PrismaClient, content_type as PrismaContentType, tracking_status as TrackingStatus } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { redisService } from '../core/redis.service';
import { MeiliSearchService } from '../search/meilisearch.service';
import { ExternalAPIManager } from '../external';
import { RecommendationService } from './recommendation.service';
import { transformSearchResult, transformContentItem } from '../../utils/field-transformer';

// Content types enum (aligned with Prisma)
export enum ContentType {
  MOVIE = 'MOVIE',
  TV_SERIES = 'TV_SERIES',
  DOCUMENTARY = 'DOCUMENTARY',
  PODCAST = 'PODCAST'
}

// Content tracking states (aligned with Prisma)
export enum TrackingState {
  WANT_TO_WATCH = 'WANT_TO_WATCH',
  WATCHING = 'WATCHING',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

// Recommendation types
export enum RecommendationType {
  TRENDING = 'trending',
  SIMILAR_CONTENT = 'similar_content',
  CASE_BASED = 'case_based',
  COLLABORATIVE = 'collaborative',
  NEW_RELEASES = 'new_releases',
  FOR_YOU = 'for_you'
}

// Cache TTL constants
const CACHE_TTL = {
  CONTENT_DETAIL: 3600, // 1 hour
  CONTENT_LIST: 1800, // 30 minutes
  TRENDING: 900, // 15 minutes
  RECOMMENDATIONS: 1800, // 30 minutes
  USER_CONTENT: 600, // 10 minutes
  SEARCH_RESULTS: 300, // 5 minutes
};

// Content aggregation interfaces
interface ContentAggregationData {
  tmdbId?: number;
  imdbId?: string;
  tvdbId?: number;
  platforms?: PlatformInfo[];
  genres?: string[];
  cast?: string[];
  crew?: string[];
}

interface PlatformInfo {
  id: string;
  name: string;
  type: 'streaming' | 'cable' | 'purchase' | 'rental';
  url?: string;
  availableFrom?: Date;
  availableTo?: Date;
}

interface EpisodeProgressData {
  contentId: string;
  seasonNumber: number;
  episodeNumber: number;
  watched: boolean;
  watchedAt?: Date;
}

interface RecommendationOptions {
  type: RecommendationType;
  limit?: number;
  excludeWatched?: boolean;
  genreWeights?: Record<string, number>;
  caseWeights?: Record<string, number>;
}

// Enhanced Content schema
export const ContentSchema = z.object({
  id: z.string(),
  externalId: z.string(),
  title: z.string(),
  contentType: z.nativeEnum(ContentType),
  description: z.string().optional(),
  releaseDate: z.date().optional(),
  runtimeMinutes: z.number().optional(),
  posterUrl: z.string().url().optional(),
  trailerUrl: z.string().url().optional(),
  tmdbId: z.number().optional(),
  imdbId: z.string().optional(),
  tvdbId: z.number().optional(),
  platforms: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['streaming', 'cable', 'purchase', 'rental']),
    url: z.string().url().optional(),
    availableFrom: z.date().optional(),
    availableTo: z.date().optional(),
  })).default([]),
  genreTags: z.array(z.string()).default([]),
  caseTags: z.array(z.string()).default([]),
  totalSeasons: z.number().optional(),
  totalEpisodes: z.number().optional(),
  status: z.string().optional(),
  searchVector: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Episode progress schema
export const EpisodeProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  contentId: z.string(),
  seasonNumber: z.number(),
  episodeNumber: z.number(),
  watched: z.boolean(),
  watchedAt: z.date().optional(),
});

// Recommendation result schema
export const RecommendationResultSchema = z.object({
  content: ContentSchema,
  score: z.number(),
  reason: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Content = z.infer<typeof ContentSchema>;
export type EpisodeProgress = z.infer<typeof EpisodeProgressSchema>;
export type RecommendationResult = z.infer<typeof RecommendationResultSchema>;

export class ContentService {
  private prisma: PrismaClient;
  private searchService: MeiliSearchService;
  private externalAPI: ExternalAPIManager;
  private recommendationService: RecommendationService;
  private cachePrefix = 'content:';
  private userCachePrefix = 'user_content:';
  private recommendationPrefix = 'recommendations:';

  constructor(prisma: PrismaClient, externalAPI?: ExternalAPIManager) {
    this.prisma = prisma;
    this.searchService = new MeiliSearchService();
    this.externalAPI = externalAPI || new ExternalAPIManager({
      tmdbApiKey: process.env.TMDB_API_KEY,
      watchmodeApiKey: process.env.WATCHMODE_API_KEY,
      tvdbApiKey: process.env.TVDB_API_KEY,
    });
    this.recommendationService = new RecommendationService(prisma, this);
  }

  /**
   * Get content by ID with enhanced caching
   */
  async getById(id: string, useCache: boolean = true): Promise<Content | null> {
    const cacheKey = `${this.cachePrefix}detail:${id}`;

    // Check cache first if enabled
    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached as Content;
      }
    }

    try {
      // Fetch from database with full relationships
      const content = await this.prisma.content.findUnique({
        where: { id },
        include: {
          contentCaseLinks: {
            include: {
              contentCase: true
            }
          },
          userContent: {
            select: {
              status: true,
              rating: true,
              userId: true
            }
          }
        },
      });

      if (!content) {
        return null;
      }

      // Transform to match schema
      const transformed = this.transformContent(content);

      // Cache the result
      if (useCache) {
        await redisService.set(cacheKey, transformed, CACHE_TTL.CONTENT_DETAIL);
      }

      return transformed;
    } catch (error) {
      console.error('Error fetching content by ID:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch content',
      });
    }
  }

  /**
   * Get multiple contents by IDs with batch caching
   */
  async getByIds(ids: string[], useCache: boolean = true): Promise<Content[]> {
    const cacheKeys = ids.map(id => `${this.cachePrefix}detail:${id}`);
    const results: Content[] = [];
    const uncachedIds: string[] = [];

    if (useCache) {
      // Get cached results
      const cachedResults = await redisService.mget<Content>(cacheKeys);

      for (let i = 0; i < ids.length; i++) {
        if (cachedResults[i]) {
          results[i] = cachedResults[i]!;
        } else {
          uncachedIds.push(ids[i]!);
        }
      }
    } else {
      uncachedIds.push(...ids);
    }

    // Fetch uncached content from database
    if (uncachedIds.length > 0) {
      const uncachedContent = await this.prisma.content.findMany({
        where: { id: { in: uncachedIds } },
        include: {
          contentCaseLinks: {
            include: {
              contentCase: true
            }
          }
        },
      });

      const transformedContent = uncachedContent.map(this.transformContent);

      // Cache the results
      if (useCache && transformedContent.length > 0) {
        const cacheData: Record<string, Content> = {};
        transformedContent.forEach(content => {
          cacheData[`${this.cachePrefix}detail:${content.id}`] = content;
        });
        await redisService.mset(cacheData);
      }

      // Fill in the results array
      for (const content of transformedContent) {
        const index = ids.indexOf(content.id);
        if (index !== -1) {
          results[index] = content;
        }
      }
    }

    return results.filter(Boolean); // Remove any undefined entries
  }

  /**
   * Enhanced search with caching and faceted results
   */
  async search(params: {
    query?: string;
    contentType?: ContentType;
    genreTags?: string[];
    platforms?: string[];
    caseIds?: string[];
    releaseYear?: number;
    minRating?: number;
    limit?: number;
    offset?: number;
    facets?: string[];
    sort?: string[];
    useCache?: boolean;
  }) {
    const {
      query = '',
      contentType,
      genreTags = [],
      platforms = [],
      caseIds = [],
      releaseYear,
      minRating,
      limit = 20,
      offset = 0,
      facets = ['contentType', 'genreTags', 'platforms.name'],
      sort,
      useCache = true,
    } = params;

    // Create cache key from search parameters
    const cacheKey = `${this.cachePrefix}search:${Buffer.from(JSON.stringify(params)).toString('base64')}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Build search options for Meilisearch
      // Only include filters that actually have values
      const filters: any = {};

      // Don't apply any filters if they're empty arrays or undefined
      if (contentType) {
        filters.contentType = contentType;
      }
      if (genreTags && genreTags.length > 0) {
        filters.genreTags = genreTags;
      }
      if (platforms && platforms.length > 0) {
        filters.platforms = platforms;
      }
      if (caseIds && caseIds.length > 0) {
        filters.caseIds = caseIds;
      }
      if (releaseYear) {
        filters.releaseYear = releaseYear;
      }
      if (minRating) {
        filters.rating = { $gte: minRating };
      }

      const searchOptions = {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        facets,
        limit,
        offset,
        sort,
        attributesToHighlight: ['title', 'description'],
        attributesToCrop: ['description'],
        cropLength: 200,
      };

      console.log('[ContentService.search] Searching with query:', query, 'and filters:', filters);

      // Search using enhanced Meilisearch service
      const searchResults = await this.searchService.search('content', query, searchOptions);

      console.log('[ContentService.search] Search returned:', {
        totalHits: searchResults.totalHits,
        hitsCount: searchResults.hits?.length || 0,
        firstHit: searchResults.hits?.[0] ? { id: searchResults.hits[0].id, title: searchResults.hits[0].title } : null,
      });

      // Transform search results to match Content schema
      const transformedResults = searchResults.hits.map(hit => this.transformSearchHitToContent(hit));

      const result = {
        results: transformedResults,
        facetDistribution: searchResults.facetDistribution || {},
        total: searchResults.totalHits || 0,
        hasMore: offset + limit < (searchResults.totalHits || 0),
        query,
        processingTimeMs: searchResults.processingTimeMs,
      };

      // Cache the result
      if (useCache) {
        await redisService.set(cacheKey, result, CACHE_TTL.SEARCH_RESULTS);
      }

      return result;
    } catch (error) {
      console.error('Search error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Search failed',
      });
    }
  }

  /**
   * Get trending content with multiple algorithms
   */
  async getTrending(params: {
    limit?: number;
    timeframe?: 'day' | 'week' | 'month';
    contentType?: ContentType;
    useCache?: boolean;
  } = {}): Promise<Content[]> {
    const { limit = 10, timeframe = 'week', contentType, useCache = true } = params;
    const cacheKey = `${this.cachePrefix}trending:${timeframe}:${contentType || 'all'}:${limit}`;

    if (useCache) {
      const cached = await redisService.get<Content[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Calculate date range for trending
      const now = new Date();
      const timeRanges = {
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      };

      const startDate = timeRanges[timeframe];

      // Build where clause
      const where: any = {
        userContent: {
          some: {
            updatedAt: {
              gte: startDate,
            },
          },
        },
      };

      if (contentType) {
        where.contentType = contentType;
      }

      // Fetch trending content based on recent tracking activity
      const trending = await this.prisma.content.findMany({
        where,
        take: limit,
        orderBy: [
          { userContent: { _count: 'desc' } },
          { updatedAt: 'desc' },
        ],
        include: {
          contentCaseLinks: {
            include: {
              contentCase: true
            }
          },
          _count: {
            select: {
              userContent: true
            }
          }
        },
      });

      const transformed = trending.map(content => ({
        ...this.transformContent(content),
        popularity: content._count.userContent,
      }));

      // Cache for shorter period
      if (useCache) {
        await redisService.set(cacheKey, transformed, CACHE_TTL.TRENDING);
      }

      return transformed;
    } catch (error) {
      console.error('Error fetching trending content:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch trending content',
      });
    }
  }

  /**
   * Get comprehensive content recommendations for a user
   */
  async getRecommendations(userId: string, options: RecommendationOptions): Promise<{
    recommendations: Array<{
      content: Content;
      score: number;
      reason: string;
      metadata?: any;
    }>;
    totalScore: number;
    algorithm: string;
  }> {
    const { type, limit = 10, excludeWatched = true } = options;
    const cacheKey = `${this.recommendationPrefix}${userId}:${type}:${limit}`;

    // Check cache
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let recommendations;

      switch (type) {
        case RecommendationType.TRENDING:
          recommendations = await this.getTrendingRecommendations(userId, limit);
          break;
        case RecommendationType.SIMILAR_CONTENT:
          recommendations = await this.getSimilarContentRecommendations(userId, limit, excludeWatched);
          break;
        case RecommendationType.CASE_BASED:
          recommendations = await this.getCaseBasedRecommendations(userId, limit, excludeWatched);
          break;
        case RecommendationType.COLLABORATIVE:
          recommendations = await this.getCollaborativeRecommendations(userId, limit, excludeWatched);
          break;
        case RecommendationType.NEW_RELEASES:
          recommendations = await this.getNewReleaseRecommendations(userId, limit, excludeWatched);
          break;
        case RecommendationType.FOR_YOU:
          recommendations = await this.getForYouRecommendations(userId, limit, excludeWatched);
          break;
        default:
          recommendations = await this.getTrendingRecommendations(userId, limit);
      }

      const result = {
        recommendations: recommendations.slice(0, limit),
        totalScore: recommendations.reduce((sum, rec) => sum + rec.score, 0),
        algorithm: type,
      };

      // Cache recommendations
      await redisService.set(cacheKey, result, CACHE_TTL.RECOMMENDATIONS);

      return result;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate recommendations',
      });
    }
  }

  /**
   * Get trending-based recommendations
   */
  private async getTrendingRecommendations(userId: string, limit: number) {
    const trendingContent = await this.getTrending({ limit: limit * 2 });

    // Filter out user's already watched content if needed
    const userContentIds = await this.getUserWatchedContentIds(userId);
    const filtered = trendingContent.filter(content => !userContentIds.has(content.id));

    return filtered.slice(0, limit).map((content, index) => ({
      content,
      score: (limit - index) / limit, // Higher score for higher trending position
      reason: 'Trending in the True Crime community',
      metadata: { position: index + 1, type: 'trending' }
    }));
  }

  /**
   * Get similar content recommendations based on user's preferences
   */
  private async getSimilarContentRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    // Get user's favorite content and extract preferences
    const userPreferences = await this.getUserPreferences(userId);

    if (userPreferences.favoriteGenres.length === 0) {
      return this.getTrendingRecommendations(userId, limit);
    }

    // Search for similar content using Meilisearch
    const searchQuery = userPreferences.favoriteGenres.join(' ');
    const searchResults = await this.searchService.search('content', searchQuery, {
      filters: {
        genres: userPreferences.favoriteGenres,
        type: userPreferences.favoriteContentType,
      },
      limit: limit * 2,
    });

    // Filter out watched content
    const userContentIds = excludeWatched ? await this.getUserWatchedContentIds(userId) : new Set();
    const filtered = searchResults.hits.filter((hit: any) => !userContentIds.has(hit.id));

    return filtered.slice(0, limit).map((hit: any, index: number) => ({
      content: hit,
      score: (hit._rankingScore || 1) * 0.8, // Use Meilisearch ranking score
      reason: `Similar to your favorite ${userPreferences.favoriteGenres.join(', ')} content`,
      metadata: { genres: userPreferences.favoriteGenres, type: 'similar' }
    }));
  }

  /**
   * Get case-based recommendations
   */
  private async getCaseBasedRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    // Get user's favorite cases
    const userCases = await this.getUserFavoriteCases(userId);

    if (userCases.length === 0) {
      return this.getSimilarContentRecommendations(userId, limit, excludeWatched);
    }

    // Find content related to these cases
    const caseBasedContent = await this.prisma.content.findMany({
      where: {
        caseTags: {
          hasSome: userCases,
        },
      },
      take: limit * 2,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        contentCaseLinks: {
          include: {
            contentCase: true
          }
        },
      },
    });

    // Filter out watched content
    const userContentIds = excludeWatched ? await this.getUserWatchedContentIds(userId) : new Set();
    const filtered = caseBasedContent
      .filter(content => !userContentIds.has(content.id))
      .map(this.transformContent);

    return filtered.slice(0, limit).map((content, index) => ({
      content,
      score: 0.9 - (index * 0.1), // High score for case-based matches
      reason: `Related to cases you're interested in`,
      metadata: { cases: userCases, type: 'case_based' }
    }));
  }

  /**
   * Get collaborative filtering recommendations using advanced algorithms
   */
  private async getCollaborativeRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    try {
      // Use the new advanced recommendation service
      const hybridResults = await this.recommendationService.generateHybridRecommendations(userId, {
        limit,
        excludeWatched,
        hybridWeights: {
          collaborative: 0.8, // Emphasize collaborative for this specific call
          contentBased: 0.15,
          trending: 0.05,
          case: 0.0,
          temporal: 0.0
        }
      });

      // Transform to match the expected format
      return hybridResults.recommendations.map(rec => ({
        content: rec.content,
        score: rec.score,
        reason: rec.reason || 'Recommended by users with similar interests',
        metadata: {
          algorithm: rec.algorithm,
          confidence: rec.confidence,
          factors: rec.factors,
          type: 'collaborative_advanced'
        }
      }));
    } catch (error) {
      console.error('Advanced collaborative filtering failed, falling back to simple method:', error);

      // Fallback to simple collaborative filtering
      return this.getSimpleCollaborativeRecommendations(userId, limit, excludeWatched);
    }
  }

  /**
   * Simple collaborative filtering fallback
   */
  private async getSimpleCollaborativeRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    // Find users with similar interests
    const similarUsers = await this.findSimilarUsers(userId, 10);

    if (similarUsers.length === 0) {
      return this.getSimilarContentRecommendations(userId, limit, excludeWatched);
    }

    // Get content liked by similar users
    const collaborativeContent = await this.prisma.content.findMany({
      where: {
        userContent: {
          some: {
            userId: { in: similarUsers },
            status: { in: ['COMPLETED', 'WATCHING'] },
            rating: { gte: 4 }, // Only well-rated content
          },
        },
      },
      take: limit * 2,
      orderBy: {
        userContent: { _count: 'desc' },
      },
      include: {
        contentCaseLinks: {
          include: {
            contentCase: true
          }
        },
      },
    });

    // Filter out watched content
    const userContentIds = excludeWatched ? await this.getUserWatchedContentIds(userId) : new Set();
    const filtered = collaborativeContent
      .filter(content => !userContentIds.has(content.id))
      .map(this.transformContent);

    return filtered.slice(0, limit).map((content, index) => ({
      content,
      score: 0.85 - (index * 0.05),
      reason: 'Recommended by users with similar interests',
      metadata: { similarUsers: similarUsers.length, type: 'collaborative_simple' }
    }));
  }

  /**
   * Get new release recommendations
   */
  private async getNewReleaseRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    const userPreferences = await this.getUserPreferences(userId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const newReleases = await this.prisma.content.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        genreTags: {
          hasSome: userPreferences.favoriteGenres.length > 0
            ? userPreferences.favoriteGenres
            : ['true-crime', 'crime', 'documentary']
        },
      },
      take: limit * 2,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        contentCaseLinks: {
          include: {
            contentCase: true
          }
        },
      },
    });

    // Filter out watched content
    const userContentIds = excludeWatched ? await this.getUserWatchedContentIds(userId) : new Set();
    const filtered = newReleases
      .filter(content => !userContentIds.has(content.id))
      .map(this.transformContent);

    return filtered.slice(0, limit).map((content, index) => ({
      content,
      score: 0.7 - (index * 0.05),
      reason: 'New True Crime content',
      metadata: { releaseDate: content.createdAt, type: 'new_release' }
    }));
  }

  /**
   * Get "For You" personalized recommendations using hybrid system
   */
  private async getForYouRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    try {
      // Use the advanced hybrid recommendation system
      const hybridResults = await this.recommendationService.generateHybridRecommendations(userId, {
        limit,
        excludeWatched,
        // Balanced weights for personalized recommendations
        hybridWeights: {
          collaborative: 0.35,
          contentBased: 0.35,
          trending: 0.15,
          case: 0.1,
          temporal: 0.05
        }
      });

      // Transform to match the expected format
      return hybridResults.recommendations.map(rec => ({
        content: rec.content,
        score: rec.score,
        reason: rec.reason || 'Personalized for you',
        metadata: {
          algorithm: rec.algorithm,
          confidence: rec.confidence,
          factors: rec.factors,
          type: 'for_you_hybrid'
        }
      }));
    } catch (error) {
      console.error('Hybrid for you recommendations failed, falling back to simple method:', error);

      // Fallback to previous method
      return this.getSimpleForYouRecommendations(userId, limit, excludeWatched);
    }
  }

  /**
   * Simple "For You" recommendations fallback
   */
  private async getSimpleForYouRecommendations(userId: string, limit: number, excludeWatched: boolean) {
    // Combine multiple recommendation types with weighted scoring
    const [similar, caseBased, collaborative, trending] = await Promise.all([
      this.getSimilarContentRecommendations(userId, Math.ceil(limit * 0.4), excludeWatched),
      this.getCaseBasedRecommendations(userId, Math.ceil(limit * 0.3), excludeWatched),
      this.getSimpleCollaborativeRecommendations(userId, Math.ceil(limit * 0.2), excludeWatched),
      this.getTrendingRecommendations(userId, Math.ceil(limit * 0.1)),
    ]);

    // Combine and deduplicate
    const allRecs = [...similar, ...caseBased, ...collaborative, ...trending];
    const seen = new Set<string>();
    const deduped = allRecs.filter(rec => {
      if (seen.has(rec.content.id)) {
        return false;
      }
      seen.add(rec.content.id);
      return true;
    });

    // Sort by score and return top recommendations
    return deduped
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(rec => ({
        ...rec,
        reason: 'Personalized for you',
        metadata: { ...rec.metadata, type: 'for_you_simple' }
      }));
  }

  /**
   * Track user content
   */
  async trackContent(userId: string, contentId: string, status: TrackingState) {
    // Validate content exists
    const content = await this.getById(contentId);
    if (!content) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Content not found',
      });
    }

    // Upsert user content tracking
    const userContent = await this.prisma.userContent.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId,
        },
      },
      update: {
        status,
        updatedAt: new Date(),
      },
      create: {
        userId,
        contentId,
        status,
      },
    });

    // Clear user's recommendation cache
    await redisService.delete(`user:${userId}:recommendations`);

    return userContent;
  }

  /**
   * Get user's tracked content
   */
  async getUserContent(userId: string, status?: TrackingState) {
    const where = status ? { userId, status } : { userId };

    const userContent = await this.prisma.userContent.findMany({
      where,
      include: {
        content: {
          include: {
            // platforms: true // Field does not exist,
            // genres: true // Field does not exist,
            // cases: true // Field does not exist,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return userContent.map(uc => ({
      ...this.transformContent(uc.content),
      trackingStatus: uc.status,
      trackedAt: uc.dateAdded,
      updatedAt: uc.updatedAt,
    }));
  }

  /**
   * Enhanced bulk import with external API integration
   */
  async bulkImport(contents: any[], options: {
    enrichWithExternalData?: boolean;
    batchSize?: number;
    updateExisting?: boolean;
  } = {}) {
    const { enrichWithExternalData = true, batchSize = 50, updateExisting = true } = options;

    try {
      // Process in batches
      const results = [];
      for (let i = 0; i < contents.length; i += batchSize) {
        const batch = contents.slice(i, i + batchSize);

        // Enrich with external data if requested
        let enrichedBatch = batch;
        if (enrichWithExternalData) {
          enrichedBatch = await this.enrichContentBatch(batch);
        }

        const batchOperations = enrichedBatch.map(content => {
          const baseData = {
            title: content.title,
            description: content.description,
            contentType: content.contentType || content.type,
            genreTags: content.genreTags || content.genres || [],
            caseTags: content.caseTags || [],
            releaseDate: content.releaseDate,
            runtimeMinutes: content.runtimeMinutes || content.runtime,
            posterUrl: content.posterUrl,
            trailerUrl: content.trailerUrl,
            tmdbId: content.tmdbId,
            imdbId: content.imdbId,
            tvdbId: content.tvdbId,
            totalSeasons: content.totalSeasons,
            totalEpisodes: content.totalEpisodes,
            status: content.status,
            platforms: content.platforms || [],
            updatedAt: new Date(),
          };

          return this.prisma.content.upsert({
            where: {
              id: content.id,
            },
            update: updateExisting ? baseData : {},
            create: {
              id: content.id,
              externalId: content.externalId || content.id,
              ...baseData,
            },
          });
        });

        const batchResults = await this.prisma.$transaction(batchOperations);
        results.push(...batchResults);
      }

      // Transform for search indexing
      const transformedContent = results.map(content => this.transformContentForIndexing(content));

      // Index in search engine
      await this.searchService.indexDocuments('content', transformedContent);

      // Clear cache
      await this.clearCache();

      console.log(`Successfully imported ${results.length} content items`);
      return results.length;
    } catch (error) {
      console.error('Bulk import error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import content',
      });
    }
  }

  /**
   * Enrich content batch with external API data
   */
  private async enrichContentBatch(contents: any[]): Promise<any[]> {
    const enrichedContents = [];

    for (const content of contents) {
      try {
        let enrichedContent = { ...content };

        // Enrich with TMDb data if available
        if (this.externalAPI.tmdb && content.tmdbId) {
          const tmdbData = await this.externalAPI.tmdb.getMovieDetails(content.tmdbId);
          if (tmdbData) {
            enrichedContent = {
              ...enrichedContent,
              description: enrichedContent.description || tmdbData.description,
              genreTags: enrichedContent.genreTags?.length > 0
                ? enrichedContent.genreTags
                : tmdbData.genres || [],
              posterUrl: enrichedContent.posterUrl || tmdbData.images?.poster,
              trailerUrl: enrichedContent.trailerUrl,
              runtimeMinutes: enrichedContent.runtimeMinutes || tmdbData.runtimeMinutes,
            };
          }
        }

        // Enrich with platform availability if available
        if (this.externalAPI.watchmode && content.tmdbId) {
          const watchmodeContent = await this.externalAPI.watchmode.getContentByExternalId(
            content.tmdbId.toString(),
            'tmdb_id'
          );
          if (watchmodeContent && watchmodeContent.platforms) {
            enrichedContent.platforms = watchmodeContent.platforms.map((p: any) => ({
              id: p.id,
              name: p.name,
              type: p.type,
              url: p.url,
            }));
          }
        }

        enrichedContents.push(enrichedContent);
      } catch (error) {
        console.warn(`Failed to enrich content ${content.id}:`, error);
        enrichedContents.push(content); // Use original if enrichment fails
      }
    }

    return enrichedContents;
  }

  /**
   * Transform database content to schema format
   */
  private transformContent(dbContent: any): Content {
    return {
      id: dbContent.id,
      externalId: dbContent.external_id || dbContent.externalId || dbContent.id,
      title: dbContent.title,
      contentType: dbContent.content_type || dbContent.contentType as ContentType,
      description: dbContent.description || undefined,
      releaseDate: dbContent.release_date || dbContent.releaseDate || undefined,
      runtimeMinutes: dbContent.runtime_minutes || dbContent.runtimeMinutes || undefined,
      posterUrl: dbContent.poster_url || dbContent.posterUrl || undefined,
      trailerUrl: dbContent.trailer_url || dbContent.trailerUrl || undefined,
      tmdbId: dbContent.tmdb_id || dbContent.tmdbId || undefined,
      imdbId: dbContent.imdb_id || dbContent.imdbId || undefined,
      tvdbId: dbContent.tvdb_id || dbContent.tvdbId || undefined,
      platforms: dbContent.platforms?.map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        url: p.url || undefined,
        availableFrom: p.availableFrom || p.available_from || undefined,
        availableTo: p.availableTo || p.available_to || undefined,
      })) || [],
      genreTags: dbContent.genre_tags || dbContent.genreTags || dbContent.genres?.map((g: any) => g.name) || [],
      caseTags: dbContent.case_tags || dbContent.caseTags || [],
      totalSeasons: dbContent.total_seasons || dbContent.totalSeasons || dbContent.seasonCount || undefined,
      totalEpisodes: dbContent.total_episodes || dbContent.totalEpisodes || dbContent.episodeCount || undefined,
      status: dbContent.status || undefined,
      searchVector: dbContent.search_vector || dbContent.searchVector || undefined,
      createdAt: dbContent.created_at || dbContent.createdAt,
      updatedAt: dbContent.updated_at || dbContent.updatedAt,
    };
  }

  /**
   * Episode progress tracking
   */
  async trackEpisodeProgress(userId: string, data: EpisodeProgressData[]): Promise<void> {
    try {
      const operations = data.map(episode =>
        this.prisma.episodeProgress.upsert({
          where: {
            userId_contentId_seasonNumber_episodeNumber: {
              userId,
              contentId: episode.contentId,
              seasonNumber: episode.seasonNumber,
              episodeNumber: episode.episodeNumber,
            },
          },
          update: {
            watched: episode.watched,
            watchedAt: episode.watchedAt || (episode.watched ? new Date() : null),
          },
          create: {
            userId,
            contentId: episode.contentId,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watched: episode.watched,
            watchedAt: episode.watchedAt || (episode.watched ? new Date() : null),
          },
        })
      );

      await this.prisma.$transaction(operations);

      // Clear user's progress cache
      await this.clearUserProgressCache(userId);
    } catch (error) {
      console.error('Episode progress tracking error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to track episode progress',
      });
    }
  }

  /**
   * Get user's episode progress for a content
   */
  async getUserEpisodeProgress(userId: string, contentId: string): Promise<any[]> {
    const cacheKey = `${this.userCachePrefix}progress:${userId}:${contentId}`;

    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const progress = await this.prisma.episodeProgress.findMany({
      where: {
        userId,
        contentId,
      },
      orderBy: [
        { seasonNumber: 'asc' },
        { episodeNumber: 'asc' },
      ],
    });

    await redisService.set(cacheKey, progress, CACHE_TTL.USER_CONTENT);
    return progress;
  }

  /**
   * Get user preferences based on their content history
   */
  private async getUserPreferences(userId: string) {
    const cacheKey = `${this.userCachePrefix}preferences:${userId}`;

    const cached = await redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const userContent = await this.prisma.userContent.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'WATCHING'] },
      },
      include: {
        content: true,
      },
    });

    // Analyze user preferences
    const genreCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    const caseCount: Record<string, number> = {};

    userContent.forEach(uc => {
      // Count genres with rating weight
      const weight = uc.rating || 3;
      uc.content.genreTags.forEach(genre => {
        genreCount[genre] = (genreCount[genre] || 0) + weight;
      });

      // Count content types
      typeCount[uc.content.contentType] = (typeCount[uc.content.contentType] || 0) + weight;

      // Count cases
      uc.content.caseTags.forEach(caseTag => {
        caseCount[caseTag] = (caseCount[caseTag] || 0) + weight;
      });
    });

    const preferences = {
      favoriteGenres: Object.entries(genreCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre]) => genre),
      favoriteContentType: Object.entries(typeCount)
        .sort(([, a], [, b]) => b - a)[0]?.[0],
      favoriteCases: Object.entries(caseCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([caseTag]) => caseTag),
    };

    await redisService.set(cacheKey, preferences, CACHE_TTL.USER_CONTENT);
    return preferences;
  }

  /**
   * Get user's watched content IDs
   */
  private async getUserWatchedContentIds(userId: string): Promise<Set<string>> {
    const userContent = await this.prisma.userContent.findMany({
      where: { userId },
      select: { contentId: true },
    });

    return new Set(userContent.map(uc => uc.contentId));
  }

  /**
   * Get user's favorite cases based on their content
   */
  private async getUserFavoriteCases(userId: string): Promise<string[]> {
    const userContent = await this.prisma.userContent.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'WATCHING'] },
        rating: { gte: 4 },
      },
      include: {
        content: {
          select: {
            caseTags: true,
          },
        },
      },
    });

    const caseCount: Record<string, number> = {};
    userContent.forEach(uc => {
      uc.content.caseTags.forEach(caseTag => {
        caseCount[caseTag] = (caseCount[caseTag] || 0) + 1;
      });
    });

    return Object.entries(caseCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([caseTag]) => caseTag);
  }

  /**
   * Find users with similar content preferences
   */
  private async findSimilarUsers(userId: string, limit: number): Promise<string[]> {
    // Get user's content
    const userContent = await this.prisma.userContent.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'WATCHING'] },
      },
      select: { contentId: true },
    });

    const userContentIds = userContent.map(uc => uc.contentId);

    if (userContentIds.length === 0) {
      return [];
    }

    // Find users who watched similar content
    const similarUsers = await this.prisma.userContent.findMany({
      where: {
        contentId: { in: userContentIds },
        userId: { not: userId },
        status: { in: ['COMPLETED', 'WATCHING'] },
      },
      select: { userId: true },
      distinct: ['userId'],
      take: limit,
    });

    return similarUsers.map(uc => uc.userId);
  }

  /**
   * Clear user-specific caches
   */
  private async clearUserProgressCache(userId: string) {
    const pattern = `${this.userCachePrefix}*${userId}*`;
    await redisService.clearPattern(pattern);
  }

  /**
   * Clear all content caches
   */
  private async clearCache() {
    const patterns = [
      `${this.cachePrefix}*`,
      `${this.userCachePrefix}*`,
      `${this.recommendationPrefix}*`,
    ];

    for (const pattern of patterns) {
      await redisService.clearPattern(pattern);
    }
  }



  /**
   * Get detailed content with optional enriched data
   */
  async getDetailedContent(id: string, options: {
    includeCredits?: boolean;
    includeAvailability?: boolean;
    includeRelated?: boolean;
    useCache?: boolean;
  } = {}): Promise<any> {
    const { includeCredits = true, includeAvailability = true, includeRelated = false, useCache = true } = options;
    const cacheKey = `${this.cachePrefix}detailed:${id}:${includeCredits}:${includeAvailability}:${includeRelated}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get basic content first
      const content = await this.getById(id, useCache);
      if (!content) {
        return null;
      }

      const result: any = { ...content };

      // Parallel fetch of enriched data
      const enrichmentPromises: Promise<any>[] = [];

      if (includeCredits) {
        enrichmentPromises.push(
          this.getCastAndCrew(id, { useCache }).catch(error => {
            console.warn(`Failed to get cast/crew for ${id}:`, error);
            return { cast: [], crew: [] };
          })
        );
      }

      if (includeAvailability) {
        enrichmentPromises.push(
          this.getStreamingAvailability(id, { useCache }).catch(error => {
            console.warn(`Failed to get availability for ${id}:`, error);
            return { platforms: [] };
          })
        );
      }

      if (includeRelated) {
        enrichmentPromises.push(
          this.getRelatedContent(id, { limit: 5, useCache }).catch(error => {
            console.warn(`Failed to get related content for ${id}:`, error);
            return [];
          })
        );
      }

      if (enrichmentPromises.length > 0) {
        const enrichmentResults = await Promise.allSettled(enrichmentPromises);

        let resultIndex = 0;
        if (includeCredits) {
          const creditsResult = enrichmentResults[resultIndex++];
          if (creditsResult?.status === 'fulfilled') {
            Object.assign(result, (creditsResult as any).value);
          }
        }

        if (includeAvailability) {
          const availabilityResult = enrichmentResults[resultIndex++];
          if (availabilityResult?.status === 'fulfilled') {
            result.availability = (availabilityResult as any).value;
          }
        }

        if (includeRelated) {
          const relatedResult = enrichmentResults[resultIndex++];
          if (relatedResult?.status === 'fulfilled') {
            result.relatedContent = (relatedResult as any).value;
          }
        }
      }

      // Cache the enriched result
      if (useCache) {
        await redisService.set(cacheKey, result, CACHE_TTL.CONTENT_DETAIL);
      }

      return result;
    } catch (error) {
      console.error('Error getting detailed content:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch detailed content',
      });
    }
  }

  /**
   * Get cast and crew information from external APIs
   */
  async getCastAndCrew(id: string, options: {
    includePhotos?: boolean;
    useCache?: boolean;
  } = {}): Promise<{ cast: any[]; crew: any[] }> {
    const { includePhotos = true, useCache = true } = options;
    const cacheKey = `${this.cachePrefix}credits:${id}:${includePhotos}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get content to find external IDs
      const content = await this.getById(id, useCache);
      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      let cast: any[] = [];
      let crew: any[] = [];

      // Try TMDb first for cast/crew data
      if (this.externalAPI.tmdb && content.tmdbId) {
        try {
          const tmdbCredits = await this.externalAPI.tmdb.getCredits(content.tmdbId, content.contentType === ContentType.MOVIE ? 'movie' : 'tv');
          if (tmdbCredits) {
            cast = tmdbCredits.cast?.slice(0, 20).map((person: any) => ({
              id: person.id,
              name: person.name,
              character: person.character,
              role: 'cast',
              department: 'Acting',
              profilePath: person.profile_path,
              photoUrl: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null,
              order: person.order || 999,
            })) || [];

            crew = tmdbCredits.crew?.slice(0, 15).map((person: any) => ({
              id: person.id,
              name: person.name,
              job: person.job,
              role: 'crew',
              department: person.department,
              profilePath: person.profile_path,
              photoUrl: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null,
            })) || [];
          }
        } catch (error) {
          console.warn(`TMDb credits fetch failed for ${content.tmdbId}:`, error);
        }
      }

      // Fallback to TVDb for TV series if TMDb failed
      if (cast.length === 0 && this.externalAPI.tvdb && content.tvdbId && content.contentType === ContentType.TV_SERIES) {
        try {
          const tvdbSeries = await this.externalAPI.tvdb.getSeriesDetails(content.tvdbId);
          if (tvdbSeries?.characters) {
            cast = tvdbSeries.characters.slice(0, 15).map((char: any, index: number) => ({
              id: char.id || `tvdb-${index}`,
              name: char.personName || char.name,
              character: char.name,
              role: 'cast',
              department: 'Acting',
              photoUrl: char.image,
              order: index,
            }));
          }
        } catch (error) {
          console.warn(`TVDb cast fetch failed for ${content.tvdbId}:`, error);
        }
      }

      const result = { cast, crew };

      // Cache the result
      if (useCache) {
        await redisService.set(cacheKey, result, CACHE_TTL.CONTENT_DETAIL);
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error fetching cast and crew:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch cast and crew information',
      });
    }
  }

  /**
   * Get episodes for TV series
   */
  async getEpisodes(id: string, options: {
    seasonNumber?: number;
    includeProgress?: string; // userId
    useCache?: boolean;
  } = {}): Promise<any> {
    const { seasonNumber, includeProgress, useCache = true } = options;
    const cacheKey = `${this.cachePrefix}episodes:${id}:${seasonNumber || 'all'}:${includeProgress || 'no-progress'}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get content to verify it's a TV series
      const content = await this.getById(id, useCache);
      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      if (content.contentType !== ContentType.TV_SERIES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Content is not a TV series',
        });
      }

      let episodes: any[] = [];
      let seasons: any[] = [];

      // Try TMDb first for episode data
      if (this.externalAPI.tmdb && content.tmdbId) {
        try {
          const tmdbTvDetails = await this.externalAPI.tmdb.getTVSeriesDetails(content.tmdbId);
          if (tmdbTvDetails?.seasons) {
            seasons = tmdbTvDetails.seasons;

            // If specific season requested, get episodes for that season
            if (seasonNumber) {
              const seasonEpisodes = await this.externalAPI.tmdb.getSeasonDetails(content.tmdbId, seasonNumber);
              if (seasonEpisodes?.episodes) {
                episodes = seasonEpisodes.episodes.map((ep: any) => ({
                  id: `tmdb-${content.tmdbId}-${seasonNumber}-${ep.episode_number}`,
                  seasonNumber,
                  episodeNumber: ep.episode_number,
                  title: ep.name,
                  description: ep.overview,
                  airDate: ep.air_date,
                  runtimeMinutes: ep.runtime,
                  stillPath: ep.still_path,
                  imageUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
                  voteAverage: ep.vote_average,
                  voteCount: ep.vote_count,
                }));
              }
            } else {
              // Get all episodes for all seasons (limit to prevent huge responses)
              const seasonPromises = seasons.slice(0, 10).map(async (season: any) => {
                if (season.season_number === 0) return []; // Skip specials
                try {
                  const seasonData = await this.externalAPI.tmdb!.getSeasonDetails(content.tmdbId!, season.season_number);
                  return seasonData?.episodes?.map((ep: any) => ({
                    id: `tmdb-${content.tmdbId}-${season.season_number}-${ep.episode_number}`,
                    seasonNumber: season.season_number,
                    episodeNumber: ep.episode_number,
                    title: ep.name,
                    description: ep.overview,
                    airDate: ep.air_date,
                    runtimeMinutes: ep.runtime,
                    stillPath: ep.still_path,
                    imageUrl: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
                    voteAverage: ep.vote_average,
                    voteCount: ep.vote_count,
                  })) || [];
                } catch (error) {
                  console.warn(`Failed to fetch season ${season.season_number}:`, error);
                  return [];
                }
              });

              const allEpisodes = await Promise.all(seasonPromises);
              episodes = allEpisodes.flat();
            }
          }
        } catch (error) {
          console.warn(`TMDb episodes fetch failed for ${content.tmdbId}:`, error);
        }
      }

      // Fallback to TVDb if TMDb failed
      if (episodes.length === 0 && this.externalAPI.tvdb && content.tvdbId) {
        try {
          const tvdbSeries = await this.externalAPI.tvdb.getSeriesDetails(content.tvdbId);
          const tvdbEpisodes = await this.externalAPI.tvdb.getSeriesEpisodes(content.tvdbId, seasonNumber);

          if (tvdbEpisodes) {
            episodes = tvdbEpisodes.map((ep: any) => ({
              id: `tvdb-${content.tvdbId}-${ep.seasonNumber}-${ep.number}`,
              seasonNumber: ep.seasonNumber,
              episodeNumber: ep.number,
              title: ep.name,
              description: ep.overview,
              airDate: ep.aired,
              runtimeMinutes: ep.runtime,
              imageUrl: ep.image,
            }));
          }
        } catch (error) {
          console.warn(`TVDb episodes fetch failed for ${content.tvdbId}:`, error);
        }
      }

      // Add user progress if requested
      if (includeProgress && episodes.length > 0) {
        try {
          const userProgress = await this.getUserEpisodeProgress(includeProgress, id);
          const progressMap = new Map(
            userProgress.map(p => [`${p.seasonNumber}-${p.episodeNumber}`, p])
          );

          episodes = episodes.map(episode => ({
            ...episode,
            watched: progressMap.get(`${episode.seasonNumber}-${episode.episodeNumber}`)?.watched || false,
            watchedAt: progressMap.get(`${episode.seasonNumber}-${episode.episodeNumber}`)?.watchedAt,
          }));
        } catch (error) {
          console.warn(`Failed to get user progress for ${includeProgress}:`, error);
        }
      }

      const result = {
        contentId: id,
        seasons: seasons.map(s => ({
          seasonNumber: s.season_number,
          name: s.name,
          overview: s.overview,
          posterPath: s.poster_path,
          airDate: s.air_date,
          episodeCount: s.episode_count,
        })),
        episodes: episodes.sort((a, b) => {
          if (a.seasonNumber !== b.seasonNumber) {
            return a.seasonNumber - b.seasonNumber;
          }
          return a.episodeNumber - b.episodeNumber;
        }),
        totalEpisodes: episodes.length,
        seasonsCount: seasons.filter(s => s.season_number > 0).length,
      };

      // Cache the result
      if (useCache) {
        await redisService.set(cacheKey, result, CACHE_TTL.CONTENT_DETAIL);
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error fetching episodes:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch episodes',
      });
    }
  }

  /**
   * Get related content based on similarity
   */
  async getRelatedContent(id: string, options: {
    limit?: number;
    userId?: string;
    similarityThreshold?: number;
    useCache?: boolean;
  } = {}): Promise<any[]> {
    const { limit = 10, userId, similarityThreshold = 0.7, useCache = true } = options;
    const cacheKey = `${this.cachePrefix}related:${id}:${limit}:${userId || 'anonymous'}:${similarityThreshold}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // Get the source content
      const sourceContent = await this.getById(id, useCache);
      if (!sourceContent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      // Get user's watched content to exclude if userId provided
      const userWatchedIds = userId ? await this.getUserWatchedContentIds(userId) : new Set<string>();

      // Strategy 1: Content with shared genres and cases
      const genreBasedContent = await this.prisma.content.findMany({
        where: {
          id: { not: id },
          contentType: sourceContent.contentType,
          OR: [
            {
              genreTags: {
                hasSome: sourceContent.genreTags,
              },
            },
            {
              caseTags: {
                hasSome: sourceContent.caseTags,
              },
            },
          ],
        },
        take: limit * 2,
        include: {
          contentCaseLinks: {
            include: {
              contentCase: true,
            },
          },
        },
      });

      // Strategy 2: Use external API for similar content
      let externalSimilar: any[] = [];
      if (this.externalAPI.tmdb && sourceContent.tmdbId) {
        try {
          const tmdbSimilar = await this.externalAPI.tmdb.getSimilarContent(
            sourceContent.tmdbId,
            sourceContent.contentType === ContentType.MOVIE ? 'movie' : 'tv'
          );

          if (tmdbSimilar?.results) {
            externalSimilar = tmdbSimilar.results.slice(0, 5);
          }
        } catch (error) {
          console.warn(`Failed to get TMDb similar content for ${sourceContent.tmdbId}:`, error);
        }
      }

      // Combine and score results
      const allCandidates = [...genreBasedContent.map(this.transformContent)];

      // Calculate similarity scores
      const scoredContent = allCandidates.map(content => {
        let score = 0;

        // Genre similarity
        const sharedGenres = content.genreTags.filter(genre =>
          sourceContent.genreTags.includes(genre)
        ).length;
        const genreScore = sharedGenres / Math.max(sourceContent.genreTags.length, 1);
        score += genreScore * 0.4;

        // Case similarity
        const sharedCases = content.caseTags.filter(caseTag =>
          sourceContent.caseTags.includes(caseTag)
        ).length;
        const caseScore = sharedCases / Math.max(sourceContent.caseTags.length, 1);
        score += caseScore * 0.6;

        // Release date proximity (recent content gets slight boost)
        if (content.releaseDate && sourceContent.releaseDate) {
          const yearDiff = Math.abs(
            new Date(content.releaseDate).getFullYear() -
            new Date(sourceContent.releaseDate).getFullYear()
          );
          const recencyScore = Math.max(0, (10 - yearDiff) / 10);
          score += recencyScore * 0.1;
        }

        return {
          content,
          score,
          reason: sharedCases > 0 ? 'Related criminal case' : 'Similar genre and style',
        };
      });

      // Filter by similarity threshold and exclude watched content
      let filteredContent = scoredContent
        .filter(item =>
          item.score >= similarityThreshold &&
          !userWatchedIds.has(item.content.id)
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // If we don't have enough results, lower the threshold
      if (filteredContent.length < limit / 2) {
        filteredContent = scoredContent
          .filter(item => !userWatchedIds.has(item.content.id))
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
      }

      const result = filteredContent.map(item => ({
        ...item.content,
        similarityScore: item.score,
        recommendationReason: item.reason,
      }));

      // Cache the result
      if (useCache) {
        await redisService.set(cacheKey, result, CACHE_TTL.RECOMMENDATIONS);
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error getting related content:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get related content',
      });
    }
  }

  /**
   * Get streaming platform availability
   */
  async getStreamingAvailability(id: string, options: {
    country?: string;
    includeUpcoming?: boolean;
    useCache?: boolean;
  } = {}): Promise<any> {
    const { country = 'US', includeUpcoming = true, useCache = true } = options;
    const cacheKey = `${this.cachePrefix}availability:${id}:${country}:${includeUpcoming}`;

    if (useCache) {
      const cached = await redisService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const content = await this.getById(id, useCache);
      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      let platforms: any[] = [];

      // Get current platform data from database
      if (content.platforms && Array.isArray(content.platforms)) {
        platforms = [...content.platforms];
      }

      // Enhance with real-time data from Watchmode
      if (this.externalAPI.watchmode && content.tmdbId) {
        try {
          const watchmodeContent = await this.externalAPI.watchmode.getContentByExternalId(
            content.tmdbId.toString(),
            'tmdb_id'
          );

          if (watchmodeContent?.platforms) {
            const realtimePlatforms = watchmodeContent.platforms
              .filter((p: any) => !country || p.region === country)
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                url: p.url,
                logoUrl: p.logo_100px,
                price: p.price,
                currency: p.currency,
                availableFrom: p.start_date ? new Date(p.start_date) : null,
                availableTo: p.end_date ? new Date(p.end_date) : null,
                deepLink: p.web_url,
                region: p.region,
                updatedAt: new Date(),
              }));

            // Merge with existing platforms, preferring real-time data
            const platformMap = new Map();

            // Add existing platforms
            platforms.forEach(p => platformMap.set(p.id, p));

            // Override with real-time data
            realtimePlatforms.forEach(p => platformMap.set(p.id, p));

            platforms = Array.from(platformMap.values());
          }
        } catch (error) {
          console.warn(`Watchmode availability fetch failed for TMDb ID ${content.tmdbId}:`, error);
        }
      }

      // Categorize platforms
      const categorized = {
        subscription: platforms.filter(p => p.type === 'subscription'),
        rent: platforms.filter(p => p.type === 'rent'),
        buy: platforms.filter(p => p.type === 'buy'),
        free: platforms.filter(p => p.type === 'free'),
        cable: platforms.filter(p => p.type === 'cable'),
      };

      // Add availability summary
      const summary = {
        totalPlatforms: platforms.length,
        subscriptionCount: categorized.subscription.length,
        rentCount: categorized.rent.length,
        buyCount: categorized.buy.length,
        freeCount: categorized.free.length,
        cableCount: categorized.cable.length,
        lowestRentPrice: categorized.rent.length > 0
          ? Math.min(...categorized.rent.map(p => p.price || 999))
          : null,
        lowestBuyPrice: categorized.buy.length > 0
          ? Math.min(...categorized.buy.map(p => p.price || 999))
          : null,
      };

      const result = {
        contentId: id,
        country,
        platforms: categorized,
        allPlatforms: platforms,
        summary,
        lastUpdated: new Date(),
      };

      // Cache for shorter time since availability changes frequently
      if (useCache) {
        await redisService.set(cacheKey, result, 1800); // 30 minutes
      }

      return result;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error getting streaming availability:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get streaming availability',
      });
    }
  }

  /**
   * Handle various user actions
   */
  async handleUserAction(userId: string, contentId: string, action: string, data?: any): Promise<any> {
    try {
      const content = await this.getById(contentId);
      if (!content) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content not found',
        });
      }

      switch (action) {
        case 'add_to_watchlist':
          return await this.addToWatchlist(userId, contentId, data);

        case 'remove_from_watchlist':
          return await this.removeFromWatchlist(userId, contentId);

        case 'rate':
          return await this.rateContent(userId, contentId, data?.rating, data?.notes);

        case 'update_progress':
          return await this.updateProgress(userId, contentId, data);

        case 'add_to_favorites':
          return await this.addToFavorites(userId, contentId);

        case 'remove_from_favorites':
          return await this.removeFromFavorites(userId, contentId);

        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Unknown action: ${action}`,
          });
      }
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      console.error('Error handling user action:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process user action',
      });
    }
  }

  /**
   * Add content to user's watchlist
   */
  private async addToWatchlist(userId: string, contentId: string, data?: any): Promise<any> {
    const userContent = await this.prisma.userContent.upsert({
      where: {
        userId_contentId: { userId, contentId },
      },
      update: {
        status: data?.status || TrackingState.WANT_TO_WATCH,
        updatedAt: new Date(),
      },
      create: {
        userId,
        contentId,
        status: data?.status || TrackingState.WANT_TO_WATCH,
        notes: data?.notes,
      },
      include: {
        content: true,
      },
    });

    // Create social activity
    await this.prisma.socialActivity.create({
      data: {
        userId,
        activityType: 'content_added',
        contentId,
        activityData: { status: userContent.status },
      },
    });

    return userContent;
  }

  /**
   * Remove content from user's watchlist
   */
  private async removeFromWatchlist(userId: string, contentId: string): Promise<any> {
    const deleted = await this.prisma.userContent.delete({
      where: {
        userId_contentId: { userId, contentId },
      },
    });

    // Create social activity
    await this.prisma.socialActivity.create({
      data: {
        userId,
        activityType: 'content_removed',
        contentId,
        activityData: { previousStatus: deleted.status },
      },
    });

    return { success: true };
  }

  /**
   * Rate content
   */
  private async rateContent(userId: string, contentId: string, rating: number, notes?: string): Promise<any> {
    if (!rating || rating < 1 || rating > 5) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Rating must be between 1 and 5',
      });
    }

    const userContent = await this.prisma.userContent.upsert({
      where: {
        userId_contentId: { userId, contentId },
      },
      update: {
        rating,
        notes,
        updatedAt: new Date(),
      },
      create: {
        userId,
        contentId,
        status: TrackingState.COMPLETED,
        rating,
        notes,
        dateCompleted: new Date(),
      },
      include: {
        content: true,
      },
    });

    // Create social activity
    await this.prisma.socialActivity.create({
      data: {
        userId,
        activityType: 'content_rated',
        contentId,
        activityData: { rating, notes },
      },
    });

    return userContent;
  }

  /**
   * Update viewing progress
   */
  private async updateProgress(userId: string, contentId: string, data: any): Promise<any> {
    if (data?.progress) {
      const { seasonNumber, episodeNumber, watched } = data.progress;

      await this.prisma.episodeProgress.upsert({
        where: {
          userId_contentId_seasonNumber_episodeNumber: {
            userId,
            contentId,
            seasonNumber,
            episodeNumber,
          },
        },
        update: {
          watched,
          watchedAt: watched ? new Date() : null,
        },
        create: {
          userId,
          contentId,
          seasonNumber,
          episodeNumber,
          watched,
          watchedAt: watched ? new Date() : null,
        },
      });

      return { success: true, progress: data.progress };
    }

    return { success: true };
  }

  /**
   * Add to favorites (custom list)
   */
  private async addToFavorites(userId: string, contentId: string): Promise<any> {
    // Find or create favorites list
    let favoritesList = await this.prisma.customList.findFirst({
      where: {
        userId,
        title: 'Favorites',
      },
    });

    if (!favoritesList) {
      favoritesList = await this.prisma.customList.create({
        data: {
          userId,
          title: 'Favorites',
          description: 'My favorite True Crime content',
          privacy: 'PRIVATE',
        },
      });
    }

    // Add to list if not already there
    const existingItem = await this.prisma.listItem.findUnique({
      where: {
        listId_contentId: {
          listId: favoritesList.id,
          contentId,
        },
      },
    });

    if (existingItem) {
      return { success: true, message: 'Already in favorites' };
    }

    const maxOrder = await this.prisma.listItem.findFirst({
      where: { listId: favoritesList.id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });

    await this.prisma.listItem.create({
      data: {
        listId: favoritesList.id,
        contentId,
        orderIndex: (maxOrder?.orderIndex || 0) + 1,
      },
    });

    return { success: true, listId: favoritesList.id };
  }

  /**
   * Remove from favorites
   */
  private async removeFromFavorites(userId: string, contentId: string): Promise<any> {
    const favoritesList = await this.prisma.customList.findFirst({
      where: {
        userId,
        title: 'Favorites',
      },
    });

    if (!favoritesList) {
      return { success: true, message: 'Favorites list not found' };
    }

    await this.prisma.listItem.deleteMany({
      where: {
        listId: favoritesList.id,
        contentId,
      },
    });

    return { success: true };
  }

  /**
   * Transform search hit from MeiliSearch to Content schema format
   * Uses the new field transformer utility for consistent camelCase output
   */
  private transformSearchHitToContent(hit: any): Content {
    try {
      // Use the new transformation utility for consistent field conversion
      const transformedHit = transformContentItem(hit);

      // Generate a placeholder poster URL based on content type if missing
      const getPosterUrl = () => {
        if (transformedHit.posterUrl) {
          return transformedHit.posterUrl;
        }

        // Use placeholder images based on content type
        const placeholders = {
          MOVIE: 'https://via.placeholder.com/500x750/1a1a2e/eee?text=Movie',
          TV_SERIES: 'https://via.placeholder.com/500x750/16213e/eee?text=Series',
          DOCUMENTARY: 'https://via.placeholder.com/500x750/0f3460/eee?text=Documentary',
          PODCAST: 'https://via.placeholder.com/500x750/533483/eee?text=Podcast',
        };

        const contentType = transformedHit.contentType || 'DOCUMENTARY';
        return placeholders[contentType] || 'https://via.placeholder.com/500x750/333/eee?text=True+Crime';
      };

      return {
        id: transformedHit.id,
        externalId: transformedHit.externalId || transformedHit.id,
        title: transformedHit.title,
        contentType: transformedHit.contentType as ContentType,
        description: transformedHit.description,
        releaseDate: transformedHit.releaseDate ?
          (typeof transformedHit.releaseDate === 'string' ? new Date(transformedHit.releaseDate) : transformedHit.releaseDate) :
          (transformedHit.releaseYear ? new Date(`${transformedHit.releaseYear}-01-01`) : undefined),
        // Add releaseYear for frontend compatibility
        releaseYear: transformedHit.releaseYear ||
          (transformedHit.releaseDate ?
            (typeof transformedHit.releaseDate === 'string'
              ? new Date(transformedHit.releaseDate).getFullYear()
              : transformedHit.releaseDate.getFullYear())
            : undefined),
        // Add rating field for frontend
        rating: transformedHit.rating || transformedHit.userRating || transformedHit.imdbRating || undefined,
        runtimeMinutes: transformedHit.runtimeMinutes,
        posterUrl: getPosterUrl(),
        trailerUrl: transformedHit.trailerUrl,
        tmdbId: transformedHit.tmdbId,
        imdbId: transformedHit.imdbId,
        tvdbId: transformedHit.tvdbId,
        // Transform platforms to ensure they have the expected structure
        platforms: Array.isArray(transformedHit.platforms) ?
          transformedHit.platforms.map((p: any) => ({
            id: p.id || p.platformId || p.name,
            name: p.name || p.platformName,
            logoUrl: p.logoUrl || p.logo_url || p.logo || undefined,
            type: p.type || 'streaming'
          })) : [],
        genreTags: Array.isArray(transformedHit.genreTags) ? transformedHit.genreTags : [],
        // Use caseIds for frontend compatibility (frontend expects caseIds, not caseTags)
        caseIds: Array.isArray(transformedHit.caseTags) ? transformedHit.caseTags :
                 (Array.isArray(transformedHit.caseIds) ? transformedHit.caseIds : []),
        caseTags: Array.isArray(transformedHit.caseTags) ? transformedHit.caseTags : [],
        totalSeasons: transformedHit.totalSeasons,
        totalEpisodes: transformedHit.totalEpisodes,
        status: transformedHit.status,
        searchVector: transformedHit.searchVector,
        createdAt: transformedHit.createdAt ?
          (typeof transformedHit.createdAt === 'string' ? new Date(transformedHit.createdAt) : transformedHit.createdAt) :
          new Date(),
        updatedAt: transformedHit.updatedAt ?
          (typeof transformedHit.updatedAt === 'string' ? new Date(transformedHit.updatedAt) : transformedHit.updatedAt) :
          new Date(),
      };
    } catch (error) {
      console.warn('Failed to transform search hit using new transformer, falling back to original method:', error);

      // Fallback to original transformation if the new method fails
      return this.transformSearchHitToContentLegacy(hit);
    }
  }

  /**
   * Legacy transformation method as fallback
   */
  private transformSearchHitToContentLegacy(hit: any): Content {
    const getPosterUrl = () => {
      if (hit.posterUrl || hit.poster_url) {
        return hit.posterUrl || hit.poster_url;
      }

      const placeholders = {
        MOVIE: 'https://via.placeholder.com/500x750/1a1a2e/eee?text=Movie',
        TV_SERIES: 'https://via.placeholder.com/500x750/16213e/eee?text=Series',
        DOCUMENTARY: 'https://via.placeholder.com/500x750/0f3460/eee?text=Documentary',
        PODCAST: 'https://via.placeholder.com/500x750/533483/eee?text=Podcast',
      };

      const contentType = hit.contentType || hit.content_type || 'DOCUMENTARY';
      return placeholders[contentType] || 'https://via.placeholder.com/500x750/333/eee?text=True+Crime';
    };

    return {
      id: hit.id,
      externalId: hit.external_id || hit.id,
      title: hit.title,
      contentType: hit.contentType || hit.content_type as ContentType,
      description: hit.description,
      releaseDate: hit.releaseDate || (hit.release_year ? new Date(`${hit.release_year}-01-01`) : undefined),
      // Add releaseYear for frontend compatibility
      releaseYear: hit.release_year || hit.releaseYear ||
        (hit.releaseDate ? new Date(hit.releaseDate).getFullYear() : undefined),
      // Add rating field for frontend
      rating: hit.rating || hit.user_rating || hit.imdb_rating || undefined,
      runtimeMinutes: hit.runtimeMinutes || hit.runtime_minutes,
      posterUrl: getPosterUrl(),
      trailerUrl: hit.trailerUrl || hit.trailer_url,
      tmdbId: hit.tmdbId || hit.tmdb_id,
      imdbId: hit.imdbId || hit.imdb_id,
      tvdbId: hit.tvdbId || hit.tvdb_id,
      // Transform platforms to ensure proper structure
      platforms: Array.isArray(hit.platforms) ?
        hit.platforms.map((p: any) => ({
          id: p.id || p.platform_id || p.name,
          name: p.name || p.platform_name,
          logoUrl: p.logoUrl || p.logo_url || p.logo || undefined,
          type: p.type || 'streaming'
        })) : [],
      genreTags: hit.genreTags || hit.genre_tags || [],
      // Use caseIds for frontend compatibility
      caseIds: hit.caseTags || hit.case_tags || hit.caseIds || hit.case_ids || [],
      caseTags: hit.caseTags || hit.case_tags || [],
      totalSeasons: hit.totalSeasons || hit.total_seasons,
      totalEpisodes: hit.totalEpisodes || hit.total_episodes,
      status: hit.status,
      searchVector: hit.searchVector || hit.search_vector,
      createdAt: hit.createdAt ? new Date(hit.createdAt) : new Date(),
      updatedAt: hit.updatedAt ? new Date(hit.updatedAt) : new Date(),
    };
  }

  /**
   * Transform content for search indexing
   * Ensures consistent camelCase field names for Meilisearch indexing
   */
  private transformContentForIndexing(content: any): any {
    // First apply our standard transformation to ensure camelCase
    const transformed = transformSearchResult(content);

    // Return a clean, consistent object for indexing
    return {
      id: transformed.id,
      externalId: transformed.externalId || transformed.id,
      title: transformed.title,
      description: transformed.description,
      contentType: transformed.contentType,
      genreTags: Array.isArray(transformed.genreTags) ? transformed.genreTags : [],
      caseTags: Array.isArray(transformed.caseTags) ? transformed.caseTags : [],
      caseIds: Array.isArray(transformed.caseIds) ? transformed.caseIds : [],
      releaseDate: transformed.releaseDate,
      releaseYear: transformed.releaseYear,
      runtimeMinutes: transformed.runtimeMinutes,
      posterUrl: transformed.posterUrl,
      trailerUrl: transformed.trailerUrl,
      platforms: Array.isArray(transformed.platforms) ? transformed.platforms : [],
      totalSeasons: transformed.totalSeasons,
      totalEpisodes: transformed.totalEpisodes,
      status: transformed.status,
      tmdbId: transformed.tmdbId,
      imdbId: transformed.imdbId,
      tvdbId: transformed.tvdbId,
      popularity: transformed.popularity || 0,
      rating: transformed.rating || 0,
      searchVector: transformed.searchVector,
      createdAt: transformed.createdAt,
      updatedAt: transformed.updatedAt
    };
  }
}

