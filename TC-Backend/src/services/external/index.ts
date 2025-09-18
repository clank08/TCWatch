/**
 * External API Services Index
 *
 * Exports all external API clients and provides factory functions
 * for creating configured client instances.
 */

import { WatchmodeApiClient } from './watchmode-client.js';
import { TMDbApiClient } from './tmdb-client.js';
import { TVDBApiClient } from './tvdb-client.js';
import { TVMazeApiClient } from './tvmaze-client.js';
import { WikidataApiClient } from './wikidata-client.js';

// Re-export all clients
export { WatchmodeApiClient } from './watchmode-client.js';
export { TMDbApiClient } from './tmdb-client.js';
export { TVDBApiClient } from './tvdb-client.js';
export { TVMazeApiClient } from './tvmaze-client.js';
export { WikidataApiClient } from './wikidata-client.js';

// Re-export types
export type {
  ContentAvailability,
  StreamingPlatform,
  WatchmodeSearchParams
} from './watchmode-client.js';

export type {
  MovieMetadata,
  TVShowMetadata,
  PersonMetadata,
  TMDbSearchParams
} from './tmdb-client.js';

export type {
  SeriesMetadata,
  EpisodeMetadata,
  SeasonMetadata,
  TVDBSearchParams
} from './tvdb-client.js';

export type {
  TVScheduleInfo,
  EpisodeScheduleInfo,
  PersonInfo as TVMazePersonInfo
} from './tvmaze-client.js';

export type {
  CriminalCase,
  PersonInfo as WikidataPersonInfo,
  LocationInfo,
  MediaReference,
  WikidataSearchParams
} from './wikidata-client.js';

/**
 * API Client Configuration
 */
export interface ExternalAPIConfig {
  watchmodeApiKey?: string;
  tmdbApiKey?: string;
  tvdbApiKey?: string;
  tvdbPin?: string;
  // TVMaze and Wikidata don't require API keys
}

/**
 * External API Services Manager
 *
 * Provides centralized management and health checking for all external APIs
 */
export class ExternalAPIManager {
  public watchmode?: WatchmodeApiClient;
  public tmdb?: TMDbApiClient;
  public tvdb?: TVDBApiClient;
  public tvmaze: TVMazeApiClient;
  public wikidata: WikidataApiClient;

  constructor(config: ExternalAPIConfig) {
    // Initialize clients that have API keys
    if (config.watchmodeApiKey) {
      this.watchmode = new WatchmodeApiClient(config.watchmodeApiKey);
    }

    if (config.tmdbApiKey) {
      this.tmdb = new TMDbApiClient(config.tmdbApiKey);
    }

    if (config.tvdbApiKey) {
      this.tvdb = new TVDBApiClient(config.tvdbApiKey, config.tvdbPin);
    }

    // Initialize clients that don't require API keys
    this.tvmaze = new TVMazeApiClient();
    this.wikidata = new WikidataApiClient();
  }

