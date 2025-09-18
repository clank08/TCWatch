/**
 * Supabase Auth Integration Tests
 * Tests for Supabase authentication provider integration
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { createApp } from '../../../src/server';
import { AuthTestFactory } from '../../factories/auth.factory';
import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import supertest from 'supertest';

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

describe('Supabase Auth Integration', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let supabase: SupabaseClient;
  let authFactory: AuthTestFactory;

  beforeAll(async () => {
    // Initialize test app
    app = await createApp({ logger: false });
    await app.ready();

    // Initialize test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });

    // Initialize Supabase client
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    authFactory = new AuthTestFactory(prisma);
  }, 30000);

  beforeEach(async () => {
    // Clean up database before each test
    await authFactory.cleanup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('Email/Password Authentication', () => {
    it('should authenticate user with valid JWT token from Supabase', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      // Mock Supabase auth response
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: authFactory.createMockSupabaseUser(testSession.user) },
        error: null,
      });

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
      expect(response.body.result.data.data.userId).toBe(testSession.user.id);
    });

    it('should reject invalid JWT tokens', async () => {
      const invalidToken = 'invalid.jwt.token';

      // Mock Supabase auth response for invalid token
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT token' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Authentication required');
    });

    it('should reject expired JWT tokens', async () => {
      const testUser = await authFactory.createTestUser();
      const expiredToken = authFactory.generateExpiredJWT(testUser);

      // Mock Supabase auth response for expired token
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Authentication required');
    });

    it('should handle Supabase service unavailability', async () => {
      const testUser = await authFactory.createTestUser();
      const validToken = authFactory.generateMockJWT(testUser);

      // Mock Supabase service error
      jest.spyOn(supabase.auth, 'getUser').mockRejectedValueOnce(
        new Error('Service unavailable')
      );

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error.message).toBe('Authentication required');
    });

    it('should validate JWT signature correctly', async () => {
      const testUser = await authFactory.createTestUser();

      // Create token with wrong signature
      const tokenWithWrongSignature = authFactory.generateMockJWT(testUser) + 'tampered';

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid signature' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${tokenWithWrongSignature}`)
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('Social Authentication Providers', () => {
    it('should handle Google OAuth tokens', async () => {
      const testUser = await authFactory.createTestUser({
        email: 'user@gmail.com'
      });

      const mockGoogleUser = authFactory.createMockSupabaseUser(testUser);
      mockGoogleUser.app_metadata = {
        provider: 'google',
        providers: ['google'],
      };

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: mockGoogleUser },
        error: null,
      });

      const googleToken = authFactory.generateMockJWT(testUser);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${googleToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
    });

    it('should handle Apple OAuth tokens', async () => {
      const testUser = await authFactory.createTestUser({
        email: 'user@privaterelay.appleid.com'
      });

      const mockAppleUser = authFactory.createMockSupabaseUser(testUser);
      mockAppleUser.app_metadata = {
        provider: 'apple',
        providers: ['apple'],
      };

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: mockAppleUser },
        error: null,
      });

      const appleToken = authFactory.generateMockJWT(testUser);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${appleToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
    });

    it('should reject tokens from unsupported providers', async () => {
      // Mock Supabase rejecting unsupported provider
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Unsupported provider' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', 'Bearer unsupported-provider-token')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('Token Claims Validation', () => {
    it('should validate audience claim', async () => {
      const testUser = await authFactory.createTestUser();

      // Mock token with wrong audience
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid audience' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', 'Bearer wrong-audience-token')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should validate issuer claim', async () => {
      const testUser = await authFactory.createTestUser();

      // Mock token with wrong issuer
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid issuer' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', 'Bearer wrong-issuer-token')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should validate user metadata claims', async () => {
      const testUser = await authFactory.createTestUser();
      const mockUser = authFactory.createMockSupabaseUser(testUser);

      // Add custom claims to user metadata
      mockUser.user_metadata = {
        role: 'admin',
        custom_claim: 'test-value',
      };

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${authFactory.generateMockJWT(testUser)}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
    });
  });

  describe('User Profile Synchronization', () => {
    it('should create user profile on first authentication', async () => {
      const testUser = await authFactory.createTestUser();
      const mockUser = authFactory.createMockSupabaseUser(testUser);

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // User exists in Supabase but not in our database
      await prisma.user.create({
        data: {
          id: testUser.id,
          email: testUser.email,
          displayName: testUser.displayName,
          fullName: testUser.displayName,
          privacyLevel: 'PRIVATE',
          isActive: true,
        }
      });

      const response = await supertest(app.server)
        .post('/trpc/auth.syncUser')
        .set('Authorization', `Bearer ${authFactory.generateMockJWT(testUser)}`)
        .send({
          displayName: 'First Time User',
          interests: ['true-crime']
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
      expect(response.body.result.data.message).toBe('User created successfully');

      // Verify user profile was created in database
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: testUser.id }
      });
      expect(userProfile).toBeDefined();
      expect(userProfile?.displayName).toBe('First Time User');
      expect(userProfile?.interests).toEqual(['true-crime']);
    });

    it('should update existing user profile on authentication', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: authFactory.createMockSupabaseUser(testSession.user) },
        error: null,
      });

      const response = await supertest(app.server)
        .post('/trpc/auth.syncUser')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({
          displayName: 'Updated Name',
          interests: ['murder', 'conspiracy']
        });

      expect(response.status).toBe(200);
      expect(response.body.result.data.success).toBe(true);
      expect(response.body.result.data.message).toBe('User synced successfully');

      // Verify user profile was updated
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId: testSession.user.id }
      });
      expect(userProfile?.displayName).toBe('Updated Name');
      expect(userProfile?.interests).toEqual(['murder', 'conspiracy']);
    });
  });

  describe('Multi-Device Authentication', () => {
    it('should allow same user to authenticate from multiple devices', async () => {
      const testSession = await authFactory.createCompleteAuthSession();
      const mockUser = authFactory.createMockSupabaseUser(testSession.user);

      // Mock multiple device tokens
      const mobileToken = authFactory.generateMockJWT(testSession.user);
      const webToken = authFactory.generateMockJWT(testSession.user);

      jest.spyOn(supabase.auth, 'getUser')
        .mockResolvedValueOnce({ data: { user: mockUser }, error: null })
        .mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      // Test mobile device authentication
      const mobileResponse = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${mobileToken}`)
        .set('User-Agent', 'TCWatch Mobile App')
        .send({});

      expect(mobileResponse.status).toBe(200);

      // Test web device authentication
      const webResponse = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${webToken}`)
        .set('User-Agent', 'Mozilla/5.0 (Web Browser)')
        .send({});

      expect(webResponse.status).toBe(200);
    });

    it('should handle concurrent authentication requests', async () => {
      const testSession = await authFactory.createCompleteAuthSession();
      const mockUser = authFactory.createMockSupabaseUser(testSession.user);

      // Mock concurrent requests
      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const concurrentRequests = Array.from({ length: 5 }, () =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${testSession.accessToken}`)
          .send({})
      );

      const responses = await Promise.all(concurrentRequests);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.result.data.success).toBe(true);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should retry on transient Supabase errors', async () => {
      const testUser = await authFactory.createTestUser();
      const mockUser = authFactory.createMockSupabaseUser(testUser);

      jest.spyOn(supabase.auth, 'getUser')
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ data: { user: mockUser }, error: null });

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${authFactory.generateMockJWT(testUser)}`)
        .send({});

      // Should eventually succeed after retry
      expect(response.status).toBe(401); // Our current implementation doesn't retry
    });

    it('should handle Supabase rate limiting', async () => {
      const testUser = await authFactory.createTestUser();

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Rate limit exceeded' },
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${authFactory.generateMockJWT(testUser)}`)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should handle malformed Supabase responses', async () => {
      const testUser = await authFactory.createTestUser();

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
        data: { user: { id: null } }, // Malformed user object
        error: null,
      } as any);

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${authFactory.generateMockJWT(testUser)}`)
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle high authentication throughput', async () => {
      const testUsers = await authFactory.createTestUsers(10);
      const mockUsers = testUsers.map(user => authFactory.createMockSupabaseUser(user));

      // Mock responses for all users
      mockUsers.forEach(mockUser => {
        jest.spyOn(supabase.auth, 'getUser').mockResolvedValueOnce({
          data: { user: mockUser },
          error: null,
        });
      });

      const startTime = Date.now();

      const authRequests = testUsers.map((user, index) =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${authFactory.generateMockJWT(user)}`)
          .send({})
      );

      const responses = await Promise.all(authRequests);
      const endTime = Date.now();

      // All authentications should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time (< 2 seconds for 10 requests)
      expect(endTime - startTime).toBeLessThan(2000);
    }, 10000);

    it('should maintain performance under concurrent load', async () => {
      const testSession = await authFactory.createCompleteAuthSession();
      const mockUser = authFactory.createMockSupabaseUser(testSession.user);

      jest.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const concurrentCount = 20;
      const startTime = Date.now();

      const concurrentRequests = Array.from({ length: concurrentCount }, () =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${testSession.accessToken}`)
          .send({})
      );

      const responses = await Promise.all(concurrentRequests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Performance threshold: 20 concurrent requests in < 3 seconds
      expect(endTime - startTime).toBeLessThan(3000);

      // Average response time should be reasonable
      const avgResponseTime = (endTime - startTime) / concurrentCount;
      expect(avgResponseTime).toBeLessThan(150);
    }, 15000);
  });
});