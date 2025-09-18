/**
 * Base API Client with Circuit Breaker and Retry Logic
 *
 * This module provides a robust foundation for external API integrations
 * with built-in resilience patterns including circuit breaker, retry logic,
 * rate limiting, and caching capabilities.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { createHash } from 'crypto';

// Circuit Breaker States
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
}

interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // seconds
  maxSize: number;
}

interface ApiClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout: number;
  retryConfig: RetryConfig;
  circuitBreakerConfig: CircuitBreakerConfig;
  rateLimitConfig: RateLimitConfig;
  cacheConfig: CacheConfig;
  headers?: Record<string, string>;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failures: number = 0;
  private nextAttempt: number = 0;
  private successCount: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitBreakerState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitBreakerState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failures++;

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
      this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

class RateLimiter {
  private buckets: {
    second: RateLimitBucket;
    minute: RateLimitBucket;
    hour: RateLimitBucket;
  };

  constructor(private config: RateLimitConfig) {
    const now = Date.now();
    this.buckets = {
      second: { tokens: config.requestsPerSecond, lastRefill: now },
      minute: { tokens: config.requestsPerMinute, lastRefill: now },
      hour: { tokens: config.requestsPerHour, lastRefill: now }
    };
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();

    // Refill buckets
    this.refillBucket(this.buckets.second, this.config.requestsPerSecond, 1000, now);
    this.refillBucket(this.buckets.minute, this.config.requestsPerMinute, 60000, now);
    this.refillBucket(this.buckets.hour, this.config.requestsPerHour, 3600000, now);

    // Check if we can make the request
    if (this.buckets.second.tokens < 1 ||
        this.buckets.minute.tokens < 1 ||
        this.buckets.hour.tokens < 1) {

      const waitTime = Math.min(
        this.buckets.second.tokens < 1 ? 1000 : Infinity,
        this.buckets.minute.tokens < 1 ? 60000 : Infinity,
        this.buckets.hour.tokens < 1 ? 3600000 : Infinity
      );

      throw new Error(`Rate limit exceeded. Retry after ${waitTime}ms`);
    }

    // Consume tokens
    this.buckets.second.tokens--;
    this.buckets.minute.tokens--;
    this.buckets.hour.tokens--;
  }

  private refillBucket(bucket: RateLimitBucket, capacity: number, intervalMs: number, now: number): void {
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / intervalMs) * capacity;

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];

  constructor(private config: CacheConfig) {}

  get(key: string): any | null {
    if (!this.config.enabled) return null;

    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.delete(key);
      return null;
    }

    // Update access order (LRU)
    this.updateAccessOrder(key);
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    if (!this.config.enabled) return;

    const actualTTL = ttl || this.config.defaultTTL;

    // Evict if cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: actualTTL
    });

    this.updateAccessOrder(key);
  }

  delete(key: string): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }
}

export class BaseApiClient {
  protected axiosInstance: AxiosInstance;
  protected circuitBreaker: CircuitBreaker;
  protected rateLimiter: RateLimiter;
  protected cache: MemoryCache;
  protected config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker(config.circuitBreakerConfig);
    this.rateLimiter = new RateLimiter(config.rateLimitConfig);
    this.cache = new MemoryCache(config.cacheConfig);

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'TCWatch/1.0',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for API key and rate limiting
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Add API key if provided
        if (this.config.apiKey) {
          if (config.url?.includes('tmdb')) {
            config.params = { ...config.params, api_key: this.config.apiKey };
          } else {
            config.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
          }
        }

        // Check rate limits
        await this.rateLimiter.checkLimit();

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const isRetryable = this.config.retryConfig.retryableStatusCodes.includes(status);

        // Add metadata for retry logic
        error.isRetryable = isRetryable;
        return Promise.reject(error);
      }
    );
  }

  protected async makeRequest<T>(
    config: AxiosRequestConfig,
    cacheKey?: string,
    cacheTTL?: number
  ): Promise<T> {
    // Check cache first
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    return this.circuitBreaker.execute(async () => {
      const result = await this.retryRequest<T>(config);

      // Cache the result
      if (cacheKey && result) {
        this.cache.set(cacheKey, result, cacheTTL);
      }

      return result;
    });
  }

  private async retryRequest<T>(config: AxiosRequestConfig): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        const response: AxiosResponse<T> = await this.axiosInstance.request(config);
        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry on last attempt or non-retryable errors
        if (attempt === this.config.retryConfig.maxRetries || !error.isRetryable) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.config.retryConfig.baseDelay * Math.pow(this.config.retryConfig.backoffMultiplier, attempt),
          this.config.retryConfig.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  protected generateCacheKey(method: string, url: string, params?: any): string {
    const key = `${method}:${url}:${JSON.stringify(params || {})}`;
    return createHash('md5').update(key).digest('hex');
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest({
        method: 'GET',
        url: '/health', // Override in subclasses for actual health endpoints
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  // Get circuit breaker status
  getCircuitBreakerState(): CircuitBreakerState {
    return this.circuitBreaker.getState();
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; enabled: boolean } {
    return {
      size: this.cache['cache'].size,
      enabled: this.config.cacheConfig.enabled
    };
  }
}

// Default configurations for different API types
export const DEFAULT_CONFIGS = {
  FAST_API: {
    timeout: 5000,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: [429, 502, 503, 504, 408]
    },
    circuitBreakerConfig: {
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    },
    rateLimitConfig: {
      requestsPerSecond: 10,
      requestsPerMinute: 100,
      requestsPerHour: 1000
    },
    cacheConfig: {
      enabled: true,
      defaultTTL: 300, // 5 minutes
      maxSize: 1000
    }
  },
  SLOW_API: {
    timeout: 15000,
    retryConfig: {
      maxRetries: 2,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 3,
      retryableStatusCodes: [429, 502, 503, 504, 408]
    },
    circuitBreakerConfig: {
      failureThreshold: 3,
      recoveryTimeout: 60000,
      monitoringPeriod: 120000
    },
    rateLimitConfig: {
      requestsPerSecond: 2,
      requestsPerMinute: 30,
      requestsPerHour: 200
    },
    cacheConfig: {
      enabled: true,
      defaultTTL: 1800, // 30 minutes
      maxSize: 500
    }
  }
};