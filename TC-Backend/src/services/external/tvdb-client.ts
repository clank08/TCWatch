/**
 * TheTVDB API Client
 *
 * Client for TheTVDB API v4 to fetch detailed TV series data including episode information.
 * Includes JWT token management and specialized episode tracking features.
 */

import { BaseApiClient, DEFAULT_CONFIGS } from '../base/api-client.js';

// TheTVDB API Response Types
interface TVDBAuthResponse {
  data: {
    token: string;
  };
  status: string;
}

interface TVDBSeries {
  id: number;
  name: string;
  slug: string;
  image?: string;
  nameTranslations: string[];
  overviewTranslations: string[];
  aliases: TVDBAlias[];
  firstAired: string;
  lastAired?: string;
  nextAired?: string;
  score: number;
  status: TVDBSeriesStatus;
  originalCountry: string;
  originalLanguage: string;
  defaultSeasonType: number;
  isOrderRandomized: boolean;
  lastUpdated: string;
  averageRuntime: number;
  episodes?: TVDBEpisode[];
  seasons?: TVDBSeason[];
  genres?: TVDBGenre[];
  companies?: TVDBCompany[];
  originalNetwork?: TVDBNetwork;
  latestNetwork?: TVDBNetwork;
  lists?: TVDBList[];
  remoteIds?: TVDBRemoteId[];
  characters?: TVDBCharacter[];
  artworks?: TVDBArtwork[];
  translations?: TVDBTranslation[];
}

interface TVDBEpisode {
  id: number;
  seriesId: number;
  name?: string;
  aired?: string;
  runtime?: number;
  nameTranslations?: string[];
  overview?: string;
  overviewTranslations?: string[];
  image?: string;
  imageType?: number;
  isMovie?: boolean;
  seasons?: TVDBSeasonBaseRecord[];
  number: number;
  seasonNumber: number;
  absoluteNumber?: number;
  airsAfterSeason?: number;
  airsBeforeEpisode?: number;
  airsBeforeSeason?: number;
  finaleType?: string;
  lastUpdated: string;
  linkedMovie?: number;
  year?: string;
  awards?: TVDBAward[];
  characters?: TVDBCharacter[];
  companies?: TVDBCompany[];
  networks?: TVDBNetwork[];
  nominations?: TVDBNomination[];
  remoteIds?: TVDBRemoteId[];
  seasons_?: TVDBSeason[];
  tagOptions?: TVDBTagOption[];
  trailers?: TVDBTrailer[];
  translations?: TVDBTranslation[];
}

interface TVDBSeason {
  id: number;
  seriesId: number;
  type: TVDBSeasonType;
  number: number;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  image?: string;
  imageType?: number;
  companies?: TVDBCompany[];
  episodes?: TVDBEpisode[];
  lastUpdated: string;
  name?: string;
  overview?: string;
  year?: string;
  artwork?: TVDBArtwork[];
  tagOptions?: TVDBTagOption[];
  trailers?: TVDBTrailer[];
  translations?: TVDBTranslation[];
}

interface TVDBAlias {
  language: string;
  name: string;
}

interface TVDBSeriesStatus {
  id: number;
  name: string;
  recordType: string;
  keepUpdated: boolean;
}

interface TVDBGenre {
  id: number;
  name: string;
  slug: string;
}

interface TVDBCompany {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  country: string;
  primaryCompanyType: number;
  activeDate?: string;
  inactiveDate?: string;
  tags?: TVDBTag[];
  parentCompany?: TVDBCompany;
  tagOptions?: TVDBTagOption[];
}

interface TVDBNetwork {
  id: number;
  name: string;
  slug: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  country: string;
  abbreviation?: string;
}

interface TVDBList {
  id: number;
  name: string;
  overview?: string;
  url?: string;
  isOfficial: boolean;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  score: number;
  image?: string;
  imageIsFallback?: boolean;
  remoteIds?: TVDBRemoteId[];
  tags?: TVDBTag[];
}

