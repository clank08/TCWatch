// Comprehensive Authentication Service
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { TRPCError } from '@trpc/server';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface SessionData {
  userId: string;
  email: string;
  role: string;
  refreshToken: string;
  createdAt: Date;
  expiresAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  private supabase: SupabaseClient;
  private prisma: PrismaClient;
  private redis: Redis;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Verify JWT token with Supabase and return user data
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token using Supabase refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens | null> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        return null;
      }

      const session = data.session;
      return {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresIn: session.expires_in || 3600,
        refreshExpiresIn: 30 * 24 * 60 * 60, // 30 days
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Create or update session in Redis
   */
  async createSession(
    userId: string,
    email: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const sessionData: SessionData = {
      userId,
      email,
      role: 'user', // Default role, can be updated based on user metadata
      refreshToken,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      ipAddress,
      userAgent,
    };

    const sessionKey = `session:${sessionId}`;

    // Store session in Redis with expiration
    await this.redis.setex(
      sessionKey,
      30 * 24 * 60 * 60, // 30 days in seconds
      JSON.stringify(sessionData)
    );

    // Store user session reference for cleanup
    const userSessionsKey = `user_sessions:${userId}`;
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, 30 * 24 * 60 * 60);

    return sessionId;
  }

  /**
   * Get session data from Redis
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      const session: SessionData = JSON.parse(sessionData);

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.removeSession(sessionId);
        return null;
      }

      // Update last accessed time
      session.lastAccessedAt = new Date();
      await this.redis.setex(
        sessionKey,
        30 * 24 * 60 * 60,
        JSON.stringify(session)
      );

      return session;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Remove session from Redis
   */
  async removeSession(sessionId: string): Promise<void> {
    try {
      const sessionKey = `session:${sessionId}`;
      const sessionData = await this.redis.get(sessionKey);

      if (sessionData) {
        const session: SessionData = JSON.parse(sessionData);
        const userSessionsKey = `user_sessions:${session.userId}`;
        await this.redis.srem(userSessionsKey, sessionId);
      }

      await this.redis.del(sessionKey);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }

  /**
   * Remove all sessions for a user (logout from all devices)
   */
  async removeAllUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length > 0) {
        const sessionKeys = sessionIds.map(id => `session:${id}`);
        await this.redis.del(...sessionKeys);
        await this.redis.del(userSessionsKey);
      }
    } catch (error) {
      console.error('Failed to remove user sessions:', error);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return [];
      }

      const sessionKeys = sessionIds.map(id => `session:${id}`);
      const sessions = await this.redis.mget(...sessionKeys);

      return sessions
        .filter(session => session !== null)
        .map(session => JSON.parse(session!))
        .filter(session => new Date() <= new Date(session.expiresAt));
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Validate session and return user context
   */
  async validateSession(sessionId: string): Promise<{
    userId: string;
    email: string;
    role: string;
  } | null> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      email: session.email,
      role: session.role,
    };
  }

  /**
   * Register new user with Supabase Auth
   */
  async registerUser(email: string, password: string, metadata?: any): Promise<{
    user: User | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        return { user: null, error: error.message };
      }

      // Create user profile in database
      if (data.user) {
        await this.createUserProfile(data.user.id, {
          displayName: metadata?.display_name || null,
          avatarUrl: metadata?.avatar_url || null,
          interests: metadata?.interests || [],
        });
      }

      return { user: data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Sign in user with Supabase Auth
   */
  async signInUser(email: string, password: string): Promise<{
    session: any | null;
    error: string | null;
  }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { session: null, error: error.message };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
    }
  }

  /**
   * Sign out user
   */
  async signOutUser(accessToken: string): Promise<{ error: string | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      return { error: error?.message || null };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  }

  /**
   * Create user profile in database
   */
  private async createUserProfile(userId: string, profile: {
    displayName?: string | null;
    avatarUrl?: string | null;
    interests?: string[];
  }): Promise<void> {
    try {
      await this.prisma.userProfile.create({
        data: {
          userId,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          interests: profile.interests || [],
          privacySettings: {
            profile_visible: true,
            activity_visible: true,
            allow_friend_requests: true,
          },
          notificationSettings: {
            push_enabled: true,
            email_enabled: true,
            new_content_alerts: true,
            friend_activity: true,
            weekly_digest: true,
            cable_reminders: true,
          },
        },
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
    }
  }

  /**
   * Clean up expired sessions (should be run periodically)
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      // This would typically be implemented as a background job
      // For now, we rely on Redis TTL for session cleanup
      console.log('Session cleanup completed');
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }
}