// Redis Session Management Service
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { TRPCError } from '@trpc/server';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
  lastAccessedAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface SessionInfo {
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  isCurrent?: boolean;
}

export class SessionService {
  private redis: Redis;
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly FAILED_ATTEMPTS_PREFIX = 'failed_auth:';
  private readonly SESSION_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly MAX_SESSIONS_PER_USER = 10; // Limit concurrent sessions

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Create a new session
   */
  async createSession(
    userId: string,
    email: string,
    role: string,
    refreshToken: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const sessionId = crypto.randomUUID();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.SESSION_DURATION * 1000);

      const sessionData: SessionData = {
        userId,
        email,
        role,
        refreshToken,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastAccessedAt: now.toISOString(),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
        metadata: options.metadata,
      };

      // Clean up old sessions before creating new one
      await this.cleanupUserSessions(userId);

      // Store session data
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.setex(
        sessionKey,
        this.SESSION_DURATION,
        JSON.stringify(sessionData)
      );

      // Add session to user's session set
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      await this.redis.sadd(userSessionsKey, sessionId);
      await this.redis.expire(userSessionsKey, this.SESSION_DURATION);

      // Store session metadata for easier querying
      const sessionMetaKey = `${this.SESSION_PREFIX}meta:${sessionId}`;
      await this.redis.setex(
        sessionMetaKey,
        this.SESSION_DURATION,
        JSON.stringify({
          userId,
          createdAt: now.toISOString(),
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
        })
      );

      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create session',
      });
    }
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionJson = await this.redis.get(sessionKey);

      if (!sessionJson) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionJson);

      // Check if session has expired
      const now = new Date();
      const expiresAt = new Date(sessionData.expiresAt);

      if (now > expiresAt) {
        await this.deleteSession(sessionId);
        return null;
      }

      // Update last accessed time
      sessionData.lastAccessedAt = now.toISOString();
      await this.redis.setex(
        sessionKey,
        this.SESSION_DURATION,
        JSON.stringify(sessionData)
      );

      return sessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return false;
      }

      const updatedData = {
        ...sessionData,
        ...updates,
        lastAccessedAt: new Date().toISOString(),
      };

      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redis.setex(
        sessionKey,
        this.SESSION_DURATION,
        JSON.stringify(updatedData)
      );

      return true;
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Delete a specific session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionMetaKey = `${this.SESSION_PREFIX}meta:${sessionId}`;

      // Get session data to find user ID
      const sessionJson = await this.redis.get(sessionKey);
      if (sessionJson) {
        const sessionData: SessionData = JSON.parse(sessionJson);
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;
        await this.redis.srem(userSessionsKey, sessionId);
      }

      // Delete session and metadata
      const pipeline = this.redis.pipeline();
      pipeline.del(sessionKey);
      pipeline.del(sessionMetaKey);
      await pipeline.exec();

      return true;
    } catch (error) {
      console.error('Failed to delete session:', error);
      return false;
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteAllUserSessions(userId: string): Promise<number> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return 0;
      }

      const pipeline = this.redis.pipeline();

      // Delete all session data and metadata
      for (const sessionId of sessionIds) {
        pipeline.del(`${this.SESSION_PREFIX}${sessionId}`);
        pipeline.del(`${this.SESSION_PREFIX}meta:${sessionId}`);
      }

      // Delete the user sessions set
      pipeline.del(userSessionsKey);

      await pipeline.exec();

      return sessionIds.length;
    } catch (error) {
      console.error('Failed to delete user sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return [];
      }

      const sessions: SessionInfo[] = [];
      const pipeline = this.redis.pipeline();

      for (const sessionId of sessionIds) {
        pipeline.get(`${this.SESSION_PREFIX}meta:${sessionId}`);
      }

      const results = await pipeline.exec();

      for (let i = 0; i < sessionIds.length; i++) {
        const result = results?.[i];
        if (result && result[1]) {
          const metadata = JSON.parse(result[1] as string);
          sessions.push({
            sessionId: sessionIds[i],
            createdAt: new Date(metadata.createdAt),
            lastAccessedAt: new Date(metadata.createdAt), // Will be updated with actual data
            expiresAt: new Date(Date.now() + this.SESSION_DURATION * 1000),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            isCurrent: sessionIds[i] === currentSessionId,
          });
        }
      }

      return sessions.sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime());
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Validate session and get user info
   */
  async validateSession(sessionId: string): Promise<{
    userId: string;
    email: string;
    role: string;
  } | null> {
    const sessionData = await this.getSession(sessionId);

    if (!sessionData) {
      return null;
    }

    return {
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
    };
  }

  /**
   * Clean up expired sessions for a user (keep only the most recent ones)
   */
  private async cleanupUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length <= this.MAX_SESSIONS_PER_USER) {
        return;
      }

      // Get session metadata to determine which to keep
      const sessionMetadata: Array<{ sessionId: string; createdAt: Date }> = [];
      const pipeline = this.redis.pipeline();

      for (const sessionId of sessionIds) {
        pipeline.get(`${this.SESSION_PREFIX}meta:${sessionId}`);
      }

      const results = await pipeline.exec();

      for (let i = 0; i < sessionIds.length; i++) {
        const result = results?.[i];
        if (result && result[1]) {
          const metadata = JSON.parse(result[1] as string);
          sessionMetadata.push({
            sessionId: sessionIds[i],
            createdAt: new Date(metadata.createdAt),
          });
        }
      }

      // Sort by creation date (newest first) and keep only the most recent sessions
      sessionMetadata.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const sessionsToDelete = sessionMetadata.slice(this.MAX_SESSIONS_PER_USER);

      // Delete old sessions
      for (const session of sessionsToDelete) {
        await this.deleteSession(session.sessionId);
      }
    } catch (error) {
      console.error('Failed to cleanup user sessions:', error);
    }
  }

  /**
   * Record failed authentication attempt
   */
  async recordFailedAttempt(identifier: string, ipAddress?: string): Promise<void> {
    try {
      const key = `${this.FAILED_ATTEMPTS_PREFIX}${identifier}`;
      const attempts = await this.redis.incr(key);

      if (attempts === 1) {
        // Set expiry on first attempt (15 minutes)
        await this.redis.expire(key, 15 * 60);
      }

      // Also track by IP if provided
      if (ipAddress) {
        const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
        const ipAttempts = await this.redis.incr(ipKey);

        if (ipAttempts === 1) {
          await this.redis.expire(ipKey, 15 * 60);
        }
      }
    } catch (error) {
      console.error('Failed to record failed attempt:', error);
    }
  }

  /**
   * Check if account/IP is temporarily locked due to failed attempts
   */
  async isLocked(identifier: string, ipAddress?: string): Promise<{
    locked: boolean;
    attemptsLeft: number;
    lockUntil?: Date;
  }> {
    try {
      const MAX_ATTEMPTS = 5;
      const key = `${this.FAILED_ATTEMPTS_PREFIX}${identifier}`;

      const attempts = await this.redis.get(key);
      const attemptCount = attempts ? parseInt(attempts) : 0;

      // Check IP-based locking if provided
      if (ipAddress) {
        const ipKey = `${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`;
        const ipAttempts = await this.redis.get(ipKey);
        const ipAttemptCount = ipAttempts ? parseInt(ipAttempts) : 0;

        if (ipAttemptCount >= MAX_ATTEMPTS) {
          const ttl = await this.redis.ttl(ipKey);
          return {
            locked: true,
            attemptsLeft: 0,
            lockUntil: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined,
          };
        }
      }

      const locked = attemptCount >= MAX_ATTEMPTS;
      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attemptCount);

      if (locked) {
        const ttl = await this.redis.ttl(key);
        return {
          locked: true,
          attemptsLeft: 0,
          lockUntil: ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined,
        };
      }

      return {
        locked: false,
        attemptsLeft,
      };
    } catch (error) {
      console.error('Failed to check lock status:', error);
      return { locked: false, attemptsLeft: 5 };
    }
  }

  /**
   * Clear failed attempts (called on successful authentication)
   */
  async clearFailedAttempts(identifier: string, ipAddress?: string): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      pipeline.del(`${this.FAILED_ATTEMPTS_PREFIX}${identifier}`);

      if (ipAddress) {
        pipeline.del(`${this.FAILED_ATTEMPTS_PREFIX}ip:${ipAddress}`);
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Failed to clear failed attempts:', error);
    }
  }

  /**
   * Get session statistics for monitoring
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    totalUsers: number;
  }> {
    try {
      const sessionKeys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
      const userSessionKeys = await this.redis.keys(`${this.USER_SESSIONS_PREFIX}*`);

      return {
        totalSessions: sessionKeys.length,
        totalUsers: userSessionKeys.length,
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return { totalSessions: 0, totalUsers: 0 };
    }
  }
}