interface TVDBRemoteId {
  id: string;
  type: number;
  sourceName: string;
}

interface TVDBCharacter {
  id: number;
  name: string;
  peopleId?: number;
  seriesId?: number;
  series?: TVDBSeries;
  movie?: number;
  movieId?: number;
  episodeId?: number;
  type?: number;
  image?: string;
  sort: number;
  isFeatured: boolean;
  url?: string;
  nameTranslations?: string[];
  overviewTranslations?: string[];
  aliases?: TVDBAlias[];
  peopleType: string;
  personName?: string;
  tagOptions?: TVDBTagOption[];
  personImgURL?: string;
}

interface TVDBArtwork {
  id: number;
  image: string;
  thumbnail: string;
  language?: string;
  type: number;
  score: number;
  width: number;
  height: number;
  includesText: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
  updatedAt: number;
  status: TVDBStatus;
  tagOptions?: TVDBTagOption[];
}

interface TVDBTranslation {
  aliases?: string[];
  isAlias?: boolean;
  isPrimary?: boolean;
  language: string;
  name?: string;
  overview?: string;
  tagline?: string;
}

interface TVDBSeasonBaseRecord {
  id: number;
  seriesId: number;
  type: TVDBSeasonType;
  number: number;
}

interface TVDBSeasonType {
  id: number;
  name: string;
  type: string;
}

interface TVDBAward {
  id: number;
  name: string;
  year?: string;
  category?: string;
  details?: string;
  nominee?: string;
}

interface TVDBNomination {
  id: number;
  name: string;
  year?: string;
  category?: string;
  details?: string;
  nominee?: string;
}

interface TVDBTagOption {
  id: number;
  tag: number;
  tagId: number;
  tagName: string;
  name: string;
  helpText?: string;
}

interface TVDBTrailer {
  id: number;
  name: string;
  url: string;
  language: string;
  runtime: number;
}

interface TVDBTag {
  id: number;
  name: string;
  helpText?: string;
  options?: TVDBTagOption[];
}

interface TVDBStatus {
  id: number;
  name: string;
}

interface TVDBSearchResponse {
  data: TVDBSeries[];
  status: string;
  links?: {
    prev?: string;
    self?: string;
    next?: string;
    total_items: number;
    page_size: number;
  };
}

// Transformed types for internal use
export interface SeriesMetadata {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  aliases: { language: string; name: string }[];
  firstAired: string;
  lastAired?: string;
  nextAired?: string;
  score: number;
  status: string;
  country: string;
  language: string;
  averageRuntime: number;
  lastUpdated: string;
  isOrderRandomized: boolean;
  genres: string[];
  networks: {
    original?: string;
    latest?: string;
  };
  companies: string[];
  externalIds: {
    tvdb: number;
    imdb?: string;
    tmdb?: string;
    zap2it?: string;
  };
  seasons: SeasonMetadata[];
  episodes: EpisodeMetadata[];
  characters: CharacterMetadata[];
  artworks: ArtworkMetadata[];
}

export interface EpisodeMetadata {
  id: number;
  seriesId: number;
  name?: string;
  description?: string;
  aired?: string;
  runtime?: number;
  image?: string;
  number: number;
  seasonNumber: number;
  absoluteNumber?: number;
  isMovie?: boolean;
  year?: string;
  lastUpdated: string;
  characters: CharacterMetadata[];
  companies: string[];
  networks: string[];
}

export interface SeasonMetadata {
  id: number;
  seriesId: number;
  type: string;
  number: number;
  name?: string;
  description?: string;
  image?: string;
  year?: string;
  lastUpdated: string;
  episodes: EpisodeMetadata[];
}

export interface CharacterMetadata {
  id: number;
  name: string;
  image?: string;
  sort: number;
  isFeatured: boolean;
  type?: string;
  personName?: string;
  personImage?: string;
}

export interface ArtworkMetadata {
  id: number;
  image: string;
  thumbnail: string;
  language?: string;
  type: string;
  score: number;
  width: number;
  height: number;
  includesText: boolean;
}

