import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { app, prisma } from '../setup';
import supertest from 'supertest';

/**
 * Comprehensive backend testing utilities for TCWatch
 * Provides helpers for API testing, database operations, and common test scenarios
 */

// API Testing Helpers
export class APITestHelper {
  private request: supertest.SuperTest<supertest.Test>;

  constructor(app: FastifyInstance) {
    this.request = supertest(app.server);
  }

  /**
   * Create authenticated request with mock JWT token
   */
  authenticatedRequest(userId: string) {
    return this.request.set('Authorization', `Bearer mock-jwt-${userId}`);
  }

  /**
   * Test API response structure and status
   */
  async expectSuccessResponse(response: any, expectedStatus: number = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    return response.body;
  }

  /**
   * Test error response structure
   */
  async expectErrorResponse(response: any, expectedStatus: number, expectedCode?: string) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
    if (expectedCode) {
      expect(response.body.error.code).toBe(expectedCode);
    }
    return response.body;
  }

  /**
   * Test pagination response structure
   */
  expectPaginatedResponse(body: any) {
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('pagination');
    expect(body.pagination).toHaveProperty('page');
    expect(body.pagination).toHaveProperty('limit');
    expect(body.pagination).toHaveProperty('total');
    expect(body.pagination).toHaveProperty('totalPages');
    expect(Array.isArray(body.data)).toBe(true);
  }

  get() { return this.request; }
}

