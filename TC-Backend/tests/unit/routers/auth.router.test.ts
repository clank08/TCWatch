/**
 * Auth Router Unit Tests
 * Tests for authentication router methods and business logic
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { authRouter } from '../../../src/routers/auth-simple';
import { AuthTestFactory } from '../../factories/auth.factory';
import { TRPCError } from '@trpc/server';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const mockPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userContent: {
    count: jest.fn(),
  },
  customList: {
    count: jest.fn(),
  },
  friendship: {
    count: jest.fn(),
  },
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
  $disconnect: jest.fn(),
} as unknown as PrismaClient;

describe('Auth Router', () => {
  let authFactory: AuthTestFactory;
  let mockCtx: any;

  beforeEach(() => {
    authFactory = new AuthTestFactory(mockPrisma);
    mockCtx = {
      prisma: mockPrisma,
      supabase: {},
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('me query', () => {
    it('should return user profile for authenticated user', async () => {
      const testUser = await authFactory.createTestUser();
      const testProfile = await authFactory.createTestUserProfile(testUser.id);

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(testProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.me();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testProfile);
      expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        select: {
          id: true,
          userId: true,
          displayName: true,
          avatarUrl: true,
          interests: true,
          privacySettings: true,
          notificationSettings: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should throw NOT_FOUND when user profile does not exist', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(null);

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.me()).rejects.toThrow(TRPCError);
      await expect(caller.me()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User profile not found',
      });
    });

    it('should handle database errors gracefully', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockRejectedValueOnce(new Error('Database error'));

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.me()).rejects.toThrow(TRPCError);
      await expect(caller.me()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user profile',
      });
    });

    it('should rethrow TRPCError without wrapping', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      const originalError = new TRPCError({
        code: 'FORBIDDEN',
        message: 'Custom error',
      });
      mockPrisma.userProfile.findUnique = jest.fn().mockRejectedValueOnce(originalError);

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.me()).rejects.toThrow(originalError);
    });
  });

  describe('updateProfile mutation', () => {
    it('should update user profile with valid input', async () => {
      const testUser = await authFactory.createTestUser();
      const updateData = {
        displayName: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        interests: ['true-crime', 'documentaries'],
      };

      const updatedProfile = {
        ...await authFactory.createTestUserProfile(testUser.id),
        ...updateData,
        updatedAt: new Date(),
      };

      mockCtx.user = testUser;
      mockPrisma.userProfile.update = jest.fn().mockResolvedValueOnce(updatedProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.updateProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(result.message).toBe('Profile updated successfully');
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        data: {
          displayName: updateData.displayName,
          avatarUrl: updateData.avatarUrl,
          interests: updateData.interests,
          privacySettings: undefined,
          notificationSettings: undefined,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should update only provided fields', async () => {
      const testUser = await authFactory.createTestUser();
      const partialUpdate = {
        displayName: 'New Name Only',
      };

      const updatedProfile = {
        ...await authFactory.createTestUserProfile(testUser.id),
        displayName: partialUpdate.displayName,
        updatedAt: new Date(),
      };

      mockCtx.user = testUser;
      mockPrisma.userProfile.update = jest.fn().mockResolvedValueOnce(updatedProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.updateProfile(partialUpdate);

      expect(result.success).toBe(true);
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        data: {
          displayName: partialUpdate.displayName,
          avatarUrl: undefined,
          interests: undefined,
          privacySettings: undefined,
          notificationSettings: undefined,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should update privacy and notification settings', async () => {
      const testUser = await authFactory.createTestUser();
      const updateData = {
        privacySettings: {
          profile_visible: false,
          activity_visible: false,
          allow_friend_requests: false,
        },
        notificationSettings: {
          push_enabled: false,
          email_enabled: true,
          new_content_alerts: false,
        },
      };

      const updatedProfile = {
        ...await authFactory.createTestUserProfile(testUser.id),
        ...updateData,
        updatedAt: new Date(),
      };

      mockCtx.user = testUser;
      mockPrisma.userProfile.update = jest.fn().mockResolvedValueOnce(updatedProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.updateProfile(updateData);

      expect(result.success).toBe(true);
      expect(result.data.privacySettings).toEqual(updateData.privacySettings);
      expect(result.data.notificationSettings).toEqual(updateData.notificationSettings);
    });

    it('should handle database update errors', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userProfile.update = jest.fn().mockRejectedValueOnce(new Error('Update failed'));

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.updateProfile({ displayName: 'Test' })).rejects.toThrow(TRPCError);
      await expect(caller.updateProfile({ displayName: 'Test' })).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });
    });

    it('should validate input constraints', async () => {
      const testUser = await authFactory.createTestUser();
      mockCtx.user = testUser;

      const caller = authRouter.createCaller(mockCtx);

      // Test empty display name
      await expect(caller.updateProfile({ displayName: '' })).rejects.toThrow();

      // Test display name too long
      await expect(caller.updateProfile({
        displayName: 'a'.repeat(101)
      })).rejects.toThrow();

      // Test invalid URL
      await expect(caller.updateProfile({
        avatarUrl: 'not-a-url'
      })).rejects.toThrow();
    });
  });

  describe('syncUser mutation', () => {
    it('should create new user profile when user does not exist', async () => {
      const testUser = await authFactory.createTestUser();
      const inputData = {
        displayName: 'New User',
        avatarUrl: 'https://example.com/avatar.jpg',
        interests: ['true-crime'],
      };

      const newProfile = {
        id: 'profile-1',
        userId: testUser.id,
        ...inputData,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(null);
      mockPrisma.userProfile.create = jest.fn().mockResolvedValueOnce(newProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.syncUser(inputData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newProfile);
      expect(result.message).toBe('User created successfully');
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          displayName: inputData.displayName,
          avatarUrl: inputData.avatarUrl,
          interests: inputData.interests,
          privacySettings: expect.any(Object),
          notificationSettings: expect.any(Object),
        },
        select: expect.any(Object),
      });
    });

    it('should update existing user profile', async () => {
      const testUser = await authFactory.createTestUser();
      const existingProfile = await authFactory.createTestUserProfile(testUser.id);
      const inputData = {
        displayName: 'Updated User',
        interests: ['murder', 'conspiracy'],
      };

      const updatedProfile = {
        ...existingProfile,
        displayName: inputData.displayName,
        interests: inputData.interests,
        updatedAt: new Date(),
      };

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(existingProfile);
      mockPrisma.userProfile.update = jest.fn().mockResolvedValueOnce(updatedProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.syncUser(inputData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProfile);
      expect(result.message).toBe('User synced successfully');
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        data: {
          displayName: inputData.displayName,
          avatarUrl: existingProfile.avatarUrl,
          interests: inputData.interests,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should use existing values when input is not provided', async () => {
      const testUser = await authFactory.createTestUser();
      const existingProfile = await authFactory.createTestUserProfile(testUser.id);

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(existingProfile);
      mockPrisma.userProfile.update = jest.fn().mockResolvedValueOnce(existingProfile);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.syncUser({});

      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        data: {
          displayName: existingProfile.displayName,
          avatarUrl: existingProfile.avatarUrl,
          interests: existingProfile.interests,
          updatedAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
    });

    it('should set default values for new user', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockResolvedValueOnce(null);
      mockPrisma.userProfile.create = jest.fn().mockResolvedValueOnce({
        id: 'profile-1',
        userId: testUser.id,
        displayName: null,
        avatarUrl: null,
        interests: [],
        privacySettings: expect.any(Object),
        notificationSettings: expect.any(Object),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const caller = authRouter.createCaller(mockCtx);
      await caller.syncUser({});

      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          userId: testUser.id,
          displayName: null,
          avatarUrl: null,
          interests: [],
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
        select: expect.any(Object),
      });
    });

    it('should handle database errors during sync', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userProfile.findUnique = jest.fn().mockRejectedValueOnce(new Error('DB Error'));

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.syncUser({})).rejects.toThrow(TRPCError);
      await expect(caller.syncUser({})).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to sync user data',
      });
    });
  });

  describe('getStats query', () => {
    it('should return user statistics', async () => {
      const testUser = await authFactory.createTestUser();

      const mockStats = {
        totalContent: 25,
        watchingCount: 5,
        completedCount: 15,
        wantToWatchCount: 5,
        listsCount: 3,
        friendsCount: 12,
      };

      mockCtx.user = testUser;
      mockPrisma.userContent.count
        .mockResolvedValueOnce(mockStats.totalContent)  // total
        .mockResolvedValueOnce(mockStats.watchingCount) // watching
        .mockResolvedValueOnce(mockStats.completedCount) // completed
        .mockResolvedValueOnce(mockStats.wantToWatchCount); // want to watch

      mockPrisma.customList.count.mockResolvedValueOnce(mockStats.listsCount);
      mockPrisma.friendship.count.mockResolvedValueOnce(mockStats.friendsCount);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.getStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);

      // Verify correct queries were made
      expect(mockPrisma.userContent.count).toHaveBeenCalledWith({
        where: { userId: testUser.id }
      });
      expect(mockPrisma.userContent.count).toHaveBeenCalledWith({
        where: { userId: testUser.id, status: 'WATCHING' }
      });
      expect(mockPrisma.userContent.count).toHaveBeenCalledWith({
        where: { userId: testUser.id, status: 'COMPLETED' }
      });
      expect(mockPrisma.userContent.count).toHaveBeenCalledWith({
        where: { userId: testUser.id, status: 'WANT_TO_WATCH' }
      });
      expect(mockPrisma.customList.count).toHaveBeenCalledWith({
        where: { userId: testUser.id }
      });
      expect(mockPrisma.friendship.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { requesterId: testUser.id, status: 'ACCEPTED' },
            { addresseeId: testUser.id, status: 'ACCEPTED' }
          ]
        }
      });
    });

    it('should return zero stats for new user', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userContent.count = jest.fn().mockResolvedValue(0);
      mockPrisma.customList.count = jest.fn().mockResolvedValue(0);
      mockPrisma.friendship.count = jest.fn().mockResolvedValue(0);

      const caller = authRouter.createCaller(mockCtx);
      const result = await caller.getStats();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalContent: 0,
        watchingCount: 0,
        completedCount: 0,
        wantToWatchCount: 0,
        listsCount: 0,
        friendsCount: 0,
      });
    });

    it('should handle database errors in stats calculation', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userContent.count = jest.fn().mockRejectedValueOnce(new Error('Stats error'));

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.getStats()).rejects.toThrow(TRPCError);
      await expect(caller.getStats()).rejects.toMatchObject({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user statistics',
      });
    });

    it('should handle partial database failures gracefully', async () => {
      const testUser = await authFactory.createTestUser();

      mockCtx.user = testUser;
      mockPrisma.userContent.count = jest.fn()
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2)  // watching
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(3); // want to watch

      mockPrisma.customList.count = jest.fn().mockRejectedValueOnce(new Error('Lists error'));

      const caller = authRouter.createCaller(mockCtx);

      await expect(caller.getStats()).rejects.toThrow(TRPCError);
    });
  });

  describe('Input Validation', () => {
    it('should validate updateProfile input types', async () => {
      const testUser = await authFactory.createTestUser();
      mockCtx.user = testUser;

      const caller = authRouter.createCaller(mockCtx);

      // Test invalid interests array
      await expect(caller.updateProfile({
        interests: 'not-an-array' as any
      })).rejects.toThrow();

      // Test invalid privacy settings type
      await expect(caller.updateProfile({
        privacySettings: 'not-an-object' as any
      })).rejects.toThrow();
    });

    it('should validate syncUser input types', async () => {
      const testUser = await authFactory.createTestUser();
      mockCtx.user = testUser;

      const caller = authRouter.createCaller(mockCtx);

      // Test invalid avatar URL
      await expect(caller.syncUser({
        avatarUrl: 'invalid-url'
      })).rejects.toThrow();

      // Test invalid interests type
      await expect(caller.syncUser({
        interests: 123 as any
      })).rejects.toThrow();
    });
  });

  describe('Error Message Consistency', () => {
    it('should return consistent error messages', async () => {
      const testUser = await authFactory.createTestUser();
      mockCtx.user = testUser;

      // Mock database to throw different types of errors
      mockPrisma.userProfile.findUnique = jest.fn().mockRejectedValueOnce(new Error('Connection lost'));

      const caller = authRouter.createCaller(mockCtx);

      try {
        await caller.me();
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        expect((error as TRPCError).message).toBe('Failed to retrieve user profile');
        expect((error as TRPCError).code).toBe('INTERNAL_SERVER_ERROR');
      }
    });
  });
});