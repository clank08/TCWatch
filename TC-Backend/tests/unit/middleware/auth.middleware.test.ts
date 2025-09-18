/**
 * JWT Validation Middleware Unit Tests
 * Tests for authentication middleware, JWT validation, and context creation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createContext, requireAuth, requireRole } from '../../../src/context';
import { protectedProcedure, adminProcedure } from '../../../src/trpc';
import { AuthTestFactory } from '../../factories/auth.factory';
import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
const mockSupabaseAuth = {
  getUser: jest.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock Prisma
const mockPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Authentication Middleware', () => {
  let authFactory: AuthTestFactory;

  beforeEach(() => {
    authFactory = new AuthTestFactory(mockPrisma);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('JWT Token Extraction and Validation', () => {
    it('should extract user from valid Bearer token', async () => {
      const testUser = await authFactory.createTestUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(testUser)}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeDefined();
      expect(context.user?.id).toBe(testUser.id);
      expect(context.user?.email).toBe(testUser.email);
      expect(context.user?.role).toBe(testUser.role);
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledWith(
        expect.stringContaining('eyJ')
      );
    });

    it('should return null user for missing authorization header', async () => {
      const mockRequest = {
        headers: {},
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return null user for invalid Bearer token format', async () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat token123',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
    });

    it('should return null user for empty Bearer token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer ',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
      expect(mockSupabaseAuth.getUser).not.toHaveBeenCalled();
    });

    it('should handle Supabase authentication errors gracefully', async () => {
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT token' },
      });

      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
      expect(mockSupabaseAuth.getUser).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle expired JWT tokens', async () => {
      const testUser = await authFactory.createTestUser();
      const expiredToken = authFactory.generateExpiredJWT(testUser);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
    });

    it('should handle malformed JWT tokens', async () => {
      const malformedToken = authFactory.generateMalformedJWT();

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid JWT format' },
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${malformedToken}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
    });

    it('should extract user role from user_metadata', async () => {
      const adminUser = await authFactory.createTestAdminUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(adminUser);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(adminUser)}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user?.role).toBe('admin');
    });

    it('should default to user role when no role in metadata', async () => {
      const testUser = await authFactory.createTestUser({ role: 'user' });
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);
      // Remove role from user_metadata
      mockSupabaseUser.user_metadata = {};

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(testUser)}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user?.role).toBe('user');
    });
  });

  describe('Context Creation', () => {
    it('should create context with all required properties', async () => {
      const testUser = await authFactory.createTestUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(testUser)}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context).toHaveProperty('req');
      expect(context).toHaveProperty('prisma');
      expect(context).toHaveProperty('supabase');
      expect(context).toHaveProperty('user');
      expect(context.user).toBeDefined();
    });

    it('should create context without user when not authenticated', async () => {
      const mockRequest = {
        headers: {},
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context).toHaveProperty('req');
      expect(context).toHaveProperty('prisma');
      expect(context).toHaveProperty('supabase');
      expect(context).toHaveProperty('user');
      expect(context.user).toBeNull();
    });
  });

  describe('requireAuth Helper', () => {
    it('should pass when user is authenticated', async () => {
      const testUser = await authFactory.createTestUser();
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: testUser,
      } as any;

      expect(() => requireAuth(context)).not.toThrow();
    });

    it('should throw when user is not authenticated', () => {
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: null,
      } as any;

      expect(() => requireAuth(context)).toThrow('UNAUTHORIZED');
    });
  });

  describe('requireRole Helper', () => {
    it('should pass when user has required role', async () => {
      const adminUser = await authFactory.createTestAdminUser();
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: adminUser,
      } as any;

      expect(() => requireRole(context, 'admin')).not.toThrow();
    });

    it('should pass when user is admin (regardless of required role)', async () => {
      const adminUser = await authFactory.createTestAdminUser();
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: adminUser,
      } as any;

      expect(() => requireRole(context, 'moderator')).not.toThrow();
    });

    it('should throw when user does not have required role', async () => {
      const regularUser = await authFactory.createTestUser({ role: 'user' });
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: regularUser,
      } as any;

      expect(() => requireRole(context, 'admin')).toThrow('FORBIDDEN');
    });

    it('should throw when user is not authenticated', () => {
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: null,
      } as any;

      expect(() => requireRole(context, 'admin')).toThrow('UNAUTHORIZED');
    });
  });

  describe('Protected Procedure Middleware', () => {
    it('should allow access with valid authentication', async () => {
      const testUser = await authFactory.createTestUser();
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: testUser,
      } as any;

      const mockNext = jest.fn().mockResolvedValue('success');

      const result = await protectedProcedure._def.middlewares[0]({
        ctx: context,
        next: mockNext,
        path: 'test',
        type: 'query',
        input: undefined,
        getRawInput: () => Promise.resolve(undefined),
      });

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          ...context,
          user: testUser,
        },
      });
      expect(result).toBe('success');
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: null,
      } as any;

      const mockNext = jest.fn();

      await expect(
        protectedProcedure._def.middlewares[0]({
          ctx: context,
          next: mockNext,
          path: 'test',
          type: 'query',
          input: undefined,
          getRawInput: () => Promise.resolve(undefined),
        })
      ).rejects.toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Admin Procedure Middleware', () => {
    it('should allow access for admin users', async () => {
      const adminUser = await authFactory.createTestAdminUser();
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: adminUser,
      } as any;

      const mockNext = jest.fn().mockResolvedValue('admin-success');

      const result = await adminProcedure._def.middlewares[0]({
        ctx: context,
        next: mockNext,
        path: 'admin-test',
        type: 'mutation',
        input: undefined,
        getRawInput: () => Promise.resolve(undefined),
      });

      expect(mockNext).toHaveBeenCalledWith({
        ctx: {
          ...context,
          user: adminUser,
        },
      });
      expect(result).toBe('admin-success');
    });

    it('should throw FORBIDDEN for non-admin users', async () => {
      const regularUser = await authFactory.createTestUser({ role: 'user' });
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: regularUser,
      } as any;

      const mockNext = jest.fn();

      await expect(
        adminProcedure._def.middlewares[0]({
          ctx: context,
          next: mockNext,
          path: 'admin-test',
          type: 'mutation',
          input: undefined,
          getRawInput: () => Promise.resolve(undefined),
        })
      ).rejects.toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      const context = {
        req: {},
        prisma: mockPrisma,
        supabase: mockSupabase,
        user: null,
      } as any;

      const mockNext = jest.fn();

      await expect(
        adminProcedure._def.middlewares[0]({
          ctx: context,
          next: mockNext,
          path: 'admin-test',
          type: 'mutation',
          input: undefined,
          getRawInput: () => Promise.resolve(undefined),
        })
      ).rejects.toThrow(TRPCError);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase client exceptions', async () => {
      mockSupabaseAuth.getUser.mockRejectedValueOnce(new Error('Supabase connection error'));

      const mockRequest = {
        headers: {
          authorization: 'Bearer some-token',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseAuth.getUser.mockRejectedValueOnce(new Error('Network error'));

      const mockRequest = {
        headers: {
          authorization: 'Bearer network-error-token',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
    });

    it('should handle undefined email in Supabase response', async () => {
      const testUser = await authFactory.createTestUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);
      // Remove email from response
      mockSupabaseUser.email = undefined as any;

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(testUser)}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(context.user).toBeNull();
    });
  });

  describe('Token Edge Cases', () => {
    it('should handle tokens with special characters', async () => {
      const testUser = await authFactory.createTestUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.special-chars-123',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(mockSupabaseAuth.getUser).toHaveBeenCalledWith('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.special-chars-123');
    });

    it('should handle very long tokens', async () => {
      const testUser = await authFactory.createTestUser();
      const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);
      const longToken = 'a'.repeat(1000);

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${longToken}`,
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(mockSupabaseAuth.getUser).toHaveBeenCalledWith(longToken);
    });

    it('should handle multiple Bearer keywords in header', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer Bearer token123',
        },
      };

      const context = await createContext({ req: mockRequest } as any);

      expect(mockSupabaseAuth.getUser).toHaveBeenCalledWith('Bearer token123');
    });
  });
});

describe('JWT Validation Performance', () => {
  let authFactory: AuthTestFactory;

  beforeEach(() => {
    authFactory = new AuthTestFactory(mockPrisma);
    jest.clearAllMocks();
  });

  it('should validate JWT tokens within performance threshold (< 50ms)', async () => {
    const testUser = await authFactory.createTestUser();
    const mockSupabaseUser = authFactory.createMockSupabaseUser(testUser);

    mockSupabaseAuth.getUser.mockResolvedValueOnce({
      data: { user: mockSupabaseUser },
      error: null,
    });

    const mockRequest = {
      headers: {
        authorization: `Bearer ${authFactory.generateMockJWT(testUser)}`,
      },
    };

    const startTime = Date.now();
    await createContext({ req: mockRequest } as any);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(50);
  });

  it('should handle concurrent authentication requests efficiently', async () => {
    const testUsers = await authFactory.createTestUsers(10);
    const promises: Promise<any>[] = [];

    testUsers.forEach((user, index) => {
      const mockSupabaseUser = authFactory.createMockSupabaseUser(user);
      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockSupabaseUser },
        error: null,
      });

      const mockRequest = {
        headers: {
          authorization: `Bearer ${authFactory.generateMockJWT(user)}`,
        },
      };

      promises.push(createContext({ req: mockRequest } as any));
    });

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(200); // All 10 should complete in < 200ms
  });
});