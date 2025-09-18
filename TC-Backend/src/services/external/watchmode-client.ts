/**
 * Watchmode API Client
 *
 * Integrates with Watchmode API to fetch streaming availability data across 200+ platforms.
 * Includes specialized retry logic for rate limits and comprehensive data transformation.
 */

import { BaseApiClient, DEFAULT_CONFIGS } from '../base/api-client.js';

// Watchmode API Response Types
interface WatchmodeSource {
  source_id: number;
  name: string;
  type: 'sub' | 'free' | 'purchase' | 'rent';
  region: string;
  ios_url?: string;
  android_url?: string;
  web_url?: string;
  format: '4K' | 'HD' | 'SD';
  price?: number;
  seasons?: number[];
  episodes?: number[];
}

interface WatchmodeTitle {
  id: number;
  title: string;
  original_title: string;
  plot_overview: string;
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'tv_special' | 'short_film';
  runtime_minutes?: number;
  year: number;
  end_year?: number;
  release_date: string;
  imdb_id: string;
  tmdb_id: number;
  tmdb_type: 'movie' | 'tv';
  genre_names: string[];
  user_rating: number;
  critic_score: number;
  us_rating: string;
  poster: string;
  backdrop: string;
  original_language: string;
  similar_titles: number[];
  sources: WatchmodeSource[];
  trailer: string;
  trailer_thumbnail: string;
}

interface WatchmodeSearchResponse {
  titles: WatchmodeTitle[];
  total_results: number;
  total_pages: number;
}

interface WatchmodeNetworksResponse {
  id: number;
  name: string;
  type: 'sub' | 'free' | 'purchase' | 'rent';
  logo_100px: string;
  ios_appstore_url?: string;
  android_playstore_url?: string;
  website_url?: string;
}

// Transformed types for internal use
export interface StreamingPlatform {
  id: number;
  name: string;
  type: 'subscription' | 'free' | 'purchase' | 'rent';
  region: string;
  urls: {
    ios?: string;
    android?: string;
    web?: string;
  };
  quality: 'UHD' | 'HD' | 'SD';
  price?: number;
  availableSeasons?: number[];
  availableEpisodes?: number[];
}

export interface ContentAvailability {
  id: number;
  title: string;
  originalTitle: string;
  description: string;
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'tv_special' | 'short_film';
  runtimeMinutes?: number;
  releaseYear: number;
  endYear?: number;
  releaseDate: string;
  externalIds: {
    imdb: string;
    tmdb: number;
  };
  tmdbType: 'movie' | 'tv';
  genres: string[];
  ratings: {
    user: number;
    critic: number;
  };
  certification: string;
  images: {
    poster: string;
    backdrop: string;
  };
  language: string;
  similarTitles: number[];
  platforms: StreamingPlatform[];
  trailer?: {
    url: string;
    thumbnail: string;
  };
  lastUpdated: string;
}

export interface WatchmodeSearchParams {
  search_field?: 'name' | 'imdb_id' | 'tmdb_id';
  search_value: string;
  types?: ('movie' | 'tv_series' | 'tv_miniseries' | 'tv_special' | 'short_film')[];
  genres?: string[];
  regions?: string[];
  source_types?: ('sub' | 'free' | 'purchase' | 'rent')[];
  source_ids?: number[];
  year_min?: number;
  year_max?: number;
  imdb_rating_min?: number;
  imdb_rating_max?: number;
  sort_by?: 'relevance_desc' | 'popularity_desc' | 'release_date_desc' | 'name_asc';
  page?: number;
}

class WatchmodeApiClient extends BaseApiClient {
  private static readonly BASE_URL = 'https://api.watchmode.com/v1';
  private static readonly TRUE_CRIME_GENRES = [
    'Crime',
    'Documentary',
    'Mystery',
    'Thriller',
    'Biography'
  ];

  constructor(apiKey: string) {
    const config = {
      ...DEFAULT_CONFIGS.FAST_API,
      baseURL: WatchmodeApiClient.BASE_URL,
      apiKey,
      headers: {
        'Content-Type': 'application/json'
      },
      // Watchmode specific rate limits: 1000 requests per day for free tier
      rateLimitConfig: {
        requestsPerSecond: 1,
        requestsPerMinute: 10,
        requestsPerHour: 40
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 3600, // 1 hour - streaming data changes frequently
        maxSize: 2000
      }
    };

    super(config);
  }

  /**
   * Search for content by various criteria
   */
  async searchContent(params: WatchmodeSearchParams): Promise<ContentAvailability[]> {
    const cacheKey = this.generateCacheKey('GET', '/search', params);

    const queryParams = new URLSearchParams();
    queryParams.append('apikey', this.config.apiKey!);

    if (params.search_field) queryParams.append('search_field', params.search_field);
    queryParams.append('search_value', params.search_value);

    if (params.types?.length) {
      queryParams.append('types', params.types.join(','));
    }

    if (params.genres?.length) {
      queryParams.append('genres', params.genres.join(','));
    }

    if (params.regions?.length) {
      queryParams.append('regions', params.regions.join(','));
    }

    if (params.source_types?.length) {
      queryParams.append('source_types', params.source_types.join(','));
    }

    if (params.source_ids?.length) {
      queryParams.append('source_ids', params.source_ids.join(','));
    }

    if (params.year_min) queryParams.append('year_min', params.year_min.toString());
    if (params.year_max) queryParams.append('year_max', params.year_max.toString());
    if (params.imdb_rating_min) queryParams.append('imdb_rating_min', params.imdb_rating_min.toString());
    if (params.imdb_rating_max) queryParams.append('imdb_rating_max', params.imdb_rating_max.toString());
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.page) queryParams.append('page', params.page.toString());

