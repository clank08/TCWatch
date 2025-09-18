import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { createApp } from '../src/server';
import { startMockServer, stopMockServer, resetMockServer } from './mocks/server';

// Test database setup
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;

// Global test setup
let app: FastifyInstance;
let prisma: PrismaClient;
let supabase: ReturnType<typeof createClient>;

// Mock external services
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn()
  }));
});

jest.mock('meilisearch', () => ({
  MeiliSearch: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      search: jest.fn(),
      addDocuments: jest.fn(),
      updateDocuments: jest.fn(),
      deleteDocument: jest.fn(),
      deleteAllDocuments: jest.fn()
    })
  }))
}));

// Mock Temporal client
jest.mock('@temporalio/client', () => ({
  Client: {
    connect: jest.fn().mockResolvedValue({
      start: jest.fn(),
      result: jest.fn()
    })
  }
}));

// Mock external APIs
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
}));

beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  // Start MSW server for mocking external APIs
  startMockServer();

  // Initialize test database
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL
      }
    }
  });

  // Initialize Supabase client for testing
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Create test app instance
  app = await createApp({
    logger: false // Disable logging during tests
  });

  await app.ready();
}, 30000);

beforeEach(async () => {
  // Reset MSW handlers
  resetMockServer();

  // Clean up database before each test
  if (process.env.NODE_ENV === 'test') {
    // Only clean up if we're definitely in test environment
    await prisma.$transaction([
      prisma.userContent.deleteMany(),
      prisma.episodeProgress.deleteMany(),
      prisma.customList.deleteMany(),
      prisma.content.deleteMany(),
      prisma.user.deleteMany()
    ]);
  }
});

afterEach(async () => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

afterAll(async () => {
  // Stop MSW server
  stopMockServer();

  // Cleanup after all tests
  if (app) {
    await app.close();
  }

  if (prisma) {
    await prisma.$disconnect();
  }
});

// Export test utilities
export { app, prisma, supabase };

// Test data factories
export const createTestUser = async (overrides: any = {}) => {
  const defaultUser = {
    id: 'test-user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    displayName: 'Test User',
    fullName: 'Test User',
    privacyLevel: 'PRIVATE' as const,
    isActive: true,
    ...overrides
  };

  return await prisma.user.create({
    data: defaultUser
  });
};

export const createTestContent = async (overrides: any = {}) => {
  const defaultContent = {
    id: 'test-content-' + Math.random().toString(36).substr(2, 9),
    title: 'Test True Crime Documentary',
    type: 'DOCUMENTARY' as const,
    trueCrimeType: 'DOCUMENTARY' as const,
    releaseYear: 2023,
    duration: 120,
    isActive: true,
    ...overrides
  };

  return await prisma.content.create({
    data: defaultContent
  });
};

export const createAuthenticatedRequest = (userId: string) => {
  return {
    headers: {
      authorization: `Bearer mock-jwt-token-${userId}`
    }
  };
};

// Mock JWT verification for tests
export const mockJWTVerification = (userId: string) => {
  const jwt = require('jsonwebtoken');
  jwt.verify = jest.fn().mockReturnValue({ sub: userId });
};