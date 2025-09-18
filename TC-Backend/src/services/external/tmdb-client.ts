/**
 * TMDb (The Movie Database) API Client
 *
 * Comprehensive client for fetching movie and TV metadata from TMDb.
 * Includes intelligent caching strategies and specialized True Crime content discovery.
 */

import { BaseApiClient, DEFAULT_CONFIGS } from '../base/api-client.js';

// TMDb API Response Types
interface TMDbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  poster_path?: string;
  backdrop_path?: string;
  imdb_id?: string;
  genre_ids: number[];
  genres?: TMDbGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  spoken_languages?: TMDbLanguage[];
  production_companies?: TMDbCompany[];
  production_countries?: TMDbCountry[];
  status: string;
  tagline?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  videos?: TMDbVideosResponse;
  credits?: TMDbCreditsResponse;
  keywords?: TMDbKeywordsResponse;
  similar?: TMDbSearchResponse<TMDbMovie>;
  recommendations?: TMDbSearchResponse<TMDbMovie>;
}

interface TMDbTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  first_air_date: string;
  last_air_date?: string;
  episode_run_time: number[];
  number_of_episodes: number;
  number_of_seasons: number;
  poster_path?: string;
  backdrop_path?: string;
  genre_ids: number[];
  genres?: TMDbGenre[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  spoken_languages?: TMDbLanguage[];
  production_companies?: TMDbCompany[];
  production_countries?: TMDbCountry[];
  status: string;
  tagline?: string;
  homepage?: string;
  in_production: boolean;
  type: string;
  videos?: TMDbVideosResponse;
  credits?: TMDbCreditsResponse;
  keywords?: TMDbKeywordsResponse;
  similar?: TMDbSearchResponse<TMDbTVShow>;
  recommendations?: TMDbSearchResponse<TMDbTVShow>;
  seasons?: TMDbSeason[];
  created_by?: TMDbCreator[];
  networks?: TMDbNetwork[];
  origin_country: string[];
}

interface TMDbPerson {
  id: number;
  name: string;
  also_known_as: string[];
  biography: string;
  birthday?: string;
  deathday?: string;
  gender: number;
  known_for_department: string;
  place_of_birth?: string;
  popularity: number;
  profile_path?: string;
  adult: boolean;
  imdb_id?: string;
  homepage?: string;
  movie_credits?: TMDbCreditsResponse;
  tv_credits?: TMDbCreditsResponse;
  combined_credits?: TMDbCreditsResponse;
}

interface TMDbGenre {
  id: number;
  name: string;
}

interface TMDbLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

interface TMDbCompany {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

interface TMDbCountry {
  iso_3166_1: string;
  name: string;
}

interface TMDbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
  size: number;
}

interface TMDbVideosResponse {
  results: TMDbVideo[];
}

interface TMDbCast {
  id: number;
  cast_id: number;
  character: string;
  credit_id: string;
  gender: number;
  name: string;
  order: number;
  popularity: number;
  profile_path?: string;
}

interface TMDbCrew {
  id: number;
  credit_id: string;
  department: string;
  gender: number;
  job: string;
  name: string;
  popularity: number;
  profile_path?: string;
}

interface TMDbCreditsResponse {
  cast: TMDbCast[];
  crew: TMDbCrew[];
}

interface TMDbKeyword {
  id: number;
  name: string;
}

interface TMDbKeywordsResponse {
  keywords?: TMDbKeyword[];
  results?: TMDbKeyword[];
}

interface TMDbSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface TMDbSeason {
  id: number;
  air_date?: string;
  episode_count: number;
  name: string;
  overview: string;
  poster_path?: string;
  season_number: number;
}

interface TMDbCreator {
  id: number;
  name: string;
  gender: number;
  profile_path?: string;
  credit_id: string;
}

interface TMDbNetwork {
  id: number;
  name: string;
  logo_path?: string;
  origin_country: string;
}