export interface TVDBSearchParams {
  query?: string;
  type?: 'series' | 'movie' | 'person' | 'company';
  year?: number;
  company?: string;
  country?: string;
  director?: string;
  language?: string;
  network?: string;
  primaryType?: string;
  status?: string;
  genre?: string;
  offset?: number;
  limit?: number;
}

class TVDBApiClient extends BaseApiClient {
  private static readonly BASE_URL = 'https://api4.thetvdb.com/v4';
  private static readonly AUTH_URL = 'https://api4.thetvdb.com/v4/login';

  private token: string | null = null;
  private tokenExpiry: number = 0;
  private apiKey: string;
  private pin?: string;

  constructor(apiKey: string, pin?: string) {
    const config = {
      ...DEFAULT_CONFIGS.SLOW_API,
      baseURL: TVDBApiClient.BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      // TheTVDB rate limits: 1000 requests per month for free tier
      rateLimitConfig: {
        requestsPerSecond: 1,
        requestsPerMinute: 20,
        requestsPerHour: 100
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 7200, // 2 hours - TV data changes less frequently
        maxSize: 3000
      }
    };

    super(config);
    this.apiKey = apiKey;
    this.pin = pin;
  }

  /**
   * Authenticate with TheTVDB API
   */
  private async authenticate(): Promise<void> {
    // Check if token is still valid (expires after 1 month)
    if (this.token && Date.now() < this.tokenExpiry) {
      return;
    }

    const authData: any = {
      apikey: this.apiKey
    };

    if (this.pin) {
      authData.pin = this.pin;
    }

    try {
      const response = await this.makeRequest<TVDBAuthResponse>(
        {
          method: 'POST',
          url: '/login',
          data: authData
        }
      );

      this.token = response.data.token;
      // Token expires after 1 month, refresh 1 day before
      this.tokenExpiry = Date.now() + (29 * 24 * 60 * 60 * 1000);

      // Update axios instance to use the token
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    } catch (error) {
      console.error('TheTVDB authentication failed:', error);
      throw new Error('Failed to authenticate with TheTVDB API');
    }
  }

  /**
   * Ensure authenticated before making requests
   */
  protected async makeRequest<T>(config: any, cacheKey?: string, cacheTTL?: number): Promise<T> {
    await this.authenticate();
    return super.makeRequest<T>(config, cacheKey, cacheTTL);
  }

  /**
   * Search for series
   */
  async searchSeries(params: TVDBSearchParams): Promise<SeriesMetadata[]> {
    const cacheKey = this.generateCacheKey('GET', '/search', params);

    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.type) queryParams.append('type', params.type);
    if (params.year) queryParams.append('year', params.year.toString());
    if (params.company) queryParams.append('company', params.company);
    if (params.country) queryParams.append('country', params.country);
    if (params.director) queryParams.append('director', params.director);
    if (params.language) queryParams.append('language', params.language);
    if (params.network) queryParams.append('network', params.network);
    if (params.primaryType) queryParams.append('primaryType', params.primaryType);
    if (params.status) queryParams.append('status', params.status);
    if (params.genre) queryParams.append('genre', params.genre);
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await this.makeRequest<TVDBSearchResponse>(
      {
        method: 'GET',
        url: `/search?${queryParams.toString()}`
      },
      cacheKey,
      3600 // Cache for 1 hour
    );

