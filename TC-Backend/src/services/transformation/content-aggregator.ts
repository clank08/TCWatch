/**
 * Content Aggregation and Transformation Service
 *
 * This service aggregates data from multiple external APIs and transforms them into
 * a unified content structure for the TCWatch database. It handles deduplication,
 * data enrichment, and maintains data consistency across sources.
 */

import { WatchmodeApiClient, ContentAvailability } from '../external/watchmode-client.js';
import { TMDbApiClient, MovieMetadata, TVShowMetadata } from '../external/tmdb-client.js';
import { TVDBApiClient, SeriesMetadata } from '../external/tvdb-client.js';
import { TVMazeApiClient, TVScheduleInfo } from '../external/tvmaze-client.js';
import { WikidataApiClient, CriminalCase, PersonInfo } from '../external/wikidata-client.js';

// Unified content types for database storage
export interface AggregatedContent {
  // Core metadata
  title: string;
  originalTitle: string;
  description: string;
  contentType: 'movie' | 'tv_series' | 'documentary' | 'podcast';

  // Release information
  releaseDate?: string;
  endDate?: string;
  runtimeMinutes?: number;
  totalSeasons?: number;
  totalEpisodes?: number;
  status?: string;

  // Media and imagery
  posterUrl?: string;
  backdropUrl?: string;
  trailerUrl?: string;

  // Classification and discovery
  genreTags: string[];
  caseTags: string[];
  keywords: string[];

  // External identifiers
  externalIds: {
    watchmode?: number;
    tmdb?: number;
    tvdb?: number;
    tvmaze?: number;
    imdb?: string;
  };

  // Platform availability
  platforms: PlatformAvailability[];

  // Cast and crew (limited to key people)
  cast: PersonCredit[];
  crew: PersonCredit[];

  // Ratings and popularity
  ratings: {
    tmdb?: number;
    tvdb?: number;
    tvmaze?: number;
    user?: number;
  };
  popularity?: number;

  // True Crime specific
  relatedCases: RelatedCase[];
  factualBasis?: {
    isBasedOnTrueEvents: boolean;
    historicalAccuracy?: 'high' | 'medium' | 'low' | 'dramatized';
    timelineAccuracy?: 'accurate' | 'compressed' | 'altered';
  };

  // Metadata
  lastSyncedAt: string;
  sourceConfidence: number; // 0-1 score indicating data quality/confidence
  dataCompleteness: number; // 0-1 score indicating how complete the data is
}

export interface PlatformAvailability {
  platformId: number;
  platformName: string;
  type: 'subscription' | 'free' | 'purchase' | 'rent';
  region: string;
  availableUntil?: string;
  price?: number;
  currency?: string;
  quality: 'SD' | 'HD' | 'UHD';
  urls: {
    web?: string;
    ios?: string;
    android?: string;
  };
  seasons?: number[];
  episodes?: number[];
}

export interface PersonCredit {
  id?: number;
  name: string;
  role: string; // character name for cast, job title for crew
  department?: string; // for crew: 'Directing', 'Writing', 'Producing', etc.
  profileImage?: string;
  isMainCast?: boolean;
  wikidataId?: string; // for real people involved in True Crime cases
}

export interface RelatedCase {
  caseId?: string; // Internal case ID
  wikidataId?: string;
  caseName: string;
  relationship: 'directly_based_on' | 'inspired_by' | 'covers_case' | 'features_person' | 'same_perpetrator' | 'same_location';
  confidence: number; // 0-1 score
}

export interface ContentMatchingParams {
  title: string;
  year?: number;
  type?: 'movie' | 'tv';
  imdbId?: string;
  tmdbId?: number;
}

export interface AggregationResult {
  content: AggregatedContent;
  sources: {
    watchmode?: ContentAvailability;
    tmdb?: MovieMetadata | TVShowMetadata;
    tvdb?: SeriesMetadata;
    tvmaze?: TVScheduleInfo;
  };
  warnings: string[];
  errors: string[];
}