interface TMDbEpisode {
  id: number;
  air_date?: string;
  episode_number: number;
  name: string;
  overview: string;
  production_code?: string;
  runtime?: number;
  season_number: number;
  show_id: number;
  still_path?: string;
  vote_average: number;
  vote_count: number;
  crew?: TMDbCrew[];
  guest_stars?: TMDbCast[];
}

// Transformed types for internal use
export interface MovieMetadata {
  id: number;
  title: string;
  originalTitle: string;
  description: string;
  releaseDate: string;
  runtimeMinutes?: number;
  images: {
    poster?: string;
    backdrop?: string;
  };
  externalIds: {
    imdb?: string;
    tmdb: number;
  };
  genres: string[];
  ratings: {
    tmdb: number;
    voteCount: number;
  };
  popularity: number;
  adult: boolean;
  language: string;
  spokenLanguages: string[];
  productionCompanies: string[];
  productionCountries: string[];
  status: string;
  tagline?: string;
  homepage?: string;
  budget?: number;
  revenue?: number;
  videos: VideoMetadata[];
  cast: CastMember[];
  crew: CrewMember[];
  keywords: string[];
  similarContent: number[];
  recommendations: number[];
}

export interface TVShowMetadata {
  id: number;
  title: string;
  originalTitle: string;
  description: string;
  firstAirDate: string;
  lastAirDate?: string;
  episodeRunTime: number[];
  numberOfEpisodes: number;
  numberOfSeasons: number;
  images: {
    poster?: string;
    backdrop?: string;
  };
  externalIds: {
    tmdb: number;
  };
  genres: string[];
  ratings: {
    tmdb: number;
    voteCount: number;
  };
  popularity: number;
  adult: boolean;
  language: string;
  spokenLanguages: string[];
  productionCompanies: string[];
  productionCountries: string[];
  status: string;
  tagline?: string;
  homepage?: string;
  inProduction: boolean;
  type: string;
  videos: VideoMetadata[];
  cast: CastMember[];
  crew: CrewMember[];
  keywords: string[];
  similarContent: number[];
  recommendations: number[];
  seasons: SeasonMetadata[];
  creators: CreatorMetadata[];
  networks: NetworkMetadata[];
  originCountries: string[];
}

export interface PersonMetadata {
  id: number;
  name: string;
  alsoKnownAs: string[];
  biography: string;
  birthday?: string;
  deathday?: string;
  gender: 'not_set' | 'female' | 'male' | 'non_binary';
  knownFor: string;
  placeOfBirth?: string;
  popularity: number;
  profileImage?: string;
  adult: boolean;
  externalIds: {
    imdb?: string;
    tmdb: number;
  };
  homepage?: string;
  movieCredits: CreditMetadata[];
  tvCredits: CreditMetadata[];
}

export interface VideoMetadata {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt: string;
  quality: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profileImage?: string;
}

export interface CrewMember {
  id: number;
  name: string;
  department: string;
  job: string;
  profileImage?: string;
}

export interface CreditMetadata {
  id: number;
  title: string;
  character?: string;
  job?: string;
  department?: string;
  mediaType: 'movie' | 'tv';
  releaseDate?: string;
  posterImage?: string;
}

export interface SeasonMetadata {
  id: number;
  seasonNumber: number;
  name: string;
  description: string;
  airDate?: string;
  episodeCount: number;
  posterImage?: string;
}

export interface CreatorMetadata {
  id: number;
  name: string;
  profileImage?: string;
}

export interface NetworkMetadata {
  id: number;
  name: string;
  logo?: string;
  originCountry: string;
}

export interface TMDbSearchParams {
  query: string;
  page?: number;
  year?: number;
  primary_release_year?: number;
  first_air_date_year?: number;
  region?: string;
  include_adult?: boolean;
}

class TMDbApiClient extends BaseApiClient {
  private static readonly BASE_URL = 'https://api.themoviedb.org/3';
  private static readonly IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';
  private static readonly TRUE_CRIME_KEYWORDS = [
    'true crime', 'serial killer', 'murder', 'investigation', 'criminal',
    'detective', 'police', 'forensic', 'documentary crime', 'real crime',
    'unsolved mystery', 'cold case', 'criminal investigation'
  ];

