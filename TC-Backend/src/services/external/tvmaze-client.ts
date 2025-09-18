/**
 * TVMaze API Client
 *
 * Client for TVMaze API to fetch TV scheduling information and supplementary show data.
 * Focuses on upcoming episode air dates and network scheduling for True Crime content.
 */

import { BaseApiClient, DEFAULT_CONFIGS } from '../base/api-client.js';

// TVMaze API Response Types
interface TVMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string;
  genres: string[];
  status: string;
  runtime?: number;
  averageRuntime?: number;
  premiered?: string;
  ended?: string;
  officialSite?: string;
  schedule: TVMazeSchedule;
  rating: TVMazeRating;
  weight: number;
  network?: TVMazeNetwork;
  webChannel?: TVMazeWebChannel;
  dvdCountry?: TVMazeCountry;
  externals: TVMazeExternals;
  image?: TVMazeImage;
  summary?: string;
  updated: number;
  _links?: TVMazeLinks;
  _embedded?: {
    episodes?: TVMazeEpisode[];
    seasons?: TVMazeSeason[];
    cast?: TVMazeCastMember[];
    crew?: TVMazeCrewMember[];
    akas?: TVMazeAka[];
    nextepisode?: TVMazeEpisode;
    previousepisode?: TVMazeEpisode;
  };
}

interface TVMazeEpisode {
  id: number;
  url: string;
  name: string;
  season: number;
  number?: number;
  type: string;
  airdate?: string;
  airtime?: string;
  airstamp?: string;
  runtime?: number;
  rating: TVMazeRating;
  image?: TVMazeImage;
  summary?: string;
  _links?: TVMazeLinks;
  _embedded?: {
    show?: TVMazeShow;
  };
}

interface TVMazeSeason {
  id: number;
  url: string;
  number: number;
  name?: string;
  episodeOrder?: number;
  premiereDate?: string;
  endDate?: string;
  network?: TVMazeNetwork;
  webChannel?: TVMazeWebChannel;
  image?: TVMazeImage;
  summary?: string;
  _links?: TVMazeLinks;
}

interface TVMazeSchedule {
  time: string;
  days: string[];
}

interface TVMazeRating {
  average?: number;
}

interface TVMazeNetwork {
  id: number;
  name: string;
  country: TVMazeCountry;
  officialSite?: string;
}

interface TVMazeWebChannel {
  id: number;
  name: string;
  country?: TVMazeCountry;
  officialSite?: string;
}

interface TVMazeCountry {
  name: string;
  code: string;
  timezone: string;
}

interface TVMazeExternals {
  tvrage?: number;
  thetvdb?: number;
  imdb?: string;
}

interface TVMazeImage {
  medium: string;
  original: string;
}

interface TVMazeLinks {
  self?: { href: string };
  nextepisode?: { href: string };
  previousepisode?: { href: string };
}

interface TVMazeCastMember {
  person: TVMazePerson;
  character: TVMazeCharacter;
  self: boolean;
  voice: boolean;
}

interface TVMazeCrewMember {
  type: string;
  person: TVMazePerson;
}

interface TVMazePerson {
  id: number;
  url: string;
  name: string;
  country?: TVMazeCountry;
  birthday?: string;
  deathday?: string;
  gender?: string;
  image?: TVMazeImage;
  updated: number;
  _links?: TVMazeLinks;
}

interface TVMazeCharacter {
  id: number;
  url: string;
  name: string;
  image?: TVMazeImage;
  _links?: TVMazeLinks;
}

interface TVMazeAka {
  name: string;
  country: TVMazeCountry;
}

interface TVMazeSearchResult {
  score: number;
  show: TVMazeShow;
}

// Transformed types for internal use
export interface TVScheduleInfo {
  id: number;
  name: string;
  type: string;
  status: string;
  genres: string[];
  language: string;
  network?: {
    id: number;
    name: string;
    country: string;
    officialSite?: string;
  };
  webChannel?: {
    id: number;
    name: string;
    country?: string;
    officialSite?: string;
  };
  schedule: {
    time: string;
    days: string[];
  };
  runtime?: number;
  averageRuntime?: number;
  premiered?: string;
  ended?: string;
  rating?: number;
  weight: number;
  officialSite?: string;
  summary?: string;
  images?: {
    medium?: string;
    original?: string;
  };
  externalIds: {
    tvmaze: number;
    tvrage?: number;
    thetvdb?: number;
    imdb?: string;
  };
  nextEpisode?: EpisodeScheduleInfo;
  previousEpisode?: EpisodeScheduleInfo;
  lastUpdated: string;
}