  /**
   * Check health of all configured APIs
   */
  async healthCheck(): Promise<{
    watchmode?: boolean;
    tmdb?: boolean;
    tvdb?: boolean;
    tvmaze: boolean;
    wikidata: boolean;
    overall: boolean;
  }> {
    const results: any = {
      tvmaze: false,
      wikidata: false,
      overall: false
    };

    const checks: Promise<void>[] = [];

    // Check Watchmode
    if (this.watchmode) {
      checks.push(
        this.watchmode.healthCheck()
          .then(healthy => { results.watchmode = healthy; })
          .catch(() => { results.watchmode = false; })
      );
    }

    // Check TMDb
    if (this.tmdb) {
      checks.push(
        this.tmdb.healthCheck()
          .then(healthy => { results.tmdb = healthy; })
          .catch(() => { results.tmdb = false; })
      );
    }

    // Check TVDB
    if (this.tvdb) {
      checks.push(
        this.tvdb.healthCheck()
          .then(healthy => { results.tvdb = healthy; })
          .catch(() => { results.tvdb = false; })
      );
    }

    // Check TVMaze
    checks.push(
      this.tvmaze.healthCheck()
        .then(healthy => { results.tvmaze = healthy; })
        .catch(() => { results.tvmaze = false; })
    );

    // Check Wikidata
    checks.push(
      this.wikidata.healthCheck()
        .then(healthy => { results.wikidata = healthy; })
        .catch(() => { results.wikidata = false; })
    );

    // Wait for all checks to complete
    await Promise.allSettled(checks);

    // Calculate overall health (at least 60% of configured services must be healthy)
    const configuredServices = [
      this.watchmode ? 'watchmode' : null,
      this.tmdb ? 'tmdb' : null,
      this.tvdb ? 'tvdb' : null,
      'tvmaze',
      'wikidata'
    ].filter(Boolean);

    const healthyServices = configuredServices.filter(service => results[service]).length;
    results.overall = healthyServices >= Math.ceil(configuredServices.length * 0.6);

    return results;
  }

  /**
   * Get circuit breaker states for all clients
   */
  getCircuitBreakerStates(): Record<string, string> {
    const states: Record<string, string> = {};

    if (this.watchmode) {
      states.watchmode = this.watchmode.getCircuitBreakerState();
    }

    if (this.tmdb) {
      states.tmdb = this.tmdb.getCircuitBreakerState();
    }

    if (this.tvdb) {
      states.tvdb = this.tvdb.getCircuitBreakerState();
    }

    states.tvmaze = this.tvmaze.getCircuitBreakerState();
    states.wikidata = this.wikidata.getCircuitBreakerState();

    return states;
  }

  /**
   * Get cache statistics for all clients
   */
  getCacheStats(): Record<string, { size: number; enabled: boolean }> {
    const stats: Record<string, { size: number; enabled: boolean }> = {};

    if (this.watchmode) {
      stats.watchmode = this.watchmode.getCacheStats();
    }

    if (this.tmdb) {
      stats.tmdb = this.tmdb.getCacheStats();
    }

    if (this.tvdb) {
      stats.tvdb = this.tvdb.getCacheStats();
    }

    stats.tvmaze = this.tvmaze.getCacheStats();
    stats.wikidata = this.wikidata.getCacheStats();

    return stats;
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    if (this.watchmode) this.watchmode.clearCache();
    if (this.tmdb) this.tmdb.clearCache();
    if (this.tvdb) this.tvdb.clearCache();
    this.tvmaze.clearCache();
    this.wikidata.clearCache();
  }

  /**
   * Get API status summary
   */
  async getStatusSummary(): Promise<{
    health: Record<string, boolean | undefined>;
    circuitBreakers: Record<string, string>;
    caches: Record<string, { size: number; enabled: boolean }>;
    timestamp: string;
  }> {
    const health = await this.healthCheck();
    const circuitBreakers = this.getCircuitBreakerStates();
    const caches = this.getCacheStats();

    return {
      health,
      circuitBreakers,
      caches,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Factory function to create configured API manager
 */
export function createExternalAPIManager(config: ExternalAPIConfig): ExternalAPIManager {
  return new ExternalAPIManager(config);
}

/**
 * Factory functions for individual clients
 */
export function createWatchmodeClient(apiKey: string): WatchmodeApiClient {
  return new WatchmodeApiClient(apiKey);
}

export function createTMDbClient(apiKey: string): TMDbApiClient {
  return new TMDbApiClient(apiKey);
}

export function createTVDBClient(apiKey: string, pin?: string): TVDBApiClient {
  return new TVDBApiClient(apiKey, pin);
}

export function createTVMazeClient(): TVMazeApiClient {
  return new TVMazeApiClient();
}

export function createWikidataClient(): WikidataApiClient {
  return new WikidataApiClient();
}