    return response.data.map(series => this.transformSeries(series));
  }

  /**
   * Get series details by ID
   */
  async getSeriesById(seriesId: number, extended = true): Promise<SeriesMetadata | null> {
    const cacheKey = this.generateCacheKey('GET', `/series/${seriesId}`, { extended });

    try {
      const extendedParams = extended ? '?extended' : '';
      const response = await this.makeRequest<{ data: TVDBSeries; status: string }>(
        {
          method: 'GET',
          url: `/series/${seriesId}${extendedParams}`
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return this.transformSeries(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get series episodes
   */
  async getSeriesEpisodes(
    seriesId: number,
    season?: number,
    page = 0
  ): Promise<{ episodes: EpisodeMetadata[]; links?: any }> {
    const cacheKey = this.generateCacheKey('GET', `/series/${seriesId}/episodes`, { season, page });

    const queryParams = new URLSearchParams();
    if (season !== undefined) queryParams.append('season', season.toString());
    if (page > 0) queryParams.append('page', page.toString());

    const response = await this.makeRequest<{
      data: TVDBEpisode[];
      status: string;
      links?: any;
    }>(
      {
        method: 'GET',
        url: `/series/${seriesId}/episodes${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      },
      cacheKey,
      7200 // Cache for 2 hours
    );

    return {
      episodes: response.data.map(episode => this.transformEpisode(episode)),
      links: response.links
    };
  }

  /**
   * Get episode details by ID
   */
  async getEpisodeById(episodeId: number): Promise<EpisodeMetadata | null> {
    const cacheKey = this.generateCacheKey('GET', `/episodes/${episodeId}`);

    try {
      const response = await this.makeRequest<{ data: TVDBEpisode; status: string }>(
        {
          method: 'GET',
          url: `/episodes/${episodeId}`
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return this.transformEpisode(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get series seasons
   */
  async getSeriesSeasons(seriesId: number): Promise<SeasonMetadata[]> {
    const cacheKey = this.generateCacheKey('GET', `/series/${seriesId}/seasons`);

    try {
      const response = await this.makeRequest<{ data: TVDBSeason[]; status: string }>(
        {
          method: 'GET',
          url: `/series/${seriesId}/seasons`
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return response.data.map(season => this.transformSeason(season));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Search for True Crime series
   */
  async searchTrueCrimeSeries(query?: string, page = 0): Promise<SeriesMetadata[]> {
    const searchQuery = query || 'true crime';

    const results = await this.searchSeries({
      query: searchQuery,
      type: 'series',
      genre: 'Crime',
      offset: page * 25,
      limit: 25
    });

    // Filter for True Crime content
    return results.filter(series =>
      this.isTrueCrimeContent(series.genres, series.name, series.description)
    );
  }

  /**
   * Get complete series data with all episodes
   */
  async getCompleteSeriesData(seriesId: number): Promise<SeriesMetadata | null> {
    const series = await this.getSeriesById(seriesId, true);
    if (!series) return null;

    // Get all episodes for the series
    let allEpisodes: EpisodeMetadata[] = [];
    let page = 0;
    let hasMorePages = true;

    while (hasMorePages) {
      const episodeData = await this.getSeriesEpisodes(seriesId, undefined, page);
      allEpisodes = [...allEpisodes, ...episodeData.episodes];

      hasMorePages = episodeData.links?.next !== undefined;
      page++;

      // Safety break to prevent infinite loops
      if (page > 100) break;
    }

    // Get seasons data
    const seasons = await this.getSeriesSeasons(seriesId);

    return {
      ...series,
      episodes: allEpisodes,
      seasons
    };
  }

  /**
   * Health check for TheTVDB API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Transform TheTVDB series to internal format
   */
  private transformSeries(series: TVDBSeries): SeriesMetadata {
    // Extract external IDs
    const externalIds: any = { tvdb: series.id };
    if (series.remoteIds) {
      series.remoteIds.forEach(remoteId => {
        switch (remoteId.sourceName.toLowerCase()) {
          case 'imdb':
            externalIds.imdb = remoteId.id;
            break;
          case 'themoviedb.org':
            externalIds.tmdb = remoteId.id;
            break;
          case 'zap2it':
            externalIds.zap2it = remoteId.id;
            break;
        }
      });
    }

    return {
      id: series.id,
      name: series.name,
      slug: series.slug,
      description: series.overviewTranslations?.[0],
      image: series.image,
      aliases: series.aliases || [],
      firstAired: series.firstAired,
      lastAired: series.lastAired,
      nextAired: series.nextAired,
      score: series.score,
      status: series.status?.name || 'Unknown',
      country: series.originalCountry,
      language: series.originalLanguage,
      averageRuntime: series.averageRuntime,
      lastUpdated: series.lastUpdated,
      isOrderRandomized: series.isOrderRandomized,
      genres: series.genres?.map(genre => genre.name) || [],
      networks: {
        original: series.originalNetwork?.name,
        latest: series.latestNetwork?.name
      },
      companies: series.companies?.map(company => company.name) || [],
      externalIds,
      seasons: series.seasons?.map(season => this.transformSeason(season)) || [],
      episodes: series.episodes?.map(episode => this.transformEpisode(episode)) || [],
      characters: series.characters?.map(character => this.transformCharacter(character)) || [],
      artworks: series.artworks?.map(artwork => this.transformArtwork(artwork)) || []
    };
  }

  /**
   * Transform TheTVDB episode to internal format
   */
  private transformEpisode(episode: TVDBEpisode): EpisodeMetadata {
    return {
      id: episode.id,
      seriesId: episode.seriesId,
      name: episode.name,
      description: episode.overview,
      aired: episode.aired,
      runtime: episode.runtime,
      image: episode.image,
      number: episode.number,
      seasonNumber: episode.seasonNumber,
      absoluteNumber: episode.absoluteNumber,
      isMovie: episode.isMovie || false,
      year: episode.year,
      lastUpdated: episode.lastUpdated,
      characters: episode.characters?.map(character => this.transformCharacter(character)) || [],
      companies: episode.companies?.map(company => company.name) || [],
      networks: episode.networks?.map(network => network.name) || []
    };
  }

  /**
   * Transform TheTVDB season to internal format
   */
  private transformSeason(season: TVDBSeason): SeasonMetadata {
    return {
      id: season.id,
      seriesId: season.seriesId,
      type: season.type?.name || 'Official',
      number: season.number,
      name: season.name,
      description: season.overview,
      image: season.image,
      year: season.year,
      lastUpdated: season.lastUpdated,
      episodes: season.episodes?.map(episode => this.transformEpisode(episode)) || []
    };
  }

  /**
   * Transform TheTVDB character to internal format
   */
  private transformCharacter(character: TVDBCharacter): CharacterMetadata {
    return {
      id: character.id,
      name: character.name,
      image: character.image,
      sort: character.sort,
      isFeatured: character.isFeatured,
      type: character.peopleType,
      personName: character.personName,
      personImage: character.personImgURL
    };
  }

  /**
   * Transform TheTVDB artwork to internal format
   */
  private transformArtwork(artwork: TVDBArtwork): ArtworkMetadata {
    const typeMap: { [key: number]: string } = {
      1: 'banner',
      2: 'poster',
      3: 'fanart',
      4: 'season',
      5: 'seasonwide',
      6: 'series',
      7: 'clearlogo',
      8: 'clearart',
      14: 'screenshot'
    };

    return {
      id: artwork.id,
      image: artwork.image,
      thumbnail: artwork.thumbnail,
      language: artwork.language,
      type: typeMap[artwork.type] || 'unknown',
      score: artwork.score,
      width: artwork.width,
      height: artwork.height,
      includesText: artwork.includesText
    };
  }

  /**
   * Check if content is True Crime related
   */
  private isTrueCrimeContent(genres: string[], title: string, description?: string): boolean {
    const trueCrimeGenres = ['Crime', 'Documentary', 'Mystery', 'Drama'];
    const trueCrimeKeywords = [
      'true crime', 'serial killer', 'murder', 'investigation', 'detective',
      'criminal', 'forensic', 'police', 'cold case', 'unsolved'
    ];

    const genreMatch = genres.some(genre => trueCrimeGenres.includes(genre));

    const textToCheck = `${title} ${description || ''}`.toLowerCase();
    const keywordMatch = trueCrimeKeywords.some(keyword => textToCheck.includes(keyword));

    return genreMatch || keywordMatch;
  }
}

export { TVDBApiClient };