export interface EpisodeScheduleInfo {
  id: number;
  name: string;
  season: number;
  episode?: number;
  type: string;
  airDate?: string;
  airTime?: string;
  airTimestamp?: string;
  runtime?: number;
  rating?: number;
  summary?: string;
  images?: {
    medium?: string;
    original?: string;
  };
  showId?: number;
  showName?: string;
}

export interface PersonInfo {
  id: number;
  name: string;
  country?: string;
  birthday?: string;
  deathday?: string;
  gender?: string;
  image?: string;
  lastUpdated: string;
}

export interface CastInfo {
  person: PersonInfo;
  character: {
    id: number;
    name: string;
    image?: string;
  };
  isRegular: boolean;
  isVoice: boolean;
}

export interface CrewInfo {
  type: string;
  person: PersonInfo;
}

export interface SeasonInfo {
  id: number;
  number: number;
  name?: string;
  episodeOrder?: number;
  premiereDate?: string;
  endDate?: string;
  network?: string;
  webChannel?: string;
  summary?: string;
  image?: string;
}

class TVMazeApiClient extends BaseApiClient {
  private static readonly BASE_URL = 'https://api.tvmaze.com';

  constructor() {
    const config = {
      ...DEFAULT_CONFIGS.FAST_API,
      baseURL: TVMazeApiClient.BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      // TVMaze is generous with rate limits but recommend being respectful
      rateLimitConfig: {
        requestsPerSecond: 4,
        requestsPerMinute: 100,
        requestsPerHour: 2000
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 1800, // 30 minutes - scheduling data changes frequently
        maxSize: 2000
      }
    };

    super(config);
  }

  /**
   * Search for shows by name
   */
  async searchShows(query: string): Promise<TVScheduleInfo[]> {
    const cacheKey = this.generateCacheKey('GET', '/search/shows', { q: query });

    const response = await this.makeRequest<TVMazeSearchResult[]>(
      {
        method: 'GET',
        url: '/search/shows',
        params: { q: query }
      },
      cacheKey,
      1800 // Cache for 30 minutes
    );

    return response.map(result => this.transformShow(result.show));
  }