  private static readonly TRUE_CRIME_GENRE_IDS = {
    crime: 80,
    documentary: 99,
    mystery: 9648,
    thriller: 53,
    history: 36
  };

  private genres: Map<number, string> = new Map();

  constructor(apiKey: string) {
    const config = {
      ...DEFAULT_CONFIGS.FAST_API,
      baseURL: TMDbApiClient.BASE_URL,
      apiKey,
      headers: {
        'Content-Type': 'application/json'
      },
      // TMDb rate limits: 40 requests per 10 seconds for free tier
      rateLimitConfig: {
        requestsPerSecond: 3,
        requestsPerMinute: 30,
        requestsPerHour: 1000
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 3600, // 1 hour - metadata changes infrequently
        maxSize: 5000
      }
    };

    super(config);
    this.initializeGenres();
  }

  /**
   * Initialize genre mappings
   */
  private async initializeGenres(): Promise<void> {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        this.getMovieGenres(),
        this.getTVGenres()
      ]);

      // Combine and store genres
      [...movieGenres, ...tvGenres].forEach(genre => {
        this.genres.set(genre.id, genre.name);
      });
    } catch (error) {
      console.warn('Failed to initialize TMDb genres:', error);
    }
  }

  /**
   * Search for movies
   */
  async searchMovies(params: TMDbSearchParams): Promise<MovieMetadata[]> {
    const cacheKey = this.generateCacheKey('GET', '/search/movie', params);

    const queryParams = {
      api_key: this.config.apiKey,
      query: params.query,
      page: params.page || 1,
      include_adult: params.include_adult || false,
      ...(params.year && { year: params.year }),
      ...(params.primary_release_year && { primary_release_year: params.primary_release_year }),
      ...(params.region && { region: params.region })
    };

    const response = await this.makeRequest<TMDbSearchResponse<TMDbMovie>>(
      {
        method: 'GET',
        url: '/search/movie',
        params: queryParams
      },
      cacheKey,
      1800 // Cache for 30 minutes
    );

    return response.results.map(movie => this.transformMovie(movie));
  }

  /**
   * Search for TV shows
   */
  async searchTVShows(params: TMDbSearchParams): Promise<TVShowMetadata[]> {
    const cacheKey = this.generateCacheKey('GET', '/search/tv', params);

    const queryParams = {
      api_key: this.config.apiKey,
      query: params.query,
      page: params.page || 1,
      include_adult: params.include_adult || false,
      ...(params.first_air_date_year && { first_air_date_year: params.first_air_date_year })
    };

    const response = await this.makeRequest<TMDbSearchResponse<TMDbTVShow>>(
      {
        method: 'GET',
        url: '/search/tv',
        params: queryParams
      },
      cacheKey,
      1800 // Cache for 30 minutes
    );

    return response.results.map(show => this.transformTVShow(show));
  }

  /**
   * Get detailed movie information
   */
  async getMovieDetails(movieId: number): Promise<MovieMetadata | null> {
    const cacheKey = this.generateCacheKey('GET', `/movie/${movieId}`);

    try {
      const movie = await this.makeRequest<TMDbMovie>(
        {
          method: 'GET',
          url: `/movie/${movieId}`,
          params: {
            api_key: this.config.apiKey,
            append_to_response: 'videos,credits,keywords,similar,recommendations,external_ids'
          }
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return this.transformMovie(movie);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get detailed TV show information
   */
  async getTVShowDetails(showId: number): Promise<TVShowMetadata | null> {
    const cacheKey = this.generateCacheKey('GET', `/tv/${showId}`);

    try {
      const show = await this.makeRequest<TMDbTVShow>(
        {
          method: 'GET',
          url: `/tv/${showId}`,
          params: {
            api_key: this.config.apiKey,
            append_to_response: 'videos,credits,keywords,similar,recommendations,external_ids'
          }
        },
        cacheKey,
        7200 // Cache for 2 hours
      );

      return this.transformTVShow(show);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get person details
   */
  async getPersonDetails(personId: number): Promise<PersonMetadata | null> {
    const cacheKey = this.generateCacheKey('GET', `/person/${personId}`);

    try {
      const person = await this.makeRequest<TMDbPerson>(
        {
          method: 'GET',
          url: `/person/${personId}`,
          params: {
            api_key: this.config.apiKey,
            append_to_response: 'movie_credits,tv_credits,combined_credits,external_ids'
          }
        },
        cacheKey,
        14400 // Cache for 4 hours
      );

      return this.transformPerson(person);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Search for True Crime content specifically
   */
  async searchTrueCrimeContent(query?: string, page: number = 1): Promise<(MovieMetadata | TVShowMetadata)[]> {
    const searchQuery = query || 'true crime';

    // Search both movies and TV shows in parallel
    const [movies, tvShows] = await Promise.all([
      this.searchMovies({ query: searchQuery, page }),
      this.searchTVShows({ query: searchQuery, page })
    ]);

    // Filter for True Crime content based on genres and keywords
    const trueCrimeMovies = movies.filter(movie => this.isTrueCrimeContent(movie.genres, movie.keywords));
    const trueCrimeTVShows = tvShows.filter(show => this.isTrueCrimeContent(show.genres, show.keywords));

    // Combine and sort by popularity
    const combined = [...trueCrimeMovies, ...trueCrimeTVShows];
    return combined.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get trending content with True Crime focus
   */
  async getTrendingTrueCrime(timeWindow: 'day' | 'week' = 'week'): Promise<(MovieMetadata | TVShowMetadata)[]> {
    const cacheKey = this.generateCacheKey('GET', `/trending/all/${timeWindow}`);

    const response = await this.makeRequest<TMDbSearchResponse<TMDbMovie | TMDbTVShow>>(
      {
        method: 'GET',
        url: `/trending/all/${timeWindow}`,
        params: { api_key: this.config.apiKey }
      },
      cacheKey,
      1800 // Cache for 30 minutes
    );

    // Transform and filter for True Crime content
    const transformed = response.results.map(item => {
      if ('title' in item) {
        return this.transformMovie(item as TMDbMovie);
      } else {
        return this.transformTVShow(item as TMDbTVShow);
      }
    });

    return transformed.filter(item =>
      this.isTrueCrimeContent(item.genres, item.keywords)
    );
  }

  /**
   * Get movie genres
   */
  async getMovieGenres(): Promise<TMDbGenre[]> {
    const cacheKey = this.generateCacheKey('GET', '/genre/movie/list');

    const response = await this.makeRequest<{ genres: TMDbGenre[] }>(
      {
        method: 'GET',
        url: '/genre/movie/list',
        params: { api_key: this.config.apiKey }
      },
      cacheKey,
      86400 // Cache for 24 hours
    );

    return response.genres;
  }

  /**
   * Get TV genres
   */
  async getTVGenres(): Promise<TMDbGenre[]> {
    const cacheKey = this.generateCacheKey('GET', '/genre/tv/list');

    const response = await this.makeRequest<{ genres: TMDbGenre[] }>(
      {
        method: 'GET',
        url: '/genre/tv/list',
        params: { api_key: this.config.apiKey }
      },
      cacheKey,
      86400 // Cache for 24 hours
    );

    return response.genres;
  }

  /**
   * Build full image URL
   */
  getImageUrl(path: string, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string {
    return `${TMDbApiClient.IMAGE_BASE_URL}${size}${path}`;
  }

  /**
   * Health check for TMDb API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: '/genre/movie/list',
        params: { api_key: this.config.apiKey },
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Transform TMDb movie to internal format
   */
  private transformMovie(movie: TMDbMovie): MovieMetadata {
    return {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      description: movie.overview || '',
      releaseDate: movie.release_date,
      runtimeMinutes: movie.runtime,
      images: {
        poster: movie.poster_path ? this.getImageUrl(movie.poster_path) : undefined,
        backdrop: movie.backdrop_path ? this.getImageUrl(movie.backdrop_path, 'original') : undefined
      },
      externalIds: {
        imdb: movie.imdb_id,
        tmdb: movie.id
      },
      genres: this.mapGenres(movie.genre_ids || [], movie.genres),
      ratings: {
        tmdb: movie.vote_average,
        voteCount: movie.vote_count
      },
      popularity: movie.popularity,
      adult: movie.adult,
      language: movie.original_language,
      spokenLanguages: movie.spoken_languages?.map(lang => lang.english_name) || [],
      productionCompanies: movie.production_companies?.map(company => company.name) || [],
      productionCountries: movie.production_countries?.map(country => country.name) || [],
      status: movie.status,
      tagline: movie.tagline,
      homepage: movie.homepage,
      budget: movie.budget,
      revenue: movie.revenue,
      videos: movie.videos?.results.map(video => this.transformVideo(video)) || [],
      cast: movie.credits?.cast.slice(0, 20).map(member => this.transformCastMember(member)) || [],
      crew: movie.credits?.crew.filter(member => ['Director', 'Producer', 'Writer'].includes(member.job))
        .map(member => this.transformCrewMember(member)) || [],
      keywords: movie.keywords?.keywords?.map(keyword => keyword.name) ||
                movie.keywords?.results?.map(keyword => keyword.name) || [],
      similarContent: movie.similar?.results.map(similar => similar.id) || [],
      recommendations: movie.recommendations?.results.map(rec => rec.id) || []
    };
  }

  /**
   * Transform TMDb TV show to internal format
   */
  private transformTVShow(show: TMDbTVShow): TVShowMetadata {
    return {
      id: show.id,
      title: show.name,
      originalTitle: show.original_name,
      description: show.overview || '',
      firstAirDate: show.first_air_date,
      lastAirDate: show.last_air_date,
      episodeRunTime: show.episode_run_time || [],
      numberOfEpisodes: show.number_of_episodes,
      numberOfSeasons: show.number_of_seasons,
      images: {
        poster: show.poster_path ? this.getImageUrl(show.poster_path) : undefined,
        backdrop: show.backdrop_path ? this.getImageUrl(show.backdrop_path, 'original') : undefined
      },
      externalIds: {
        tmdb: show.id
      },
      genres: this.mapGenres(show.genre_ids || [], show.genres),
      ratings: {
        tmdb: show.vote_average,
        voteCount: show.vote_count
      },
      popularity: show.popularity,
      adult: show.adult,
      language: show.original_language,
      spokenLanguages: show.spoken_languages?.map(lang => lang.english_name) || [],
      productionCompanies: show.production_companies?.map(company => company.name) || [],
      productionCountries: show.production_countries?.map(country => country.name) || [],
      status: show.status,
      tagline: show.tagline,
      homepage: show.homepage,
      inProduction: show.in_production,
      type: show.type,
      videos: show.videos?.results.map(video => this.transformVideo(video)) || [],
      cast: show.credits?.cast.slice(0, 20).map(member => this.transformCastMember(member)) || [],
      crew: show.credits?.crew.filter(member => ['Director', 'Producer', 'Writer', 'Creator'].includes(member.job))
        .map(member => this.transformCrewMember(member)) || [],
      keywords: show.keywords?.results?.map(keyword => keyword.name) || [],
      similarContent: show.similar?.results.map(similar => similar.id) || [],
      recommendations: show.recommendations?.results.map(rec => rec.id) || [],
      seasons: show.seasons?.map(season => this.transformSeason(season)) || [],
      creators: show.created_by?.map(creator => this.transformCreator(creator)) || [],
      networks: show.networks?.map(network => this.transformNetwork(network)) || [],
      originCountries: show.origin_country || []
    };
  }

  /**
   * Transform TMDb person to internal format
   */
  private transformPerson(person: TMDbPerson): PersonMetadata {
    const genderMap = ['not_set', 'female', 'male', 'non_binary'] as const;

    return {
      id: person.id,
      name: person.name,
      alsoKnownAs: person.also_known_as || [],
      biography: person.biography || '',
      birthday: person.birthday,
      deathday: person.deathday,
      gender: genderMap[person.gender] || 'not_set',
      knownFor: person.known_for_department,
      placeOfBirth: person.place_of_birth,
      popularity: person.popularity,
      profileImage: person.profile_path ? this.getImageUrl(person.profile_path) : undefined,
      adult: person.adult,
      externalIds: {
        imdb: person.imdb_id,
        tmdb: person.id
      },
      homepage: person.homepage,
      movieCredits: person.movie_credits?.cast.map(credit => ({
        id: credit.id,
        title: credit.title,
        character: credit.character,
        mediaType: 'movie' as const,
        releaseDate: credit.release_date,
        posterImage: credit.poster_path ? this.getImageUrl(credit.poster_path) : undefined
      })) || [],
      tvCredits: person.tv_credits?.cast.map(credit => ({
        id: credit.id,
        title: credit.name,
        character: credit.character,
        mediaType: 'tv' as const,
        releaseDate: credit.first_air_date,
        posterImage: credit.poster_path ? this.getImageUrl(credit.poster_path) : undefined
      })) || []
    };
  }

  /**
   * Helper methods for transformation
   */
  private transformVideo(video: TMDbVideo): VideoMetadata {
    const qualityMap: { [key: number]: string } = {
      360: 'SD',
      480: 'SD',
      720: 'HD',
      1080: 'FHD',
      2160: 'UHD'
    };

    return {
      id: video.id,
      key: video.key,
      name: video.name,
      site: video.site,
      type: video.type,
      official: video.official,
      publishedAt: video.published_at,
      quality: qualityMap[video.size] || 'HD'
    };
  }

  private transformCastMember(member: TMDbCast): CastMember {
    return {
      id: member.id,
      name: member.name,
      character: member.character,
      order: member.order,
      profileImage: member.profile_path ? this.getImageUrl(member.profile_path) : undefined
    };
  }

  private transformCrewMember(member: TMDbCrew): CrewMember {
    return {
      id: member.id,
      name: member.name,
      department: member.department,
      job: member.job,
      profileImage: member.profile_path ? this.getImageUrl(member.profile_path) : undefined
    };
  }

  private transformSeason(season: TMDbSeason): SeasonMetadata {
    return {
      id: season.id,
      seasonNumber: season.season_number,
      name: season.name,
      description: season.overview,
      airDate: season.air_date,
      episodeCount: season.episode_count,
      posterImage: season.poster_path ? this.getImageUrl(season.poster_path) : undefined
    };
  }

  private transformCreator(creator: TMDbCreator): CreatorMetadata {
    return {
      id: creator.id,
      name: creator.name,
      profileImage: creator.profile_path ? this.getImageUrl(creator.profile_path) : undefined
    };
  }

  private transformNetwork(network: TMDbNetwork): NetworkMetadata {
    return {
      id: network.id,
      name: network.name,
      logo: network.logo_path ? this.getImageUrl(network.logo_path) : undefined,
      originCountry: network.origin_country
    };
  }

  private mapGenres(genreIds: number[], genres?: TMDbGenre[]): string[] {
    if (genres) {
      return genres.map(genre => genre.name);
    }

    return genreIds.map(id => this.genres.get(id) || 'Unknown').filter(name => name !== 'Unknown');
  }

  private isTrueCrimeContent(genres: string[], keywords: string[]): boolean {
    const genreMatch = genres.some(genre =>
      ['Crime', 'Documentary', 'Mystery', 'Thriller'].includes(genre)
    );

    const keywordMatch = keywords.some(keyword =>
      TMDbApiClient.TRUE_CRIME_KEYWORDS.some(tcKeyword =>
        keyword.toLowerCase().includes(tcKeyword.toLowerCase())
      )
    );

    return genreMatch || keywordMatch;
  }
}

export { TMDbApiClient };