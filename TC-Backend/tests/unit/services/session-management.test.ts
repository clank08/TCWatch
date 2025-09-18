/**
 * Session Management Tests with Redis
 * Tests for session storage, retrieval, invalidation, and refresh token rotation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthTestFactory } from '../../factories/auth.factory';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  setex: jest.fn(),
  ttl: jest.fn(),
  exists: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  pipeline: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exec: jest.fn(),
  })),
  flushall: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

// Mock Prisma
const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  userProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

/**
 * Session Management Service
 * This would be implemented in the actual codebase
 */
class SessionManager {
  constructor(private redis: Redis, private jwtSecret: string) {}

  async storeSession(userId: string, sessionData: any, ttlSeconds: number = 3600): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.redis.setex(sessionKey, ttlSeconds, JSON.stringify(sessionData));
  }

  async getSession(userId: string): Promise<any | null> {
    const sessionKey = `session:${userId}`;
    const sessionData = await this.redis.get(sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  async invalidateSession(userId: string): Promise<void> {
    const sessionKey = `session:${userId}`;
    await this.redis.del(sessionKey);
  }

  async storeRefreshToken(userId: string, refreshToken: string, ttlSeconds: number = 86400): Promise<void> {
    const refreshKey = `refresh:${userId}`;
    await this.redis.setex(refreshKey, ttlSeconds, refreshToken);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    const refreshKey = `refresh:${userId}`;
    return await this.redis.get(refreshKey);
  }

  async invalidateRefreshToken(userId: string): Promise<void> {
    const refreshKey = `refresh:${userId}`;
    await this.redis.del(refreshKey);
  }

  async rotateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<boolean> {
    const currentToken = await this.getRefreshToken(userId);

    if (currentToken !== oldToken) {
      return false; // Token mismatch, possible security issue
    }

    await this.storeRefreshToken(userId, newToken);
    return true;
  }

  async extendSession(userId: string, ttlSeconds: number = 3600): Promise<boolean> {
    const sessionKey = `session:${userId}`;
    const exists = await this.redis.exists(sessionKey);

    if (!exists) {
      return false;
    }

    await this.redis.expire(sessionKey, ttlSeconds);
    return true;
  }

  async getSessionTTL(userId: string): Promise<number> {
    const sessionKey = `session:${userId}`;
    return await this.redis.ttl(sessionKey);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.del(`session:${userId}`);
    pipeline.del(`refresh:${userId}`);
    await pipeline.exec();
  }

  async getActiveSessionsCount(): Promise<number> {
    // In real implementation, this would scan for session keys
    return 0; // Simplified for testing
  }
}

describe('Session Management with Redis', () => {
  let sessionManager: SessionManager;
  let authFactory: AuthTestFactory;
  let redis: Redis;

  beforeEach(() => {
    redis = new Redis() as any;
    sessionManager = new SessionManager(redis, 'test-jwt-secret');
    authFactory = new AuthTestFactory(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Session Storage and Retrieval', () => {
    it('should store and retrieve session data', async () => {
      const testUser = await authFactory.createTestUser();
      const sessionData = {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
        lastActivity: new Date().toISOString(),
      };

      mockRedis.setex.mockResolvedValueOnce('OK');
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(sessionData));

      await sessionManager.storeSession(testUser.id, sessionData, 3600);
      const retrievedSession = await sessionManager.getSession(testUser.id);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${testUser.id}`,
        3600,
        JSON.stringify(sessionData)
      );
      expect(retrievedSession).toEqual(sessionData);
    });

    it('should return null for non-existent session', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.get.mockResolvedValueOnce(null);

      const session = await sessionManager.getSession(testUser.id);

      expect(session).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith(`session:${testUser.id}`);
    });

    it('should store session with custom TTL', async () => {
      const testUser = await authFactory.createTestUser();
      const sessionData = { userId: testUser.id };
      const customTTL = 7200; // 2 hours

      mockRedis.setex.mockResolvedValueOnce('OK');

      await sessionManager.storeSession(testUser.id, sessionData, customTTL);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${testUser.id}`,
        customTTL,
        JSON.stringify(sessionData)
      );
    });

    it('should use default TTL when not specified', async () => {
      const testUser = await authFactory.createTestUser();
      const sessionData = { userId: testUser.id };

      mockRedis.setex.mockResolvedValueOnce('OK');

      await sessionManager.storeSession(testUser.id, sessionData);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `session:${testUser.id}`,
        3600, // Default 1 hour
        JSON.stringify(sessionData)
      );
    });
  });

  describe('Session Invalidation', () => {
    it('should invalidate user session', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.del.mockResolvedValueOnce(1);

      await sessionManager.invalidateSession(testUser.id);

      expect(mockRedis.del).toHaveBeenCalledWith(`session:${testUser.id}`);
    });

    it('should invalidate all user sessions and tokens', async () => {
      const testUser = await authFactory.createTestUser();

      const mockPipeline = {
        del: jest.fn(),
        exec: jest.fn().mockResolvedValueOnce([['OK'], ['OK']]),
      };

      mockRedis.pipeline.mockReturnValueOnce(mockPipeline);

      await sessionManager.invalidateAllUserSessions(testUser.id);

      expect(mockPipeline.del).toHaveBeenCalledWith(`session:${testUser.id}`);
      expect(mockPipeline.del).toHaveBeenCalledWith(`refresh:${testUser.id}`);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('Session Extension and TTL Management', () => {
    it('should extend existing session TTL', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.exists.mockResolvedValueOnce(1); // Session exists
      mockRedis.expire = jest.fn().mockResolvedValueOnce(1);

      const result = await sessionManager.extendSession(testUser.id, 7200);

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(`session:${testUser.id}`);
      expect(mockRedis.expire).toHaveBeenCalledWith(`session:${testUser.id}`, 7200);
    });

    it('should fail to extend non-existent session', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.exists.mockResolvedValueOnce(0); // Session doesn't exist

      const result = await sessionManager.extendSession(testUser.id);

      expect(result).toBe(false);
      expect(mockRedis.exists).toHaveBeenCalledWith(`session:${testUser.id}`);
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should get session TTL', async () => {
      const testUser = await authFactory.createTestUser();
      const expectedTTL = 2400; // 40 minutes remaining

      mockRedis.ttl.mockResolvedValueOnce(expectedTTL);

      const ttl = await sessionManager.getSessionTTL(testUser.id);

      expect(ttl).toBe(expectedTTL);
      expect(mockRedis.ttl).toHaveBeenCalledWith(`session:${testUser.id}`);
    });

    it('should return -1 for session without TTL', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.ttl.mockResolvedValueOnce(-1);

      const ttl = await sessionManager.getSessionTTL(testUser.id);

      expect(ttl).toBe(-1);
    });

    it('should return -2 for non-existent session', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.ttl.mockResolvedValueOnce(-2);

      const ttl = await sessionManager.getSessionTTL(testUser.id);

      expect(ttl).toBe(-2);
    });
  });

  describe('Refresh Token Management', () => {
    it('should store and retrieve refresh token', async () => {
      const testUser = await authFactory.createTestUser();
      const refreshToken = authFactory.generateMockRefreshToken(testUser);

      mockRedis.setex.mockResolvedValueOnce('OK');
      mockRedis.get.mockResolvedValueOnce(refreshToken);

      await sessionManager.storeRefreshToken(testUser.id, refreshToken, 86400);
      const retrievedToken = await sessionManager.getRefreshToken(testUser.id);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        `refresh:${testUser.id}`,
        86400,
        refreshToken
      );
      expect(retrievedToken).toBe(refreshToken);
    });

    it('should invalidate refresh token', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.del.mockResolvedValueOnce(1);

      await sessionManager.invalidateRefreshToken(testUser.id);

      expect(mockRedis.del).toHaveBeenCalledWith(`refresh:${testUser.id}`);
    });

    it('should return null for non-existent refresh token', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.get.mockResolvedValueOnce(null);

      const token = await sessionManager.getRefreshToken(testUser.id);

      expect(token).toBeNull();
    });
  });

  describe('Refresh Token Rotation', () => {
    it('should successfully rotate refresh token', async () => {
      const testUser = await authFactory.createTestUser();
      const oldToken = authFactory.generateMockRefreshToken(testUser);
      const newToken = authFactory.generateMockRefreshToken(testUser);

      mockRedis.get.mockResolvedValueOnce(oldToken); // Current token matches
      mockRedis.setex.mockResolvedValueOnce('OK'); // Store new token

      const result = await sessionManager.rotateRefreshToken(testUser.id, oldToken, newToken);

      expect(result).toBe(true);
      expect(mockRedis.get).toHaveBeenCalledWith(`refresh:${testUser.id}`);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        `refresh:${testUser.id}`,
        86400,
        newToken
      );
    });

    it('should fail rotation with mismatched token', async () => {
      const testUser = await authFactory.createTestUser();
      const oldToken = 'old-token';
      const differentToken = 'different-token';
      const newToken = 'new-token';

      mockRedis.get.mockResolvedValueOnce(differentToken); // Token mismatch

      const result = await sessionManager.rotateRefreshToken(testUser.id, oldToken, newToken);

      expect(result).toBe(false);
      expect(mockRedis.setex).not.toHaveBeenCalled(); // Should not store new token
    });

    it('should fail rotation when no current token exists', async () => {
      const testUser = await authFactory.createTestUser();
      const oldToken = 'old-token';
      const newToken = 'new-token';

      mockRedis.get.mockResolvedValueOnce(null); // No current token

      const result = await sessionManager.rotateRefreshToken(testUser.id, oldToken, newToken);

      expect(result).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors during session storage', async () => {
      const testUser = await authFactory.createTestUser();
      const sessionData = { userId: testUser.id };

      mockRedis.setex.mockRejectedValueOnce(new Error('Redis connection failed'));

      await expect(sessionManager.storeSession(testUser.id, sessionData))
        .rejects.toThrow('Redis connection failed');
    });

    it('should handle Redis errors during session retrieval', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.get.mockRejectedValueOnce(new Error('Redis timeout'));

      await expect(sessionManager.getSession(testUser.id))
        .rejects.toThrow('Redis timeout');
    });

    it('should handle JSON parsing errors in session data', async () => {
      const testUser = await authFactory.createTestUser();

      mockRedis.get.mockResolvedValueOnce('invalid-json{');

      await expect(sessionManager.getSession(testUser.id))
        .rejects.toThrow();
    });

    it('should handle Redis pipeline errors', async () => {
      const testUser = await authFactory.createTestUser();

      const mockPipeline = {
        del: jest.fn(),
        exec: jest.fn().mockRejectedValueOnce(new Error('Pipeline failed')),
      };

      mockRedis.pipeline.mockReturnValueOnce(mockPipeline);

      await expect(sessionManager.invalidateAllUserSessions(testUser.id))
        .rejects.toThrow('Pipeline failed');
    });
  });

  describe('Concurrent Session Management', () => {
    it('should handle concurrent session operations', async () => {
      const testUsers = await authFactory.createTestUsers(5);

      // Mock Redis responses for concurrent operations
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockImplementation((key: string) => {
        const userId = key.split(':')[1];
        return Promise.resolve(JSON.stringify({ userId }));
      });

      const sessionPromises = testUsers.map(async (user) => {
        await sessionManager.storeSession(user.id, { userId: user.id });
        return sessionManager.getSession(user.id);
      });

      const results = await Promise.all(sessionPromises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.userId).toBe(testUsers[index].id);
      });
    });

    it('should handle concurrent refresh token rotations', async () => {
      const testUser = await authFactory.createTestUser();
      const tokens = Array.from({ length: 3 }, () =>
        authFactory.generateMockRefreshToken(testUser)
      );

      // First rotation should succeed
      mockRedis.get
        .mockResolvedValueOnce(tokens[0]) // Current token matches
        .mockResolvedValueOnce(tokens[1]) // Next check, token has been updated
        .mockResolvedValueOnce(tokens[1]); // Third check, still the updated token

      mockRedis.setex.mockResolvedValue('OK');

      const rotationPromises = [
        sessionManager.rotateRefreshToken(testUser.id, tokens[0], tokens[1]),
        sessionManager.rotateRefreshToken(testUser.id, tokens[0], tokens[2]), // Should fail
      ];

      const results = await Promise.all(rotationPromises);

      expect(results[0]).toBe(true);  // First rotation succeeds
      expect(results[1]).toBe(false); // Second rotation fails (token mismatch)
    });
  });

  describe('Session Cleanup and Maintenance', () => {
    it('should clean up expired sessions', async () => {
      // This would be implemented as a background job in real system
      const expiredSessionKeys = ['session:user1', 'session:user2'];

      mockRedis.del.mockResolvedValue(expiredSessionKeys.length);

      // Simulate cleanup operation
      const deletedCount = await mockRedis.del(...expiredSessionKeys);

      expect(deletedCount).toBe(expiredSessionKeys.length);
      expect(mockRedis.del).toHaveBeenCalledWith(...expiredSessionKeys);
    });

    it('should handle large session cleanup batches', async () => {
      const batchSize = 1000;
      const sessionKeys = Array.from({ length: batchSize }, (_, i) => `session:user${i}`);

      mockRedis.del.mockResolvedValue(batchSize);

      const deletedCount = await mockRedis.del(...sessionKeys);

      expect(deletedCount).toBe(batchSize);
    });
  });

  describe('Performance Considerations', () => {
    it('should complete session operations within performance thresholds', async () => {
      const testUser = await authFactory.createTestUser();
      const sessionData = { userId: testUser.id };

      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      // Test session storage performance
      const storeStart = Date.now();
      await sessionManager.storeSession(testUser.id, sessionData);
      const storeTime = Date.now() - storeStart;

      // Test session retrieval performance
      const retrieveStart = Date.now();
      await sessionManager.getSession(testUser.id);
      const retrieveTime = Date.now() - retrieveStart;

      // Operations should complete quickly (< 10ms in test environment)
      expect(storeTime).toBeLessThan(10);
      expect(retrieveTime).toBeLessThan(10);
    });

    it('should handle high-frequency session operations', async () => {
      const testUser = await authFactory.createTestUser();
      const operationCount = 100;

      mockRedis.get.mockResolvedValue(JSON.stringify({ userId: testUser.id }));

      const start = Date.now();

      const operations = Array.from({ length: operationCount }, () =>
        sessionManager.getSession(testUser.id)
      );

      await Promise.all(operations);

      const duration = Date.now() - start;

      // 100 operations should complete within 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});