  /**
   * Get show by TVMaze ID
   */
  async getShowById(showId: number, includeEpisodes = false): Promise<TVScheduleInfo | null> {
    const cacheKey = this.generateCacheKey('GET', `/shows/${showId}`, { embed: includeEpisodes });

    try {
      const embedParams = includeEpisodes ? '?embed[]=episodes&embed[]=seasons&embed[]=cast' : '';
      const show = await this.makeRequest<TVMazeShow>(
        {
          method: 'GET',
          url: `/shows/${showId}${embedParams}`
        },
        cacheKey,
        3600 // Cache for 1 hour
      );

      return this.transformShow(show);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get show by external ID (TheTVDB, IMDB)
   */
  async getShowByExternalId(externalId: string, idType: 'thetvdb' | 'imdb'): Promise<TVScheduleInfo | null> {
    const cacheKey = this.generateCacheKey('GET', `/lookup/shows`, { [idType]: externalId });

    try {
      const show = await this.makeRequest<TVMazeShow>(
        {
          method: 'GET',
          url: '/lookup/shows',
          params: { [idType]: externalId }
        },
        cacheKey,
        3600 // Cache for 1 hour
      );

      return this.transformShow(show);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get episodes for a show
   */
  async getShowEpisodes(showId: number, includeSpecials = true): Promise<EpisodeScheduleInfo[]> {
    const cacheKey = this.generateCacheKey('GET', `/shows/${showId}/episodes`, { specials: includeSpecials });

    const params: any = {};
    if (includeSpecials) {
      params.specials = '1';
    }

    const episodes = await this.makeRequest<TVMazeEpisode[]>(
      {
        method: 'GET',
        url: `/shows/${showId}/episodes`,
        params
      },
      cacheKey,
      3600 // Cache for 1 hour
    );

    return episodes.map(episode => this.transformEpisode(episode));
  }

  /**
   * Get show seasons
   */
  async getShowSeasons(showId: number): Promise<SeasonInfo[]> {
    const cacheKey = this.generateCacheKey('GET', `/shows/${showId}/seasons`);

    const seasons = await this.makeRequest<TVMazeSeason[]>(
      {
        method: 'GET',
        url: `/shows/${showId}/seasons`
      },
      cacheKey,
      7200 // Cache for 2 hours
    );

    return seasons.map(season => this.transformSeason(season));
  }

  /**
   * Get show cast
   */
  async getShowCast(showId: number): Promise<CastInfo[]> {
    const cacheKey = this.generateCacheKey('GET', `/shows/${showId}/cast`);

    const cast = await this.makeRequest<TVMazeCastMember[]>(
      {
        method: 'GET',
        url: `/shows/${showId}/cast`
      },
      cacheKey,
      7200 // Cache for 2 hours
    );

    return cast.map(member => this.transformCastMember(member));
  }

  /**
   * Get show crew
   */
  async getShowCrew(showId: number): Promise<CrewInfo[]> {
    const cacheKey = this.generateCacheKey('GET', `/shows/${showId}/crew`);

    const crew = await this.makeRequest<TVMazeCrewMember[]>(
      {
        method: 'GET',
        url: `/shows/${showId}/crew`
      },
      cacheKey,
      7200 // Cache for 2 hours
    );

    return crew.map(member => this.transformCrewMember(member));
  }

  /**
   * Get episode by ID
   */
  async getEpisodeById(episodeId: number): Promise<EpisodeScheduleInfo | null> {
    const cacheKey = this.generateCacheKey('GET', `/episodes/${episodeId}`);

    try {
      const episode = await this.makeRequest<TVMazeEpisode>(
        {
          method: 'GET',
          url: `/episodes/${episodeId}`
        },
        cacheKey,
        3600 // Cache for 1 hour
      );

      return this.transformEpisode(episode);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get schedule for a specific date
   */
  async getScheduleForDate(date: Date, country = 'US'): Promise<EpisodeScheduleInfo[]> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    const cacheKey = this.generateCacheKey('GET', `/schedule`, { date: dateStr, country });

    const episodes = await this.makeRequest<TVMazeEpisode[]>(
      {
        method: 'GET',
        url: '/schedule',
        params: {
          date: dateStr,
          country
        }
      },
      cacheKey,
      1800 // Cache for 30 minutes - schedule data changes frequently
    );

    return episodes.map(episode => this.transformEpisode(episode));
  }

  /**
   * Get upcoming episodes schedule
   */
  async getUpcomingSchedule(country = 'US'): Promise<EpisodeScheduleInfo[]> {
    const cacheKey = this.generateCacheKey('GET', '/schedule', { country });

    const episodes = await this.makeRequest<TVMazeEpisode[]>(
      {
        method: 'GET',
        url: '/schedule',
        params: { country }
      },
      cacheKey,
      900 // Cache for 15 minutes - very current data
    );

    return episodes.map(episode => this.transformEpisode(episode));
  }

  /**
   * Search for True Crime shows specifically
   */
  async searchTrueCrimeShows(query?: string): Promise<TVScheduleInfo[]> {
    const searchQuery = query || 'true crime';
    const results = await this.searchShows(searchQuery);

    // Filter for True Crime content
    return results.filter(show => this.isTrueCrimeContent(show));
  }

  /**
   * Get upcoming True Crime episodes
   */
  async getUpcomingTrueCrimeEpisodes(country = 'US'): Promise<EpisodeScheduleInfo[]> {
    const episodes = await this.getUpcomingSchedule(country);

    // Filter for True Crime shows
    const trueCrimeEpisodes: EpisodeScheduleInfo[] = [];

    for (const episode of episodes) {
      if (episode.showId) {
        try {
          const show = await this.getShowById(episode.showId);
          if (show && this.isTrueCrimeContent(show)) {
            trueCrimeEpisodes.push(episode);
          }
        } catch {
          // Skip episodes where we can't fetch show data
        }
      }
    }

    return trueCrimeEpisodes;
  }

  /**
   * Get episode air dates for a show
   */
  async getShowAirDates(showId: number): Promise<{ upcoming: EpisodeScheduleInfo[]; recent: EpisodeScheduleInfo[] }> {
    const episodes = await this.getShowEpisodes(showId);
    const now = new Date();

    const upcoming = episodes
      .filter(ep => ep.airTimestamp && new Date(ep.airTimestamp) > now)
      .sort((a, b) => new Date(a.airTimestamp!).getTime() - new Date(b.airTimestamp!).getTime())
      .slice(0, 5);

    const recent = episodes
      .filter(ep => ep.airTimestamp && new Date(ep.airTimestamp) <= now)
      .sort((a, b) => new Date(b.airTimestamp!).getTime() - new Date(a.airTimestamp!).getTime())
      .slice(0, 5);

    return { upcoming, recent };
  }

  /**
   * Health check for TVMaze API
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: '/schedule',
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Transform TVMaze show to internal format
   */
  private transformShow(show: TVMazeShow): TVScheduleInfo {
    return {
      id: show.id,
      name: show.name,
      type: show.type,
      status: show.status,
      genres: show.genres || [],
      language: show.language,
      network: show.network ? {
        id: show.network.id,
        name: show.network.name,
        country: show.network.country.name,
        officialSite: show.network.officialSite
      } : undefined,
      webChannel: show.webChannel ? {
        id: show.webChannel.id,
        name: show.webChannel.name,
        country: show.webChannel.country?.name,
        officialSite: show.webChannel.officialSite
      } : undefined,
      schedule: {
        time: show.schedule.time,
        days: show.schedule.days
      },
      runtime: show.runtime,
      averageRuntime: show.averageRuntime,
      premiered: show.premiered,
      ended: show.ended,
      rating: show.rating.average,
      weight: show.weight,
      officialSite: show.officialSite,
      summary: show.summary ? this.stripHtmlTags(show.summary) : undefined,
      images: show.image ? {
        medium: show.image.medium,
        original: show.image.original
      } : undefined,
      externalIds: {
        tvmaze: show.id,
        tvrage: show.externals.tvrage,
        thetvdb: show.externals.thetvdb,
        imdb: show.externals.imdb
      },
      nextEpisode: show._embedded?.nextepisode ? this.transformEpisode(show._embedded.nextepisode) : undefined,
      previousEpisode: show._embedded?.previousepisode ? this.transformEpisode(show._embedded.previousepisode) : undefined,
      lastUpdated: new Date(show.updated * 1000).toISOString()
    };
  }

  /**
   * Transform TVMaze episode to internal format
   */
  private transformEpisode(episode: TVMazeEpisode): EpisodeScheduleInfo {
    return {
      id: episode.id,
      name: episode.name,
      season: episode.season,
      episode: episode.number,
      type: episode.type,
      airDate: episode.airdate,
      airTime: episode.airtime,
      airTimestamp: episode.airstamp,
      runtime: episode.runtime,
      rating: episode.rating.average,
      summary: episode.summary ? this.stripHtmlTags(episode.summary) : undefined,
      images: episode.image ? {
        medium: episode.image.medium,
        original: episode.image.original
      } : undefined,
      showId: episode._embedded?.show?.id,
      showName: episode._embedded?.show?.name
    };
  }

  /**
   * Transform TVMaze cast member to internal format
   */
  private transformCastMember(member: TVMazeCastMember): CastInfo {
    return {
      person: this.transformPerson(member.person),
      character: {
        id: member.character.id,
        name: member.character.name,
        image: member.character.image?.original
      },
      isRegular: member.self,
      isVoice: member.voice
    };
  }

  /**
   * Transform TVMaze crew member to internal format
   */
  private transformCrewMember(member: TVMazeCrewMember): CrewInfo {
    return {
      type: member.type,
      person: this.transformPerson(member.person)
    };
  }

  /**
   * Transform TVMaze person to internal format
   */
  private transformPerson(person: TVMazePerson): PersonInfo {
    return {
      id: person.id,
      name: person.name,
      country: person.country?.name,
      birthday: person.birthday,
      deathday: person.deathday,
      gender: person.gender,
      image: person.image?.original,
      lastUpdated: new Date(person.updated * 1000).toISOString()
    };
  }

  /**
   * Transform TVMaze season to internal format
   */
  private transformSeason(season: TVMazeSeason): SeasonInfo {
    return {
      id: season.id,
      number: season.number,
      name: season.name,
      episodeOrder: season.episodeOrder,
      premiereDate: season.premiereDate,
      endDate: season.endDate,
      network: season.network?.name,
      webChannel: season.webChannel?.name,
      summary: season.summary ? this.stripHtmlTags(season.summary) : undefined,
      image: season.image?.original
    };
  }

  /**
   * Check if show is True Crime related
   */
  private isTrueCrimeContent(show: TVScheduleInfo): boolean {
    const trueCrimeGenres = ['Crime', 'Documentary', 'Mystery', 'Drama'];
    const trueCrimeKeywords = [
      'true crime', 'serial killer', 'murder', 'investigation', 'detective',
      'criminal', 'forensic', 'police', 'cold case', 'unsolved', 'mystery'
    ];

    // Check genres
    const genreMatch = show.genres.some(genre => trueCrimeGenres.includes(genre));

    // Check title and summary for keywords
    const textToCheck = `${show.name} ${show.summary || ''}`.toLowerCase();
    const keywordMatch = trueCrimeKeywords.some(keyword => textToCheck.includes(keyword));

    return genreMatch || keywordMatch;
  }

  /**
   * Strip HTML tags from text
   */
  private stripHtmlTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }
}

export { TVMazeApiClient };