// Database Testing Helpers
export class DatabaseTestHelper {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Clean all tables in correct order (respecting foreign key constraints)
   */
  async cleanDatabase() {
    await this.prisma.$transaction([
      this.prisma.episodeProgress.deleteMany(),
      this.prisma.userContent.deleteMany(),
      this.prisma.customListItem.deleteMany(),
      this.prisma.customList.deleteMany(),
      this.prisma.contentCase.deleteMany(),
      this.prisma.streamingAvailability.deleteMany(),
      this.prisma.content.deleteMany(),
      this.prisma.notification.deleteMany(),
      this.prisma.socialActivity.deleteMany(),
      this.prisma.friendship.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
  }

  /**
   * Seed database with test data
   */
  async seedTestData() {
    const user = await this.createTestUser();
    const content = await this.createTestContent();
    const userContent = await this.createTestUserContent(user.id, content.id);

    return { user, content, userContent };
  }

  /**
   * Create test user with default or custom data
   */
  async createTestUser(overrides: any = {}) {
    const defaultData = {
      id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      fullName: 'Test User',
      privacyLevel: 'PRIVATE' as const,
      isActive: true,
      ...overrides
    };

    return await this.prisma.user.create({ data: defaultData });
  }

  /**
   * Create test content with default or custom data
   */
  async createTestContent(overrides: any = {}) {
    const defaultData = {
      id: `test-content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test True Crime Documentary',
      type: 'DOCUMENTARY' as const,
      trueCrimeType: 'DOCUMENTARY' as const,
      releaseYear: 2023,
      duration: 120,
      description: 'A test documentary about true crime',
      isActive: true,
      ...overrides
    };

    return await this.prisma.content.create({ data: defaultData });
  }

  /**
   * Create test user content relationship
   */
  async createTestUserContent(userId: string, contentId: string, overrides: any = {}) {
    const defaultData = {
      userId,
      contentId,
      trackingState: 'WANT_TO_WATCH' as const,
      progress: 0,
      isComplete: false,
      ...overrides
    };

    return await this.prisma.userContent.create({ data: defaultData });
  }

  /**
   * Create test custom list
   */
  async createTestCustomList(userId: string, overrides: any = {}) {
    const defaultData = {
      id: `test-list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: 'Test List',
      description: 'A test custom list',
      isPublic: false,
      ...overrides
    };

    return await this.prisma.customList.create({ data: defaultData });
  }

  /**
   * Assert database record exists
   */
  async assertRecordExists(model: string, where: any) {
    const record = await (this.prisma as any)[model].findFirst({ where });
    expect(record).toBeDefined();
    return record;
  }

  /**
   * Assert database record count
   */
  async assertRecordCount(model: string, expectedCount: number, where: any = {}) {
    const count = await (this.prisma as any)[model].count({ where });
    expect(count).toBe(expectedCount);
  }
}

// Mock Data Factories
export class MockDataFactory {
  /**
   * Generate mock external API responses
   */
  static watchmodeResponse(overrides: any = {}) {
    return {
      title: 'Test Movie',
      id: 12345,
      type: 'movie',
      year: 2023,
      sources: [
        {
          source_id: 203,
          name: 'Netflix',
          type: 'sub',
          region: 'US'
        }
      ],
      ...overrides
    };
  }

  static tmdbResponse(overrides: any = {}) {
    return {
      id: 12345,
      title: 'Test Movie',
      overview: 'A test movie description',
      release_date: '2023-01-01',
      vote_average: 7.5,
      poster_path: '/test-poster.jpg',
      ...overrides
    };
  }

  static tvdbResponse(overrides: any = {}) {
    return {
      id: 12345,
      name: 'Test Series',
      overview: 'A test series description',
      firstAired: '2023-01-01',
      status: 'Continuing',
      ...overrides
    };
  }

  /**
   * Generate mock JWT payload
   */
  static jwtPayload(userId: string, overrides: any = {}) {
    return {
      sub: userId,
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      ...overrides
    };
  }
}

// Performance Testing Helpers
export class PerformanceTestHelper {
  /**
   * Measure API response time
   */
  static async measureResponseTime(apiCall: () => Promise<any>) {
    const start = Date.now();
    const result = await apiCall();
    const duration = Date.now() - start;
    return { result, duration };
  }

  /**
   * Assert response time is within acceptable limits
   */
  static assertResponseTime(duration: number, maxMs: number) {
    expect(duration).toBeLessThan(maxMs);
  }

  /**
   * Run load test with concurrent requests
   */
  static async loadTest(apiCall: () => Promise<any>, concurrency: number = 10) {
    const promises = Array(concurrency).fill(null).map(() => apiCall());
    const results = await Promise.allSettled(promises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return { successful, failed, successRate: successful / results.length };
  }
}

// Test Data Validation Helpers
export class ValidationTestHelper {
  /**
   * Test input validation for API endpoints
   */
  static async testInputValidation(
    apiCall: (data: any) => Promise<any>,
    validData: any,
    invalidDataSets: Array<{ data: any; expectedError: string }>
  ) {
    // Test valid data works
    const validResponse = await apiCall(validData);
    expect(validResponse.status).toBeLessThan(400);

    // Test invalid data fails appropriately
    for (const { data, expectedError } of invalidDataSets) {
      const response = await apiCall(data);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.error.message).toContain(expectedError);
    }
  }

  /**
   * Test database constraints
   */
  static async testDatabaseConstraints(
    prisma: PrismaClient,
    model: string,
    validData: any,
    constraintTests: Array<{ data: any; constraint: string }>
  ) {
    // Test valid data works
    const validRecord = await (prisma as any)[model].create({ data: validData });
    expect(validRecord).toBeDefined();

    // Test constraint violations
    for (const { data, constraint } of constraintTests) {
      await expect((prisma as any)[model].create({ data }))
        .rejects.toThrow(constraint);
    }
  }
}

// Export pre-configured instances
export const apiHelper = new APITestHelper(app);
export const dbHelper = new DatabaseTestHelper(prisma);

// Utility functions
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateRandomString = (length: number = 10) =>
  Math.random().toString(36).substring(2, length + 2);

export const generateRandomEmail = () =>
  `test-${generateRandomString()}@example.com`;

/**
 * Custom Jest matchers for backend testing
 */
export const customMatchers = {
  toBeValidUUID: (received: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid UUID`,
      pass
    };
  },

  toBeValidDate: (received: string) => {
    const date = new Date(received);
    const pass = !isNaN(date.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass
    };
  },

  toBeWithinRange: (received: number, min: number, max: number) => {
    const pass = received >= min && received <= max;
    return {
      message: () => `expected ${received} to be between ${min} and ${max}`,
      pass
    };
  }
};

// Add custom matchers to Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidDate(): R;
      toBeWithinRange(min: number, max: number): R;
    }
  }
}