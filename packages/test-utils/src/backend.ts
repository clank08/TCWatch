import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';

// Backend test utilities
export class TestDatabase {
  constructor(private prisma: PrismaClient) {}

  async cleanup() {
    // Clean up in dependency order
    await this.prisma.episodeProgress.deleteMany();
    await this.prisma.userContent.deleteMany();
    await this.prisma.customListItem.deleteMany();
    await this.prisma.customList.deleteMany();
    await this.prisma.content.deleteMany();
    await this.prisma.user.deleteMany();
  }

  async seed(data: any) {
    // Seed the database with test data
    if (data.users) {
      await this.prisma.user.createMany({ data: data.users });
    }
    if (data.content) {
      await this.prisma.content.createMany({ data: data.content });
    }
    if (data.userContent) {
      await this.prisma.userContent.createMany({ data: data.userContent });
    }
    if (data.customLists) {
      await this.prisma.customList.createMany({ data: data.customLists });
    }
  }
}

// API testing helpers
export class TestAPIClient {
  constructor(private app: FastifyInstance) {}

  async authenticatedRequest(method: string, url: string, userId: string, body?: any) {
    const request = this.app.inject({
      method: method.toUpperCase() as any,
      url,
      headers: {
        authorization: `Bearer mock-jwt-${userId}`,
        'content-type': 'application/json',
      },
      payload: body ? JSON.stringify(body) : undefined,
    });

    return await request;
  }

  async get(url: string, userId?: string) {
    if (userId) {
      return this.authenticatedRequest('GET', url, userId);
    }
    return this.app.inject({ method: 'GET', url });
  }

  async post(url: string, body: any, userId?: string) {
    if (userId) {
      return this.authenticatedRequest('POST', url, userId, body);
    }
    return this.app.inject({
      method: 'POST',
      url,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(body),
    });
  }

  async put(url: string, body: any, userId?: string) {
    if (userId) {
      return this.authenticatedRequest('PUT', url, userId, body);
    }
    return this.app.inject({
      method: 'PUT',
      url,
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify(body),
    });
  }

  async delete(url: string, userId?: string) {
    if (userId) {
      return this.authenticatedRequest('DELETE', url, userId);
    }
    return this.app.inject({ method: 'DELETE', url });
  }
}

// tRPC testing helpers
export const createTRPCCaller = (app: FastifyInstance, userId?: string) => {
  // Mock tRPC caller for testing
  return {
    auth: {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      me: jest.fn(),
    },
    content: {
      search: jest.fn(),
      getById: jest.fn(),
      getRecommendations: jest.fn(),
    },
    userContent: {
      track: jest.fn(),
      updateProgress: jest.fn(),
      getMyList: jest.fn(),
      rate: jest.fn(),
    },
    lists: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMyLists: jest.fn(),
      addToList: jest.fn(),
      removeFromList: jest.fn(),
    },
    social: {
      getFriends: jest.fn(),
      sendFriendRequest: jest.fn(),
      acceptFriendRequest: jest.fn(),
      getActivityFeed: jest.fn(),
    },
  };
};

// Mock external service helpers
export const mockExternalAPIs = () => {
  // Mock all external API clients
  const mocks = {
    watchmode: {
      searchContent: jest.fn(),
      getAvailability: jest.fn(),
    },
    tmdb: {
      searchMovies: jest.fn(),
      getMovieDetails: jest.fn(),
      searchTV: jest.fn(),
      getTVDetails: jest.fn(),
    },
    thetvdb: {
      searchSeries: jest.fn(),
      getSeriesDetails: jest.fn(),
      getEpisodes: jest.fn(),
    },
    tvmaze: {
      searchShows: jest.fn(),
      getShowDetails: jest.fn(),
      getSchedule: jest.fn(),
    },
    wikidata: {
      searchCriminalCases: jest.fn(),
      getCaseDetails: jest.fn(),
    },
  };

  return mocks;
};

// Database transaction helpers
export const withTransaction = async (
  prisma: PrismaClient,
  fn: (tx: PrismaClient) => Promise<void>
) => {
  await prisma.$transaction(async (tx) => {
    await fn(tx);
  });
};

// Performance testing helpers
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return {
    result,
    executionTime: end - start,
  };
};

// Load testing utilities
export const createLoadTestScenario = (
  fn: () => Promise<any>,
  options: { concurrent: number; duration: number }
) => {
  return async () => {
    const { concurrent, duration } = options;
    const startTime = Date.now();
    const results: Array<{ success: boolean; time: number; error?: any }> = [];

    while (Date.now() - startTime < duration) {
      const promises = Array.from({ length: concurrent }, async () => {
        const start = Date.now();
        try {
          await fn();
          return { success: true, time: Date.now() - start };
        } catch (error) {
          return { success: false, time: Date.now() - start, error };
        }
      });

      const batchResults = await Promise.all(promises);
      results.push(...batchResults);

      // Brief pause between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      totalRequests: results.length,
      successfulRequests: results.filter(r => r.success).length,
      failedRequests: results.filter(r => !r.success).length,
      averageResponseTime: results.reduce((sum, r) => sum + r.time, 0) / results.length,
      errors: results.filter(r => !r.success).map(r => r.error),
    };
  };
};