/**
 * Content Service
 *
 * Core business logic for content management, aggregation, and synchronization.
 * Handles content from external APIs and provides unified access for the application.
 */

import { PrismaClient } from '@prisma/client';
import { BaseRepository } from '../base/repository.js';
import { ContentAggregatorService, AggregatedContent, AggregationResult } from '../transformation/content-aggregator.js';
import { ExternalAPIManager } from '../external/index.js';

// Domain types for content service
export interface ContentEntity {
  id: string;
  externalId: string;
  title: string;
  description?: string;
  contentType: 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST';
  genreTags: string[];
  caseTags: string[];
  releaseDate?: Date;
  runtimeMinutes?: number;
  posterUrl?: string;
  trailerUrl?: string;
  platforms: any; // JSON field
  tmdbId?: number;
  imdbId?: string;
  searchVector?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContentData {
  externalId: string;
  title: string;
  description?: string;
  contentType: 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST';
  genreTags: string[];
  caseTags: string[];
  releaseDate?: Date;
  runtimeMinutes?: number;
  posterUrl?: string;
  trailerUrl?: string;
  platforms: any;
  tmdbId?: number;
  imdbId?: string;
}

export interface UpdateContentData {
  title?: string;
  description?: string;
  genreTags?: string[];
  caseTags?: string[];
  releaseDate?: Date;
  runtimeMinutes?: number;
  posterUrl?: string;
  trailerUrl?: string;
  platforms?: any;
  tmdbId?: number;
  imdbId?: string;
}

export interface ContentSearchParams {
  query?: string;
  contentType?: string[];
  genreTags?: string[];
  caseTags?: string[];
  platforms?: string[];
  yearMin?: number;
  yearMax?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'release_date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ContentSyncOptions {
  force?: boolean;
  sources?: ('watchmode' | 'tmdb' | 'tvdb' | 'tvmaze')[];
  trueCrimeOnly?: boolean;
}

class ContentRepository extends BaseRepository<ContentEntity, CreateContentData, UpdateContentData> {
  protected model = this.prisma.content;
  protected entityName = 'Content';

  /**
   * Search content using full-text search
   */
  async searchByText(query: string, options: ContentSearchParams = {}): Promise<ContentEntity[]> {
    const {
      contentType,
      genreTags,
      caseTags,
      platforms,
      yearMin,
      yearMax,
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = options;

    const whereClause: any = {};

    // Text search
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { searchVector: { contains: query } }
      ];
    }

    // Content type filter
    if (contentType?.length) {
      whereClause.contentType = { in: contentType };
    }

    // Genre filter
    if (genreTags?.length) {
      whereClause.genreTags = { hasSome: genreTags };
    }

    // Case filter
    if (caseTags?.length) {
      whereClause.caseTags = { hasSome: caseTags };
    }

    // Year range filter
    if (yearMin || yearMax) {
      whereClause.releaseDate = {};
      if (yearMin) {
        whereClause.releaseDate.gte = new Date(`${yearMin}-01-01`);
      }
      if (yearMax) {
        whereClause.releaseDate.lte = new Date(`${yearMax}-12-31`);
      }
    }

    // Platform filter (JSON field query)
    if (platforms?.length) {
      // This would need a more complex JSON query in practice
      // For now, we'll filter in application logic
    }

    // Sorting
    let orderBy: any = {};
    switch (sortBy) {
      case 'release_date':
        orderBy = { releaseDate: sortOrder };
        break;
      case 'title':
        orderBy = { title: sortOrder };
        break;
      case 'popularity':
        orderBy = { updatedAt: sortOrder }; // Proxy for popularity
        break;
      default:
        orderBy = { updatedAt: 'desc' };
    }

    try {
      const results = await this.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit
      });