class ContentAggregatorService {
  constructor(
    private watchmodeClient: WatchmodeApiClient,
    private tmdbClient: TMDbApiClient,
    private tvdbClient: TVDBApiClient,
    private tvmazeClient: TVMazeApiClient,
    private wikidataClient: WikidataApiClient
  ) {}

  /**
   * Aggregate content from all sources using various identifiers
   */
  async aggregateContent(params: ContentMatchingParams): Promise<AggregationResult> {
    const result: AggregationResult = {
      content: this.createEmptyContent(),
      sources: {},
      warnings: [],
      errors: []
    };

    try {
      // Fetch from all sources in parallel where possible
      const [watchmodeData, tmdbData] = await Promise.allSettled([
        this.fetchFromWatchmode(params),
        this.fetchFromTMDb(params)
      ]);

      // Handle Watchmode data
      if (watchmodeData.status === 'fulfilled' && watchmodeData.value) {
        result.sources.watchmode = watchmodeData.value;
      } else if (watchmodeData.status === 'rejected') {
        result.errors.push(`Watchmode fetch failed: ${watchmodeData.reason}`);
      }

      // Handle TMDb data
      if (tmdbData.status === 'fulfilled' && tmdbData.value) {
        result.sources.tmdb = tmdbData.value;
      } else if (tmdbData.status === 'rejected') {
        result.errors.push(`TMDb fetch failed: ${tmdbData.reason}`);
      }

      // Fetch additional sources based on available data
      if (result.sources.tmdb && 'numberOfSeasons' in result.sources.tmdb) {
        // It's a TV show, try to get more detailed episode info
        const [tvdbData, tvmazeData] = await Promise.allSettled([
          this.fetchFromTVDB(result.sources.tmdb.externalIds.tmdb),
          this.fetchFromTVMaze(result.sources.tmdb.externalIds.tmdb, 'tmdb')
        ]);

        if (tvdbData.status === 'fulfilled' && tvdbData.value) {
          result.sources.tvdb = tvdbData.value;
        }

        if (tvmazeData.status === 'fulfilled' && tvmazeData.value) {
          result.sources.tvmaze = tvmazeData.value;
        }
      }

      // Aggregate the content
      result.content = await this.mergeContentData(result.sources, result.warnings);

      // Enhance with True Crime specific data
      if (this.isTrueCrimeContent(result.content)) {
        await this.enhanceWithCriminalCaseData(result.content, result.warnings);
      }

      // Calculate confidence and completeness scores
      result.content.sourceConfidence = this.calculateSourceConfidence(result.sources);
      result.content.dataCompleteness = this.calculateDataCompleteness(result.content);

    } catch (error) {
      result.errors.push(`Aggregation failed: ${error}`);
    }

    return result;
  }