    const response = await this.makeRequest<WatchmodeSearchResponse>(
      {
        method: 'GET',
        url: `/search?${queryParams.toString()}`
      },
      cacheKey,
      3600 // Cache for 1 hour
    );

    return response.titles.map(title => this.transformTitle(title));
  }

  /**
   * Get content details by Watchmode ID
   */
  async getContentById(watchmodeId: number): Promise<ContentAvailability | null> {
    const cacheKey = this.generateCacheKey('GET', `/title/${watchmodeId}`);

    try {
      const title = await this.makeRequest<WatchmodeTitle>(
        {
          method: 'GET',
          url: `/title/${watchmodeId}`,
          params: { apikey: this.config.apiKey }
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return this.transformTitle(title);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get content by external ID (IMDB or TMDB)
   */
  async getContentByExternalId(
    externalId: string,
    idType: 'imdb_id' | 'tmdb_id'
  ): Promise<ContentAvailability | null> {
    const results = await this.searchContent({
      search_field: idType,
      search_value: externalId
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Search specifically for True Crime content
   */
  async searchTrueCrimeContent(query?: string, page: number = 1): Promise<ContentAvailability[]> {
    const searchParams: WatchmodeSearchParams = {
      search_field: 'name',
      search_value: query || 'true crime',
      types: ['movie', 'tv_series', 'tv_miniseries', 'tv_special'],
      genres: WatchmodeApiClient.TRUE_CRIME_GENRES,
      sort_by: 'popularity_desc',
      page
    };

    return this.searchContent(searchParams);
  }

  /**
   * Get available streaming platforms/networks
   */
  async getStreamingPlatforms(region: string = 'US'): Promise<StreamingPlatform[]> {
    const cacheKey = this.generateCacheKey('GET', '/sources', { region });

    const sources = await this.makeRequest<WatchmodeNetworksResponse[]>(
      {
        method: 'GET',
        url: '/sources',
        params: {
          apikey: this.config.apiKey,
          regions: region
        }
      },
      cacheKey,
      86400 // Cache for 24 hours - platform data rarely changes
    );

    return sources.map(source => ({
      id: source.id,
      name: source.name,
      type: this.mapSourceType(source.type),
      region,
      urls: {
        ios: source.ios_appstore_url,
        android: source.android_playstore_url,
        web: source.website_url
      },
      quality: 'HD' as const // Default, will be overridden by specific content data
    }));
  }

  /**
   * Get trending True Crime content
   */
  async getTrendingTrueCrime(limit: number = 20): Promise<ContentAvailability[]> {
    // Watchmode doesn't have a direct trending endpoint, so we'll search for popular content
    const results = await this.searchTrueCrimeContent('', 1);
    return results.slice(0, limit);
  }

  /**
   * Health check specific to Watchmode API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: '/sources',
        params: { apikey: this.config.apiKey },
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Transform Watchmode API response to internal format
   */
  private transformTitle(title: WatchmodeTitle): ContentAvailability {
    return {
      id: title.id,
      title: title.title,
      originalTitle: title.original_title,
      description: title.plot_overview || '',
      type: title.type,
      runtimeMinutes: title.runtime_minutes,
      releaseYear: title.year,
      endYear: title.end_year,
      releaseDate: title.release_date,
      externalIds: {
        imdb: title.imdb_id,
        tmdb: title.tmdb_id
      },
      tmdbType: title.tmdb_type,
      genres: title.genre_names || [],
      ratings: {
        user: title.user_rating || 0,
        critic: title.critic_score || 0
      },
      certification: title.us_rating || '',
      images: {
        poster: title.poster || '',
        backdrop: title.backdrop || ''
      },
      language: title.original_language || 'en',
      similarTitles: title.similar_titles || [],
      platforms: (title.sources || []).map(source => this.transformSource(source)),
      trailer: title.trailer ? {
        url: title.trailer,
        thumbnail: title.trailer_thumbnail
      } : undefined,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Transform Watchmode source to internal platform format
   */
  private transformSource(source: WatchmodeSource): StreamingPlatform {
    return {
      id: source.source_id,
      name: source.name,
      type: this.mapSourceType(source.type),
      region: source.region,
      urls: {
        ios: source.ios_url,
        android: source.android_url,
        web: source.web_url
      },
      quality: this.mapQuality(source.format),
      price: source.price,
      availableSeasons: source.seasons,
      availableEpisodes: source.episodes
    };
  }

  /**
   * Map Watchmode source types to internal types
   */
  private mapSourceType(type: string): 'subscription' | 'free' | 'purchase' | 'rent' {
    switch (type) {
      case 'sub':
        return 'subscription';
      case 'free':
        return 'free';
      case 'purchase':
        return 'purchase';
      case 'rent':
        return 'rent';
      default:
        return 'subscription';
    }
  }

  /**
   * Map Watchmode quality formats to internal quality levels
   */
  private mapQuality(format: string): 'UHD' | 'HD' | 'SD' {
    switch (format) {
      case '4K':
        return 'UHD';
      case 'HD':
        return 'HD';
      case 'SD':
        return 'SD';
      default:
        return 'HD';
    }
  }
}

export { WatchmodeApiClient };