      return results;
    } catch (error) {
      throw this.handleError(error, 'searchByText');
    }
  }

  /**
   * Find content by external ID
   */
  async findByExternalId(externalId: string): Promise<ContentEntity | null> {
    return this.findFirst({ where: { externalId } });
  }

  /**
   * Find content by TMDb ID
   */
  async findByTmdbId(tmdbId: number): Promise<ContentEntity | null> {
    return this.findFirst({ where: { tmdbId } });
  }

  /**
   * Find content by IMDB ID
   */
  async findByImdbId(imdbId: string): Promise<ContentEntity | null> {
    return this.findFirst({ where: { imdbId } });
  }

  /**
   * Get trending True Crime content
   */
  async getTrendingTrueCrime(limit: number = 20): Promise<ContentEntity[]> {
    return this.findMany({
      where: {
        OR: [
          { genreTags: { hasSome: ['Crime', 'Documentary', 'Mystery', 'Thriller'] } },
          { caseTags: { isEmpty: false } }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      take: limit
    });
  }

  /**
   * Get content by case tags
   */
  async getByCaseTags(caseTags: string[], limit: number = 20): Promise<ContentEntity[]> {
    return this.findMany({
      where: { caseTags: { hasSome: caseTags } },
      orderBy: { releaseDate: 'desc' },
      take: limit
    });
  }

  /**
   * Update search vector for full-text search
   */
  async updateSearchVector(id: string): Promise<void> {
    try {
      const content = await this.findById(id);
      if (!content) return;

      const searchVector = [
        content.title,
        content.description || '',
        ...content.genreTags,
        ...content.caseTags
      ].join(' ').toLowerCase();

      await this.update(id, { searchVector } as UpdateContentData);
    } catch (error) {
      throw this.handleError(error, 'updateSearchVector');
    }
  }
}

export class ContentService {
  private contentRepository: ContentRepository;
  private contentAggregator: ContentAggregatorService;

  constructor(
    private prisma: PrismaClient,
    private externalAPIManager: ExternalAPIManager
  ) {
    this.contentRepository = new ContentRepository(prisma);
    this.contentAggregator = new ContentAggregatorService(
      externalAPIManager.watchmode!,
      externalAPIManager.tmdb!,
      externalAPIManager.tvdb!,
      externalAPIManager.tvmaze!,
      externalAPIManager.wikidata!
    );
  }

  /**
   * Search content across all sources
   */
  async searchContent(params: ContentSearchParams): Promise<{
    results: ContentEntity[];
    total: number;
    aggregated?: AggregationResult[];
  }> {
    const { query, limit = 20 } = params;

    // Search local database first
    const localResults = await this.contentRepository.searchByText(query || '', params);
    const total = await this.contentRepository.count({
      title: { contains: query, mode: 'insensitive' }
    });

    // If we don't have enough results, search external APIs
    let aggregatedResults: AggregationResult[] = [];
    if (localResults.length < limit && query) {
      try {
        aggregatedResults = await this.contentAggregator.searchTrueCrimeContent(query, limit - localResults.length);
      } catch (error) {
        console.error('External API search failed:', error);
      }
    }

    return {
      results: localResults,
      total,
      aggregated: aggregatedResults
    };
  }

  /**
   * Get content by ID with all details
   */
  async getContentById(id: string): Promise<ContentEntity | null> {
    return this.contentRepository.findById(id);
  }

  /**
   * Get trending True Crime content
   */
  async getTrendingContent(limit: number = 20): Promise<ContentEntity[]> {
    return this.contentRepository.getTrendingTrueCrime(limit);
  }

  /**
   * Get content related to specific criminal cases
   */
  async getContentByCases(caseNames: string[], limit: number = 20): Promise<ContentEntity[]> {
    return this.contentRepository.getByCaseTags(caseNames, limit);
  }

  /**
   * Sync content from external APIs
   */
  async syncContent(options: ContentSyncOptions = {}): Promise<{
    synced: number;
    errors: string[];
    skipped: number;
  }> {
    const results = {
      synced: 0,
      errors: [] as string[],
      skipped: 0
    };

    try {
      // Search for True Crime content across external APIs
      const searchTerms = [
        'true crime',
        'serial killer',
        'murder mystery',
        'criminal investigation',
        'cold case'
      ];

      for (const term of searchTerms) {
        try {
          const aggregatedResults = await this.contentAggregator.searchTrueCrimeContent(term, 50);

          for (const result of aggregatedResults) {
            try {
              await this.syncSingleContent(result.content);
              results.synced++;
            } catch (error) {
              results.errors.push(`Failed to sync ${result.content.title}: ${error}`);
            }
          }
        } catch (error) {
          results.errors.push(`Failed to search for "${term}": ${error}`);
        }
      }
    } catch (error) {
      results.errors.push(`Content sync failed: ${error}`);
    }

    return results;
  }

  /**
   * Sync a single content item from aggregated data
   */
  private async syncSingleContent(aggregatedContent: AggregatedContent): Promise<ContentEntity> {
    // Check if content already exists
    let existingContent: ContentEntity | null = null;

    if (aggregatedContent.externalIds.tmdb) {
      existingContent = await this.contentRepository.findByTmdbId(aggregatedContent.externalIds.tmdb);
    }

    if (!existingContent && aggregatedContent.externalIds.imdb) {
      existingContent = await this.contentRepository.findByImdbId(aggregatedContent.externalIds.imdb);
    }

    const contentData = this.transformAggregatedContent(aggregatedContent);

    if (existingContent) {
      // Update existing content
      return this.contentRepository.update(existingContent.id, contentData) as Promise<ContentEntity>;
    } else {
      // Create new content
      return this.contentRepository.create({
        ...contentData,
        externalId: aggregatedContent.externalIds.tmdb?.toString() ||
                   aggregatedContent.externalIds.imdb ||
                   aggregatedContent.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
      });
    }
  }

  /**
   * Transform aggregated content to database format
   */
  private transformAggregatedContent(aggregated: AggregatedContent): Omit<CreateContentData, 'externalId'> {
    return {
      title: aggregated.title,
      description: aggregated.description,
      contentType: aggregated.contentType.toUpperCase() as 'MOVIE' | 'TV_SERIES' | 'DOCUMENTARY' | 'PODCAST',
      genreTags: aggregated.genreTags,
      caseTags: aggregated.caseTags,
      releaseDate: aggregated.releaseDate ? new Date(aggregated.releaseDate) : undefined,
      runtimeMinutes: aggregated.runtimeMinutes,
      posterUrl: aggregated.posterUrl,
      trailerUrl: aggregated.trailerUrl,
      platforms: aggregated.platforms,
      tmdbId: aggregated.externalIds.tmdb,
      imdbId: aggregated.externalIds.imdb
    };
  }

  /**
   * Get content recommendations for a user
   */
  async getRecommendations(userId: string, limit: number = 10): Promise<ContentEntity[]> {
    // This would implement a recommendation algorithm based on user's tracking history
    // For now, return trending content
    return this.getTrendingContent(limit);
  }

  /**
   * Get platform availability for content
   */
  async getPlatformAvailability(contentId: string): Promise<any> {
    const content = await this.contentRepository.findById(contentId);
    return content?.platforms || [];
  }

  /**
   * Update content metadata
   */
  async updateContent(id: string, data: UpdateContentData): Promise<ContentEntity | null> {
    const updated = await this.contentRepository.update(id, data);

    if (updated) {
      // Update search vector
      await this.contentRepository.updateSearchVector(id);
    }

    return updated;
  }

  /**
   * Delete content
   */
  async deleteContent(id: string): Promise<boolean> {
    const deleted = await this.contentRepository.delete(id);
    return deleted !== null;
  }

  /**
   * Get content statistics
   */
  async getStatistics(): Promise<{
    totalContent: number;
    byType: Record<string, number>;
    byGenre: Record<string, number>;
    recentlyAdded: number;
  }> {
    const totalContent = await this.contentRepository.count();

    // Get content by type
    const movieCount = await this.contentRepository.count({ contentType: 'MOVIE' });
    const tvCount = await this.contentRepository.count({ contentType: 'TV_SERIES' });
    const docCount = await this.contentRepository.count({ contentType: 'DOCUMENTARY' });
    const podcastCount = await this.contentRepository.count({ contentType: 'PODCAST' });

    // Get recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = await this.contentRepository.count({
      createdAt: { gte: sevenDaysAgo }
    });

    return {
      totalContent,
      byType: {
        movies: movieCount,
        tvSeries: tvCount,
        documentaries: docCount,
        podcasts: podcastCount
      },
      byGenre: {}, // Would need aggregation query
      recentlyAdded
    };
  }

  /**
   * Health check for content service
   */
  async healthCheck(): Promise<{
    database: boolean;
    externalAPIs: boolean;
    lastSync?: Date;
  }> {
    try {
      // Check database connectivity
      await this.contentRepository.count();
      const database = true;

      // Check external APIs
      const apiHealth = await this.externalAPIManager.healthCheck();
      const externalAPIs = apiHealth.overall;

      return {
        database,
        externalAPIs,
        lastSync: new Date() // Would track actual last sync time
      };
    } catch (error) {
      return {
        database: false,
        externalAPIs: false
      };
    }
  }
}

export { ContentRepository };