/**
 * Authentication Performance Tests
 * Tests for auth endpoint response times, throughput, and load handling
 */

import { describe, it, expect, jest, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import supertest from 'supertest';
import { createApp } from '../../src/server';
import { AuthTestFactory } from '../factories/auth.factory';
import { PrismaClient } from '@prisma/client';

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  AUTH_RESPONSE_TIME: 200,        // 200ms for auth endpoints
  JWT_VALIDATION_TIME: 50,        // 50ms for JWT validation
  SESSION_LOOKUP_TIME: 30,        // 30ms for session lookup
  CONCURRENT_USERS: 100,          // Support 100 concurrent users
  REQUESTS_PER_SECOND: 50,        // 50 RPS per endpoint
  DATABASE_QUERY_TIME: 100,       // 100ms for database queries
  MEMORY_USAGE_MB: 512,           // 512MB memory limit
};

// Test data generators
class PerformanceTestData {
  static generateTestUsers(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      email: `user${i}@tcwatch.test`,
      password: 'TestPassword123!',
      displayName: `Test User ${i}`,
    }));
  }

  static generateConcurrentRequests(count: number, requestFn: () => Promise<any>) {
    return Array.from({ length: count }, () => requestFn());
  }
}

describe('Authentication Performance Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let authFactory: AuthTestFactory;

  beforeAll(async () => {
    app = await createApp({
      logger: false,
      // Optimize for performance testing
      disableRequestLogging: true,
    });
    await app.ready();

    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });

    authFactory = new AuthTestFactory(prisma);
  }, 30000);

  beforeEach(async () => {
    await authFactory.cleanup();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('Single Request Performance', () => {
    it('should authenticate user within 200ms', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      const startTime = Date.now();

      const response = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({});

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME);
    });

    it('should validate JWT token within 50ms', async () => {
      const testUser = await authFactory.createTestUser();
      const token = authFactory.generateMockJWT(testUser);

      const startTime = Date.now();

      // Test JWT validation performance by making multiple rapid requests
      const requests = Array.from({ length: 10 }, () =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${token}`)
          .send({})
      );

      await Promise.all(requests);

      const endTime = Date.now();
      const avgResponseTime = (endTime - startTime) / 10;

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.JWT_VALIDATION_TIME);
    });

    it('should handle profile updates within threshold', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      const startTime = Date.now();

      const response = await supertest(app.server)
        .post('/trpc/auth.updateProfile')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({
          displayName: 'Updated Name',
          interests: ['true-crime', 'documentaries'],
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME);
    });

    it('should handle user stats query efficiently', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      const startTime = Date.now();

      const response = await supertest(app.server)
        .post('/trpc/auth.getStats')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({});

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME);
    });
  });

  describe('Concurrent User Performance', () => {
    it('should handle 50 concurrent authentication requests', async () => {
      const testUsers = await Promise.all(
        Array.from({ length: 50 }, () => authFactory.createCompleteAuthSession())
      );

      const startTime = Date.now();

      const concurrentRequests = testUsers.map(session =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${session.accessToken}`)
          .send({})
      );

      const responses = await Promise.all(concurrentRequests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time should be reasonable for 50 concurrent requests
      expect(totalTime).toBeLessThan(5000); // 5 seconds max

      // Average response time should be acceptable
      const avgResponseTime = totalTime / 50;
      expect(avgResponseTime).toBeLessThan(100);
    }, 15000);

    it('should handle 100 concurrent profile updates', async () => {
      const testUsers = await Promise.all(
        Array.from({ length: 20 }, () => authFactory.createCompleteAuthSession())
      );

      const startTime = Date.now();

      // Create 100 requests (5 per user)
      const concurrentRequests: Promise<any>[] = [];

      for (let i = 0; i < 100; i++) {
        const session = testUsers[i % testUsers.length];
        concurrentRequests.push(
          supertest(app.server)
            .post('/trpc/auth.updateProfile')
            .set('Authorization', `Bearer ${session.accessToken}`)
            .send({
              displayName: `Updated Name ${i}`,
            })
        );
      }

      const responses = await Promise.all(concurrentRequests);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Most requests should succeed (some may be rate limited)
      const successfulResponses = responses.filter(r => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(80); // At least 80% success

      // Performance should be reasonable
      expect(totalTime).toBeLessThan(10000); // 10 seconds max
    }, 20000);

    it('should maintain performance under sustained load', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      const requestCount = 100;
      const batchSize = 10;
      const batchCount = requestCount / batchSize;

      const batchTimes: number[] = [];

      for (let batch = 0; batch < batchCount; batch++) {
        const batchStart = Date.now();

        const batchRequests = Array.from({ length: batchSize }, () =>
          supertest(app.server)
            .post('/trpc/auth.me')
            .set('Authorization', `Bearer ${testSession.accessToken}`)
            .send({})
        );

        const responses = await Promise.all(batchRequests);

        const batchEnd = Date.now();
        const batchTime = batchEnd - batchStart;
        batchTimes.push(batchTime);

        // All requests in batch should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });

        // Small delay between batches to simulate realistic load
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Performance should not degrade significantly over time
      const firstBatchAvg = batchTimes.slice(0, 3).reduce((a, b) => a + b) / 3;
      const lastBatchAvg = batchTimes.slice(-3).reduce((a, b) => a + b) / 3;
      const degradation = (lastBatchAvg - firstBatchAvg) / firstBatchAvg;

      expect(degradation).toBeLessThan(0.5); // Less than 50% degradation
    }, 30000);
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without significant performance impact', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      // Make requests at the rate limit threshold
      const rapidRequests = Array.from({ length: 60 }, (_, i) => async () => {
        await new Promise(resolve => setTimeout(resolve, i * 10)); // Spread over 600ms

        const startTime = Date.now();

        const response = await supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${testSession.accessToken}`)
          .send({});

        const endTime = Date.now();

        return {
          status: response.status,
          responseTime: endTime - startTime,
        };
      });

      const results = await Promise.all(rapidRequests.map(fn => fn()));

      // Check that rate limiting doesn't add excessive overhead
      const successfulRequests = results.filter(r => r.status === 200);
      const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME * 1.5);
    }, 15000);

    it('should handle rate limit exceeded scenarios efficiently', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      // Flood with requests to trigger rate limiting
      const floodRequests = Array.from({ length: 200 }, () =>
        supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${testSession.accessToken}`)
          .send({})
      );

      const startTime = Date.now();
      const responses = await Promise.all(floodRequests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limiting should not cause excessive delays
      const avgTimePerRequest = totalTime / responses.length;
      expect(avgTimePerRequest).toBeLessThan(100); // 100ms avg per request max
    }, 15000);
  });

  describe('Memory Usage Performance', () => {
    it('should not leak memory during sustained authentication', async () => {
      const initialMemory = process.memoryUsage();
      const testSessions = await Promise.all(
        Array.from({ length: 50 }, () => authFactory.createCompleteAuthSession())
      );

      // Perform many authentication operations
      for (let round = 0; round < 10; round++) {
        const roundRequests = testSessions.map(session =>
          supertest(app.server)
            .post('/trpc/auth.me')
            .set('Authorization', `Bearer ${session.accessToken}`)
            .send({})
        );

        await Promise.all(roundRequests);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);

    it('should handle large payload efficiently', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      // Create large but valid update payload
      const largeInterests = Array.from({ length: 100 }, (_, i) => `interest-${i}`);

      const startTime = Date.now();

      const response = await supertest(app.server)
        .post('/trpc/auth.updateProfile')
        .set('Authorization', `Bearer ${testSession.accessToken}`)
        .send({
          interests: largeInterests,
          displayName: 'User with many interests',
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME * 2);
    });
  });

  describe('Database Performance', () => {
    it('should handle user lookups efficiently', async () => {
      // Create many users to test database performance
      const userCount = 1000;
      const testUsers = await Promise.all(
        Array.from({ length: userCount }, async (_, i) => {
          const user = await authFactory.createTestUser({
            email: `dbtest${i}@tcwatch.test`,
          });
          return await authFactory.createTestUserProfile(user.id);
        })
      );

      // Test random user lookups
      const lookupTests = Array.from({ length: 50 }, () => {
        const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)];
        const token = authFactory.generateMockJWT({
          id: randomUser.userId,
          email: `dbtest@tcwatch.test`,
          role: 'user',
        });

        return supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${token}`)
          .send({});
      });

      const startTime = Date.now();
      const responses = await Promise.all(lookupTests);
      const endTime = Date.now();

      const avgResponseTime = (endTime - startTime) / lookupTests.length;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME);
    }, 60000);

    it('should handle concurrent database writes efficiently', async () => {
      const testSessions = await Promise.all(
        Array.from({ length: 20 }, () => authFactory.createCompleteAuthSession())
      );

      const concurrentUpdates = testSessions.map((session, index) =>
        supertest(app.server)
          .post('/trpc/auth.updateProfile')
          .set('Authorization', `Bearer ${session.accessToken}`)
          .send({
            displayName: `Concurrent User ${index}`,
            interests: [`interest-${index}`],
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(concurrentUpdates);
      const endTime = Date.now();

      const avgResponseTime = (endTime - startTime) / responses.length;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.DATABASE_QUERY_TIME);
    }, 15000);
  });

  describe('Stress Testing', () => {
    it('should handle authentication stress test', async () => {
      const stressTestUsers = await Promise.all(
        Array.from({ length: 100 }, () => authFactory.createCompleteAuthSession())
      );

      const stressTestRounds = 5;
      const results: number[] = [];

      for (let round = 0; round < stressTestRounds; round++) {
        const roundStart = Date.now();

        const roundRequests = stressTestUsers.map(session =>
          supertest(app.server)
            .post('/trpc/auth.me')
            .set('Authorization', `Bearer ${session.accessToken}`)
            .send({})
        );

        const responses = await Promise.all(roundRequests);
        const roundEnd = Date.now();

        const roundTime = roundEnd - roundStart;
        results.push(roundTime);

        // All requests should succeed
        const successCount = responses.filter(r => r.status === 200).length;
        expect(successCount).toBeGreaterThan(95); // At least 95% success rate

        // Small delay between rounds
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Performance should remain consistent across rounds
      const avgTime = results.reduce((a, b) => a + b) / results.length;
      const maxTime = Math.max(...results);
      const variance = maxTime - avgTime;

      expect(avgTime).toBeLessThan(3000); // Average round should be under 3 seconds
      expect(variance).toBeLessThan(1500); // Variance should be reasonable
    }, 60000);

    it('should recover gracefully from overload', async () => {
      // Create overload condition
      const overloadRequests = Array.from({ length: 500 }, (_, i) => async () => {
        const user = await authFactory.createTestUser({
          email: `overload${i}@tcwatch.test`,
        });
        const token = authFactory.generateMockJWT(user);

        return supertest(app.server)
          .post('/trpc/auth.me')
          .set('Authorization', `Bearer ${token}`)
          .send({});
      });

      // Execute overload
      const overloadStart = Date.now();
      const overloadPromises = overloadRequests.map(fn => fn());
      const overloadResponses = await Promise.all(overloadPromises);
      const overloadEnd = Date.now();

      // Check that system handles overload
      const successRate = overloadResponses.filter(r => r.status === 200).length / overloadResponses.length;
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success during overload

      // Test recovery after overload
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for recovery

      const recoverySession = await authFactory.createCompleteAuthSession();
      const recoveryStart = Date.now();

      const recoveryResponse = await supertest(app.server)
        .post('/trpc/auth.me')
        .set('Authorization', `Bearer ${recoverySession.accessToken}`)
        .send({});

      const recoveryEnd = Date.now();
      const recoveryTime = recoveryEnd - recoveryStart;

      expect(recoveryResponse.status).toBe(200);
      expect(recoveryTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME * 2);
    }, 60000);
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const testSession = await authFactory.createCompleteAuthSession();
      const metrics: Array<{ endpoint: string; responseTime: number; status: number }> = [];

      // Test different endpoints
      const endpoints = [
        { path: '/trpc/auth.me', data: {} },
        { path: '/trpc/auth.updateProfile', data: { displayName: 'Perf Test' } },
        { path: '/trpc/auth.getStats', data: {} },
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();

        const response = await supertest(app.server)
          .post(endpoint.path)
          .set('Authorization', `Bearer ${testSession.accessToken}`)
          .send(endpoint.data);

        const endTime = Date.now();

        metrics.push({
          endpoint: endpoint.path,
          responseTime: endTime - startTime,
          status: response.status,
        });
      }

      // Analyze metrics
      metrics.forEach(metric => {
        expect(metric.status).toBe(200);
        expect(metric.responseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME);
      });

      // Calculate performance statistics
      const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
      const maxResponseTime = Math.max(...metrics.map(m => m.responseTime));

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME * 0.8);
      expect(maxResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME);
    });

    it('should meet all performance SLA requirements', async () => {
      const testSession = await authFactory.createCompleteAuthSession();

      // Test SLA requirements
      const slaTests = [
        {
          name: 'Authentication Response Time',
          test: async () => {
            const start = Date.now();
            const response = await supertest(app.server)
              .post('/trpc/auth.me')
              .set('Authorization', `Bearer ${testSession.accessToken}`)
              .send({});
            const end = Date.now();
            return { responseTime: end - start, status: response.status };
          },
          threshold: PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME,
        },
        {
          name: 'Profile Update Response Time',
          test: async () => {
            const start = Date.now();
            const response = await supertest(app.server)
              .post('/trpc/auth.updateProfile')
              .set('Authorization', `Bearer ${testSession.accessToken}`)
              .send({ displayName: 'SLA Test' });
            const end = Date.now();
            return { responseTime: end - start, status: response.status };
          },
          threshold: PERFORMANCE_THRESHOLDS.AUTH_RESPONSE_TIME,
        },
      ];

      for (const slaTest of slaTests) {
        const result = await slaTest.test();

        expect(result.status).toBe(200);
        expect(result.responseTime).toBeLessThan(slaTest.threshold);
      }
    });
  });
});