  /**
   * Search and aggregate True Crime content specifically
   */
  async searchTrueCrimeContent(query: string, limit = 20): Promise<AggregationResult[]> {
    const results: AggregationResult[] = [];

    try {
      // Search across all platforms
      const [watchmodeResults, tmdbMovieResults, tmdbTVResults] = await Promise.allSettled([
        this.watchmodeClient.searchTrueCrimeContent(query),
        this.tmdbClient.searchMovies({ query }),
        this.tmdbClient.searchTVShows({ query })
      ]);

      // Process Watchmode results
      if (watchmodeResults.status === 'fulfilled') {
        for (const item of watchmodeResults.value.slice(0, limit)) {
          const aggregated = await this.aggregateContent({
            title: item.title,
            year: item.releaseYear,
            type: item.type === 'movie' ? 'movie' : 'tv',
            imdbId: item.externalIds.imdb,
            tmdbId: item.externalIds.tmdb
          });
          results.push(aggregated);
        }
      }

      // Process TMDb results (movies)
      if (tmdbMovieResults.status === 'fulfilled') {
        for (const movie of tmdbMovieResults.value.slice(0, Math.floor(limit / 2))) {
          if (this.isTrueCrimeContent({ title: movie.title, genres: movie.genres, keywords: movie.keywords })) {
            const aggregated = await this.aggregateContent({
              title: movie.title,
              year: new Date(movie.releaseDate).getFullYear(),
              type: 'movie',
              tmdbId: movie.id,
              imdbId: movie.externalIds.imdb
            });
            results.push(aggregated);
          }
        }
      }

      // Process TMDb results (TV shows)
      if (tmdbTVResults.status === 'fulfilled') {
        for (const show of tmdbTVResults.value.slice(0, Math.floor(limit / 2))) {
          if (this.isTrueCrimeContent({ title: show.title, genres: show.genres, keywords: show.keywords })) {
            const aggregated = await this.aggregateContent({
              title: show.title,
              year: new Date(show.firstAirDate).getFullYear(),
              type: 'tv',
              tmdbId: show.id
            });
            results.push(aggregated);
          }
        }
      }

    } catch (error) {
      console.error('True Crime search failed:', error);
    }

    // Remove duplicates and sort by confidence
    return this.deduplicateResults(results)
      .sort((a, b) => b.content.sourceConfidence - a.content.sourceConfidence)
      .slice(0, limit);
  }

