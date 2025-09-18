// Simplified Auth Router - Registration, login, profile management
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  /**
   * Get current user profile
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
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

        if (!userProfile) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User profile not found',
          });
        }

        return {
          success: true,
          data: userProfile,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user profile',
        });
      }
    }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(100).optional(),
        avatarUrl: z.string().url().optional(),
        interests: z.array(z.string()).optional(),
        privacySettings: z.record(z.any()).optional(),
        notificationSettings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const updatedUser = await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            displayName: input.displayName ?? undefined,
            avatarUrl: input.avatarUrl ?? undefined,
            interests: input.interests ?? undefined,
            privacySettings: input.privacySettings ?? undefined,
            notificationSettings: input.notificationSettings ?? undefined,
            updatedAt: new Date(),
          },
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

        return {
          success: true,
          data: updatedUser,
          message: 'Profile updated successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  /**
   * Create or sync user from Supabase Auth
   */
  syncUser: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        interests: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const existingUser = await prisma.userProfile.findUnique({
          where: { userId: user.id },
        });

        if (existingUser) {
          // Update existing user
          const updatedUser = await prisma.userProfile.update({
            where: { userId: user.id },
            data: {
              displayName: input.displayName || existingUser.displayName,
              avatarUrl: input.avatarUrl || existingUser.avatarUrl,
              interests: input.interests || existingUser.interests,
              updatedAt: new Date(),
            },
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

          return {
            success: true,
            data: updatedUser,
            message: 'User synced successfully',
          };
        } else {
          // Create new user
          const newUser = await prisma.userProfile.create({
            data: {
              userId: user.id,
              displayName: input.displayName ?? null,
              avatarUrl: input.avatarUrl ?? null,
              interests: input.interests || [],
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

          return {
            success: true,
            data: newUser,
            message: 'User created successfully',
          };
        }
      } catch (error) {
        console.error('Failed to sync user:', error);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync user data',
        });
      }
    }),

  /**
   * Get user statistics
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const [
          totalContent,
          watchingCount,
          completedCount,
          wantToWatchCount,
          listsCount,
          friendsCount,
        ] = await Promise.all([
          prisma.userContent.count({ where: { userId: user.id } }),
          prisma.userContent.count({
            where: { userId: user.id, status: 'WATCHING' }
          }),
          prisma.userContent.count({
            where: { userId: user.id, status: 'COMPLETED' }
          }),
          prisma.userContent.count({
            where: { userId: user.id, status: 'WANT_TO_WATCH' }
          }),
          prisma.customList.count({ where: { userId: user.id } }),
          prisma.friendship.count({
            where: {
              OR: [
                { requesterId: user.id, status: 'ACCEPTED' },
                { addresseeId: user.id, status: 'ACCEPTED' }
              ]
            }
          }),
        ]);

        return {
          success: true,
          data: {
            totalContent,
            watchingCount,
            completedCount,
            wantToWatchCount,
            listsCount,
            friendsCount,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user statistics',
        });
      }
    }),
});