// Rate Limiting and Security Middleware
import { FastifyRequest, FastifyReply } from 'fastify';
import { TRPCError } from '@trpc/server';
import Redis from 'ioredis';

export interface RateLimitRule {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: FastifyRequest) => string;
}

export interface SecurityOptions {
  enableBruteForceProtection: boolean;
  maxFailedAttempts: number;
  lockoutDuration: number; // in minutes
  enableRateLimiting: boolean;
  rateLimitRules: Record<string, RateLimitRule>;
}

export class RateLimitMiddleware {
  private redis: Redis;
  private options: SecurityOptions;

  constructor(redis: Redis, options: Partial<SecurityOptions> = {}) {
    this.redis = redis;
    this.options = {
      enableBruteForceProtection: true,
      maxFailedAttempts: 5,
      lockoutDuration: 15, // 15 minutes
      enableRateLimiting: true,
      rateLimitRules: {
        // Auth endpoints - stricter limits
        'auth.signIn': {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 5, // 5 login attempts per 15 minutes
          message: 'Too many login attempts, please try again later',
        },
        'auth.signUp': {
          windowMs: 60 * 60 * 1000, // 1 hour
          maxRequests: 3, // 3 signups per hour
          message: 'Too many registration attempts, please try again later',
        },
        'auth.resetPassword': {
          windowMs: 60 * 60 * 1000, // 1 hour
          maxRequests: 3, // 3 password resets per hour
          message: 'Too many password reset attempts, please try again later',
        },
        // API endpoints - moderate limits
        'api.general': {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100, // 100 requests per 15 minutes
          message: 'Rate limit exceeded, please try again later',
        },
        // Upload endpoints - file size dependent
        'upload.avatar': {
          windowMs: 60 * 60 * 1000, // 1 hour
          maxRequests: 10, // 10 uploads per hour
          message: 'Too many upload attempts, please try again later',
        },
      },
      ...options,
    };
  }

  /**
   * General rate limiting middleware
   */
  createRateLimiter(ruleName: string) {
    const rule = this.options.rateLimitRules[ruleName];
    if (!rule) {
      throw new Error(`Rate limit rule '${ruleName}' not found`);
    }

    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!this.options.enableRateLimiting) {
        return;
      }