  /**
   * Fetch content from Watchmode
   */
  private async fetchFromWatchmode(params: ContentMatchingParams): Promise<ContentAvailability | null> {
    if (params.imdbId) {
      return this.watchmodeClient.getContentByExternalId(params.imdbId, 'imdb_id');
    }

    if (params.tmdbId) {
      return this.watchmodeClient.getContentByExternalId(params.tmdbId.toString(), 'tmdb_id');
    }

    // Search by title as fallback
    const results = await this.watchmodeClient.searchContent({
      search_field: 'name',
      search_value: params.title,
      ...(params.year && { year_min: params.year - 1, year_max: params.year + 1 }),
      ...(params.type && { types: [params.type === 'movie' ? 'movie' : 'tv_series'] })
    });

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Fetch content from TMDb
   */
  private async fetchFromTMDb(params: ContentMatchingParams): Promise<MovieMetadata | TVShowMetadata | null> {
    if (params.tmdbId) {
      if (params.type === 'movie') {
        return this.tmdbClient.getMovieDetails(params.tmdbId);
      } else {
        return this.tmdbClient.getTVShowDetails(params.tmdbId);
      }
    }

    // Search by title
    const searchParams = {
      query: params.title,
      ...(params.year && { year: params.year, primary_release_year: params.year, first_air_date_year: params.year })
    };

    if (params.type === 'movie') {
      const results = await this.tmdbClient.searchMovies(searchParams);
      return results.length > 0 ? results[0] : null;
    } else {
      const results = await this.tmdbClient.searchTVShows(searchParams);
      return results.length > 0 ? results[0] : null;
    }
  }

  /**
   * Fetch content from TheTVDB
   */
  private async fetchFromTVDB(tmdbId?: number): Promise<SeriesMetadata | null> {
    if (!tmdbId) return null;

    try {
      // Search by TMDb ID in TheTVDB
      const results = await this.tvdbClient.searchSeries({
        query: tmdbId.toString(),
        type: 'series'
      });

      return results.length > 0 ? results[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Fetch content from TVMaze
   */
  private async fetchFromTVMaze(
    externalId: number | string,
    idType: 'tmdb' | 'imdb' | 'thetvdb'
  ): Promise<TVScheduleInfo | null> {
    try {
      if (idType === 'imdb') {
        return this.tvmazeClient.getShowByExternalId(externalId.toString(), 'imdb');
      } else if (idType === 'thetvdb') {
        return this.tvmazeClient.getShowByExternalId(externalId.toString(), 'thetvdb');
      }
    } catch {
      // TVMaze doesn't support TMDb ID lookup, so we can't fetch directly
    }

    return null;
  }

  /**
   * Merge data from all sources into unified content structure
   */
  private async mergeContentData(
    sources: AggregationResult['sources'],
    warnings: string[]
  ): Promise<AggregatedContent> {
    const content = this.createEmptyContent();

    // Primary source priority: TMDb > Watchmode > TVDB > TVMaze
    const primarySource = sources.tmdb || sources.watchmode;

    if (!primarySource) {
      warnings.push('No primary source available for content');
      return content;
    }

    // Basic information (prefer TMDb)
    if (sources.tmdb) {
      this.applyTMDbData(content, sources.tmdb);
    } else if (sources.watchmode) {
      this.applyWatchmodeData(content, sources.watchmode);
    }

    // Platform availability (Watchmode is authoritative)
    if (sources.watchmode) {
      content.platforms = this.transformPlatforms(sources.watchmode.platforms);
    }

    // Episode information (prefer TVDB for TV series)
    if (sources.tvdb && content.contentType === 'tv_series') {
      this.applyTVDBData(content, sources.tvdb);
    }

    // Schedule information (TVMaze)
    if (sources.tvmaze && content.contentType === 'tv_series') {
      this.applyTVMazeData(content, sources.tvmaze);
    }

    // Validate and clean data
    this.validateContent(content, warnings);

    content.lastSyncedAt = new Date().toISOString();

    return content;
  }

  /**
   * Apply TMDb data to content
   */
  private applyTMDbData(content: AggregatedContent, tmdb: MovieMetadata | TVShowMetadata): void {
    content.title = tmdb.title;
    content.originalTitle = tmdb.originalTitle;
    content.description = tmdb.description;
    content.releaseDate = 'releaseDate' in tmdb ? tmdb.releaseDate : tmdb.firstAirDate;
    content.posterUrl = tmdb.images.poster;
    content.backdropUrl = tmdb.images.backdrop;
    content.genreTags = tmdb.genres;
    content.keywords = tmdb.keywords;
    content.ratings.tmdb = tmdb.ratings.tmdb;
    content.popularity = tmdb.popularity;

    // Set content type
    if ('numberOfSeasons' in tmdb) {
      content.contentType = 'tv_series';
      content.totalSeasons = tmdb.numberOfSeasons;
      content.totalEpisodes = tmdb.numberOfEpisodes;
      content.endDate = tmdb.lastAirDate;
      content.status = tmdb.status;
      content.runtimeMinutes = tmdb.episodeRunTime.length > 0 ? tmdb.episodeRunTime[0] : undefined;
    } else {
      content.contentType = tmdb.genres.includes('Documentary') ? 'documentary' : 'movie';
      content.runtimeMinutes = tmdb.runtimeMinutes;
    }

    // External IDs
    content.externalIds.tmdb = tmdb.id;
    if ('externalIds' in tmdb && tmdb.externalIds.imdb) {
      content.externalIds.imdb = tmdb.externalIds.imdb;
    }

    // Cast and crew (top 10 each)
    content.cast = tmdb.cast.slice(0, 10).map(member => ({
      id: member.id,
      name: member.name,
      role: member.character,
      profileImage: member.profileImage,
      isMainCast: member.order < 5
    }));

    content.crew = tmdb.crew.slice(0, 10).map(member => ({
      id: member.id,
      name: member.name,
      role: member.job,
      department: member.department,
      profileImage: member.profileImage
    }));

    // Trailer
    const trailer = tmdb.videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    if (trailer) {
      content.trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    }
  }

  /**
   * Apply Watchmode data to content
   */
  private applyWatchmodeData(content: AggregatedContent, watchmode: ContentAvailability): void {
    if (!content.title) content.title = watchmode.title;
    if (!content.originalTitle) content.originalTitle = watchmode.originalTitle;
    if (!content.description) content.description = watchmode.description;
    if (!content.releaseDate) content.releaseDate = watchmode.releaseDate;

    // Map content type
    switch (watchmode.type) {
      case 'movie':
        content.contentType = 'movie';
        break;
      case 'tv_series':
      case 'tv_miniseries':
      case 'tv_special':
        content.contentType = 'tv_series';
        break;
      default:
        content.contentType = 'movie';
    }

    if (!content.runtimeMinutes) content.runtimeMinutes = watchmode.runtimeMinutes;
    if (!content.posterUrl) content.posterUrl = watchmode.images.poster;
    if (!content.backdropUrl) content.backdropUrl = watchmode.images.backdrop;

    // Merge genres and ratings
    content.genreTags = [...new Set([...content.genreTags, ...watchmode.genres])];
    content.ratings.user = watchmode.ratings.user;

    // External IDs
    content.externalIds.watchmode = watchmode.id;
    if (!content.externalIds.tmdb) content.externalIds.tmdb = watchmode.externalIds.tmdb;
    if (!content.externalIds.imdb) content.externalIds.imdb = watchmode.externalIds.imdb;

    // Trailer
    if (!content.trailerUrl && watchmode.trailer) {
      content.trailerUrl = watchmode.trailer.url;
    }
  }

  /**
   * Apply TVDB data to content
   */
  private applyTVDBData(content: AggregatedContent, tvdb: SeriesMetadata): void {
    if (!content.totalSeasons && tvdb.seasons.length > 0) {
      content.totalSeasons = Math.max(...tvdb.seasons.map(s => s.number));
    }

    if (!content.totalEpisodes) {
      content.totalEpisodes = tvdb.episodes.length;
    }

    if (!content.status) content.status = tvdb.status;
    if (!content.endDate) content.endDate = tvdb.lastAired;

    // External IDs
    content.externalIds.tvdb = tvdb.id;
    if (!content.externalIds.imdb && tvdb.externalIds.imdb) {
      content.externalIds.imdb = tvdb.externalIds.imdb;
    }

    // Merge genres
    content.genreTags = [...new Set([...content.genreTags, ...tvdb.genres])];
  }

  /**
   * Apply TVMaze data to content
   */
  private applyTVMazeData(content: AggregatedContent, tvmaze: TVScheduleInfo): void {
    if (!content.status) content.status = tvmaze.status;
    if (!content.endDate) content.endDate = tvmaze.ended;
    if (!content.runtimeMinutes) content.runtimeMinutes = tvmaze.averageRuntime;

    // External IDs
    content.externalIds.tvmaze = tvmaze.id;
    if (!content.externalIds.imdb && tvmaze.externalIds.imdb) {
      content.externalIds.imdb = tvmaze.externalIds.imdb;
    }
    if (!content.externalIds.tvdb && tvmaze.externalIds.thetvdb) {
      content.externalIds.tvdb = tvmaze.externalIds.thetvdb;
    }

    // Merge genres and ratings
    content.genreTags = [...new Set([...content.genreTags, ...tvmaze.genres])];
    if (tvmaze.rating) content.ratings.tvmaze = tvmaze.rating;
  }

  /**
   * Transform platform data to unified format
   */
  private transformPlatforms(platforms: any[]): PlatformAvailability[] {
    return platforms.map(platform => ({
      platformId: platform.id,
      platformName: platform.name,
      type: platform.type as PlatformAvailability['type'],
      region: platform.region,
      price: platform.price,
      quality: platform.quality as PlatformAvailability['quality'],
      urls: platform.urls,
      seasons: platform.availableSeasons,
      episodes: platform.availableEpisodes
    }));
  }

  /**
   * Enhance content with criminal case data from Wikidata
   */
  private async enhanceWithCriminalCaseData(content: AggregatedContent, warnings: string[]): Promise<void> {
    try {
      // Search for related criminal cases
      const cases = await this.wikidataClient.searchCriminalCases(content.title);

      if (cases.length > 0) {
        content.relatedCases = cases.slice(0, 3).map(caseData => ({
          wikidataId: caseData.wikidataId,
          caseName: caseData.name,
          relationship: this.determineCaseRelationship(content.title, caseData.name),
          confidence: this.calculateCaseRelationshipConfidence(content, caseData)
        }));

        // Add case tags
        content.caseTags = cases.slice(0, 5).map(c => c.name);

        // Determine factual basis
        content.factualBasis = {
          isBasedOnTrueEvents: true,
          historicalAccuracy: this.assessHistoricalAccuracy(content),
          timelineAccuracy: this.assessTimelineAccuracy(content)
        };
      }

      // Search for real people involved
      const people = await this.wikidataClient.searchCriminalPersons(content.title);
      if (people.length > 0) {
        // Update cast/crew with Wikidata IDs for real people
        this.linkRealPeople(content, people);
      }

    } catch (error) {
      warnings.push(`Failed to enhance with criminal case data: ${error}`);
    }
  }

  /**
   * Check if content is True Crime related
   */
  private isTrueCrimeContent(contentLike: { title?: string; genres?: string[]; keywords?: string[] }): boolean {
    const trueCrimeGenres = ['Crime', 'Documentary', 'Mystery', 'Thriller', 'Biography'];
    const trueCrimeKeywords = [
      'true crime', 'serial killer', 'murder', 'investigation', 'detective',
      'criminal', 'forensic', 'police', 'cold case', 'unsolved'
    ];

    // Check genres
    const genreMatch = contentLike.genres?.some(genre => trueCrimeGenres.includes(genre)) || false;

    // Check keywords
    const keywordMatch = contentLike.keywords?.some(keyword =>
      trueCrimeKeywords.some(tcKeyword => keyword.toLowerCase().includes(tcKeyword))
    ) || false;

    // Check title
    const titleMatch = trueCrimeKeywords.some(keyword =>
      contentLike.title?.toLowerCase().includes(keyword)
    );

    return genreMatch || keywordMatch || titleMatch;
  }

  /**
   * Calculate source confidence score
   */
  private calculateSourceConfidence(sources: AggregationResult['sources']): number {
    let score = 0;
    let maxScore = 0;

    // TMDb is most reliable for metadata
    if (sources.tmdb) {
      score += 0.4;
    }
    maxScore += 0.4;

    // Watchmode is authoritative for platform availability
    if (sources.watchmode) {
      score += 0.3;
    }
    maxScore += 0.3;

    // TVDB provides detailed episode information
    if (sources.tvdb) {
      score += 0.2;
    }
    maxScore += 0.2;

    // TVMaze provides scheduling information
    if (sources.tvmaze) {
      score += 0.1;
    }
    maxScore += 0.1;

    return maxScore > 0 ? score / maxScore : 0;
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(content: AggregatedContent): number {
    let score = 0;
    let maxScore = 12;

    if (content.title) score++;
    if (content.description) score++;
    if (content.releaseDate) score++;
    if (content.posterUrl) score++;
    if (content.genreTags.length > 0) score++;
    if (content.platforms.length > 0) score++;
    if (content.cast.length > 0) score++;
    if (content.ratings.tmdb || content.ratings.user) score++;
    if (content.externalIds.tmdb || content.externalIds.imdb) score++;
    if (content.contentType === 'tv_series' && content.totalSeasons) score++;
    if (content.runtimeMinutes) score++;
    if (content.keywords.length > 0) score++;

    return score / maxScore;
  }

  /**
   * Remove duplicate results based on external IDs and titles
   */
  private deduplicateResults(results: AggregationResult[]): AggregationResult[] {
    const seen = new Set<string>();
    const deduplicated: AggregationResult[] = [];

    for (const result of results) {
      const content = result.content;
      const key = content.externalIds.tmdb?.toString() ||
                  content.externalIds.imdb ||
                  content.externalIds.watchmode?.toString() ||
                  content.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      }
    }

    return deduplicated;
  }

  /**
   * Create empty content structure
   */
  private createEmptyContent(): AggregatedContent {
    return {
      title: '',
      originalTitle: '',
      description: '',
      contentType: 'movie',
      genreTags: [],
      caseTags: [],
      keywords: [],
      externalIds: {},
      platforms: [],
      cast: [],
      crew: [],
      ratings: {},
      relatedCases: [],
      lastSyncedAt: '',
      sourceConfidence: 0,
      dataCompleteness: 0
    };
  }

  /**
   * Validate content data and add warnings for issues
   */
  private validateContent(content: AggregatedContent, warnings: string[]): void {
    if (!content.title) {
      warnings.push('Content missing title');
    }

    if (!content.description) {
      warnings.push('Content missing description');
    }

    if (!content.releaseDate) {
      warnings.push('Content missing release date');
    }

    if (content.genreTags.length === 0) {
      warnings.push('Content missing genre information');
    }

    if (content.platforms.length === 0) {
      warnings.push('Content missing platform availability');
    }
  }

  // Helper methods for True Crime enhancement
  private determineCaseRelationship(contentTitle: string, caseName: string): RelatedCase['relationship'] {
    const titleLower = contentTitle.toLowerCase();
    const caseLower = caseName.toLowerCase();

    if (titleLower.includes(caseLower) || caseLower.includes(titleLower.split(':')[0])) {
      return 'directly_based_on';
    }

    return 'inspired_by';
  }

  private calculateCaseRelationshipConfidence(content: AggregatedContent, caseData: any): number {
    let confidence = 0;

    // Title similarity
    if (content.title.toLowerCase().includes(caseData.name.toLowerCase())) {
      confidence += 0.5;
    }

    // Description mentions
    if (content.description.toLowerCase().includes(caseData.name.toLowerCase())) {
      confidence += 0.3;
    }

    // Time period alignment
    if (content.releaseDate && caseData.dateRange?.start) {
      const contentYear = new Date(content.releaseDate).getFullYear();
      const caseYear = new Date(caseData.dateRange.start).getFullYear();
      if (Math.abs(contentYear - caseYear) < 50) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 1);
  }

  private assessHistoricalAccuracy(content: AggregatedContent): 'high' | 'medium' | 'low' | 'dramatized' {
    // This would need more sophisticated analysis
    if (content.genreTags.includes('Documentary')) return 'high';
    if (content.genreTags.includes('Biography')) return 'medium';
    return 'dramatized';
  }

  private assessTimelineAccuracy(content: AggregatedContent): 'accurate' | 'compressed' | 'altered' {
    // This would need more sophisticated analysis
    if (content.genreTags.includes('Documentary')) return 'accurate';
    return 'compressed';
  }

  private linkRealPeople(content: AggregatedContent, people: PersonInfo[]): void {
    // Match cast/crew names with real people and add Wikidata IDs
    for (const person of people) {
      // Check cast
      const castMatch = content.cast.find(c =>
        this.namesMatch(c.name, person.name) || person.aliases.some(alias => this.namesMatch(c.name, alias))
      );
      if (castMatch) {
        castMatch.wikidataId = person.wikidataId;
      }

      // Check crew
      const crewMatch = content.crew.find(c =>
        this.namesMatch(c.name, person.name) || person.aliases.some(alias => this.namesMatch(c.name, alias))
      );
      if (crewMatch) {
        crewMatch.wikidataId = person.wikidataId;
      }
    }
  }

  private namesMatch(name1: string, name2: string): boolean {
    const clean1 = name1.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const clean2 = name2.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    return clean1 === clean2 || clean1.includes(clean2) || clean2.includes(clean1);
  }
}

export { ContentAggregatorService };