      try {
        const key = rule.keyGenerator ? rule.keyGenerator(req) : this.generateKey(req, ruleName);
        const windowStart = Math.floor(Date.now() / rule.windowMs) * rule.windowMs;
        const redisKey = `rate_limit:${key}:${windowStart}`;

        // Get current count
        const current = await this.redis.incr(redisKey);

        // Set expiry on first request in window
        if (current === 1) {
          await this.redis.pexpire(redisKey, rule.windowMs);
        }

        // Check if limit exceeded
        if (current > rule.maxRequests) {
          const ttl = await this.redis.pttl(redisKey);
          const retryAfter = Math.ceil(ttl / 1000);

          reply.header('Retry-After', retryAfter.toString());
          reply.header('X-RateLimit-Limit', rule.maxRequests.toString());
          reply.header('X-RateLimit-Remaining', '0');
          reply.header('X-RateLimit-Reset', new Date(windowStart + rule.windowMs).toISOString());

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: rule.message || 'Rate limit exceeded',
          });
        }

        // Add rate limit headers
        reply.header('X-RateLimit-Limit', rule.maxRequests.toString());
        reply.header('X-RateLimit-Remaining', (rule.maxRequests - current).toString());
        reply.header('X-RateLimit-Reset', new Date(windowStart + rule.windowMs).toISOString());

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Rate limiting error:', error);
        // Don't block requests if rate limiting fails
      }
    };
  }

  /**
   * Brute force protection for authentication
   */
  createBruteForceProtection(identifier: 'email' | 'ip' | 'combined' = 'combined') {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      if (!this.options.enableBruteForceProtection) {
        return;
      }

      try {
        const keys = this.generateBruteForceKeys(req, identifier);
        const lockStatus = await this.checkBruteForceLock(keys);

        if (lockStatus.locked) {
          reply.header('Retry-After', lockStatus.retryAfter.toString());

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Account temporarily locked due to too many failed attempts. Try again in ${lockStatus.retryAfter} seconds.`,
          });
        }

        // Add attempt count headers for monitoring
        reply.header('X-Auth-Attempts-Remaining', lockStatus.attemptsRemaining.toString());

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('Brute force protection error:', error);
        // Don't block requests if protection fails
      }
    };
  }

  /**
   * Record failed authentication attempt
   */
  async recordFailedAttempt(req: FastifyRequest, email?: string): Promise<void> {
    if (!this.options.enableBruteForceProtection) {
      return;
    }

    try {
      const keys = this.generateBruteForceKeys(req, 'combined', email);
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.incr(key);
        pipeline.expire(key, this.options.lockoutDuration * 60); // Convert to seconds
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
    }
  }

  /**
   * Clear failed attempts after successful authentication
   */
  async clearFailedAttempts(req: FastifyRequest, email?: string): Promise<void> {
    if (!this.options.enableBruteForceProtection) {
      return;
    }

    try {
      const keys = this.generateBruteForceKeys(req, 'combined', email);
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.del(key);
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Failed to clear failed attempts:', error);
    }
  }

  /**
   * IP-based rate limiting
   */
  createIPRateLimit(windowMs: number = 15 * 60 * 1000, maxRequests: number = 1000) {
    return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        const ip = this.getClientIP(req);
        const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
        const key = `ip_rate_limit:${ip}:${windowStart}`;

        const current = await this.redis.incr(key);

        if (current === 1) {
          await this.redis.pexpire(key, windowMs);
        }

        if (current > maxRequests) {
          const ttl = await this.redis.pttl(key);
          const retryAfter = Math.ceil(ttl / 1000);

          reply.header('Retry-After', retryAfter.toString());

          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'IP rate limit exceeded',
          });
        }

        reply.header('X-RateLimit-IP-Limit', maxRequests.toString());
        reply.header('X-RateLimit-IP-Remaining', (maxRequests - current).toString());

      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error('IP rate limiting error:', error);
      }
    };
  }

  /**
   * Suspicious activity detection
   */
  async detectSuspiciousActivity(req: FastifyRequest): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    const reasons: string[] = [];
    let riskScore = 0;

    try {
      const ip = this.getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';

      // Check for rapid requests from same IP
      const rapidRequestsKey = `rapid_requests:${ip}:${Math.floor(Date.now() / 60000)}`;
      const rapidRequests = await this.redis.incr(rapidRequestsKey);
      await this.redis.expire(rapidRequestsKey, 60);

      if (rapidRequests > 60) { // More than 1 request per second on average
        reasons.push('Rapid requests from IP');
        riskScore += 30;
      }

      // Check for suspicious user agents
      if (!userAgent || userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.length < 10) {
        reasons.push('Suspicious user agent');
        riskScore += 25;
      }

      // Check for geographic anomalies (would need GeoIP service)
      // This is a placeholder for geographic-based detection

      // Check for password spraying patterns
      const passwordSprayKey = `password_spray:${ip}:${Math.floor(Date.now() / (15 * 60 * 1000))}`;
      const uniqueEmailsKey = `${passwordSprayKey}:emails`;

      if (req.body && typeof req.body === 'object' && 'email' in req.body) {
        await this.redis.sadd(uniqueEmailsKey, (req.body as any).email);
        await this.redis.expire(uniqueEmailsKey, 15 * 60);

        const uniqueEmails = await this.redis.scard(uniqueEmailsKey);
        if (uniqueEmails > 10) { // More than 10 different emails from same IP in 15 minutes
          reasons.push('Password spraying pattern detected');
          riskScore += 50;
        }
      }

      return {
        suspicious: riskScore >= 50,
        reasons,
        riskScore,
      };

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      return {
        suspicious: false,
        reasons: [],
        riskScore: 0,
      };
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(req: FastifyRequest, ruleName: string): string {
    const ip = this.getClientIP(req);
    const userId = (req as any).user?.id || 'anonymous';
    return `${ruleName}:${ip}:${userId}`;
  }

  /**
   * Generate brute force protection keys
   */
  private generateBruteForceKeys(
    req: FastifyRequest,
    identifier: 'email' | 'ip' | 'combined',
    email?: string
  ): string[] {
    const ip = this.getClientIP(req);
    const keys: string[] = [];

    if (identifier === 'ip' || identifier === 'combined') {
      keys.push(`brute_force:ip:${ip}`);
    }

    if ((identifier === 'email' || identifier === 'combined') && email) {
      keys.push(`brute_force:email:${email}`);
    }

    return keys;
  }

  /**
   * Check if IP/email is locked due to brute force attempts
   */
  private async checkBruteForceLock(keys: string[]): Promise<{
    locked: boolean;
    attemptsRemaining: number;
    retryAfter: number;
  }> {
    try {
      const pipeline = this.redis.pipeline();

      for (const key of keys) {
        pipeline.get(key);
        pipeline.ttl(key);
      }

      const results = await pipeline.exec();

      let maxAttempts = 0;
      let maxTTL = 0;

      for (let i = 0; i < results!.length; i += 2) {
        const countResult = results![i];
        const ttlResult = results![i + 1];

        if (countResult && countResult[1]) {
          const count = parseInt(countResult[1] as string);
          maxAttempts = Math.max(maxAttempts, count);
        }

        if (ttlResult && ttlResult[1]) {
          const ttl = parseInt(ttlResult[1] as string);
          maxTTL = Math.max(maxTTL, ttl);
        }
      }

      const locked = maxAttempts >= this.options.maxFailedAttempts;
      const attemptsRemaining = Math.max(0, this.options.maxFailedAttempts - maxAttempts);

      return {
        locked,
        attemptsRemaining,
        retryAfter: locked ? maxTTL : 0,
      };

    } catch (error) {
      console.error('Error checking brute force lock:', error);
      return {
        locked: false,
        attemptsRemaining: this.options.maxFailedAttempts,
        retryAfter: 0,
      };
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: FastifyRequest): string {
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown'
    ) as string;
  }

  /**
   * Get rate limiting stats for monitoring
   */
  async getStats(): Promise<{
    totalBlocked: number;
    activeRules: string[];
    topBlockedIPs: Array<{ ip: string; count: number }>;
  }> {
    try {
      const keys = await this.redis.keys('rate_limit:*');
      const bruteForceKeys = await this.redis.keys('brute_force:*');

      const pipeline = this.redis.pipeline();
      for (const key of bruteForceKeys) {
        pipeline.get(key);
      }

      const results = await pipeline.exec();
      const topBlockedIPs: Array<{ ip: string; count: number }> = [];

      if (results) {
        for (let i = 0; i < bruteForceKeys.length; i++) {
          const result = results[i];
          if (result && result[1]) {
            const key = bruteForceKeys[i];
            const ip = key.split(':').pop() || 'unknown';
            const count = parseInt(result[1] as string);

            if (count >= this.options.maxFailedAttempts) {
              topBlockedIPs.push({ ip, count });
            }
          }
        }
      }

      // Sort by count descending
      topBlockedIPs.sort((a, b) => b.count - a.count);

      return {
        totalBlocked: topBlockedIPs.length,
        activeRules: Object.keys(this.options.rateLimitRules),
        topBlockedIPs: topBlockedIPs.slice(0, 10), // Top 10
      };

    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return {
        totalBlocked: 0,
        activeRules: [],
        topBlockedIPs: [],
      };
    }
  }
}