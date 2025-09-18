// Comprehensive Authentication Router
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure, rateLimitedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { AuthService } from '../services/auth/auth.service';
import { AuthProvidersService } from '../services/auth/providers.service';
import { ProfileService, CreateProfileSchema, UpdateProfileSchema, PrivacySettingsSchema, NotificationSettingsSchema } from '../services/auth/profile.service';
import { StorageService } from '../services/auth/storage.service';
import { SessionService } from '../services/auth/session.service';
import Redis from 'ioredis';

// Import prisma from context
import { prisma } from '../context';

// Initialize services
const redis = new Redis(process.env.REDIS_URL!);
const authService = new AuthService(prisma, redis);
const providersService = new AuthProvidersService();
const profileService = new ProfileService(prisma);
const storageService = new StorageService();
const sessionService = new SessionService(redis);

export const authRouter = router({
  /**
   * Get available auth providers
   */
  getProviders: publicProcedure
    .query(async () => {
      try {
        const providers = providersService.getAvailableProviders();
        return {
          success: true,
          data: providers,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get auth providers',
        });
      }
    }),

  /**
   * Sign up with email and password
   */
  signUp: rateLimitedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8).max(128),
        displayName: z.string().min(1).max(100).optional(),
        captchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check rate limiting
        const lockStatus = await sessionService.isLocked(input.email, ctx.req.ip);
        if (lockStatus.locked) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Account temporarily locked. Try again after ${lockStatus.lockUntil?.toLocaleTimeString()}`,
          });
        }

        // Sign up with Supabase
        const result = await providersService.signUpWithEmail(
          input.email,
          input.password,
          {
            data: {
              display_name: input.displayName,
            },
            captchaToken: input.captchaToken,
            emailRedirectTo: `${process.env.EXPO_PUBLIC_API_URL}/auth/verify`,
          }
        );

        if (result.error) {
          await sessionService.recordFailedAttempt(input.email, ctx.req.ip);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }

        // Clear any failed attempts
        await sessionService.clearFailedAttempts(input.email, ctx.req.ip);

        return {
          success: true,
          data: {
            user: result.user,
            needsConfirmation: !result.session,
          },
          message: result.session
            ? 'Account created successfully'
            : 'Please check your email to confirm your account',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Registration failed',
        });
      }
    }),

  /**
   * Sign in with email and password
   */
  signIn: rateLimitedProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
        captchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Check rate limiting
        const lockStatus = await sessionService.isLocked(input.email, ctx.req.ip);
        if (lockStatus.locked) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Account temporarily locked. Try again after ${lockStatus.lockUntil?.toLocaleTimeString()}`,
          });
        }

        // Sign in with Supabase
        const result = await providersService.signInWithEmail(
          input.email,
          input.password,
          {
            captchaToken: input.captchaToken,
          }
        );

        if (result.error) {
          await sessionService.recordFailedAttempt(input.email, ctx.req.ip);
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: result.error,
          });
        }

        if (!result.session || !result.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid credentials',
          });
        }

        // Clear failed attempts
        await sessionService.clearFailedAttempts(input.email, ctx.req.ip);

        // Create session
        const sessionId = await sessionService.createSession(
          result.user.id,
          result.user.email!,
          result.user.user_metadata?.role || 'user',
          result.session.refresh_token,
          {
            ipAddress: ctx.req.ip,
            userAgent: ctx.req.headers['user-agent'],
          }
        );

        return {
          success: true,
          data: {
            user: result.user,
            session: result.session,
            sessionId,
          },
          message: 'Signed in successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sign in failed',
        });
      }
    }),

  /**
   * Sign in with OAuth provider
   */
  signInWithProvider: publicProcedure
    .input(
      z.object({
        provider: z.enum(['google', 'apple', 'github', 'facebook', 'twitter']),
        redirectTo: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await providersService.signInWithProvider(
          input.provider,
          input.redirectTo
        );

        if (result.error) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error,
          });
        }

        return {
          success: true,
          data: {
            url: result.url,
            provider: result.provider,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'OAuth sign in failed',
        });
      }
    }),

  /**
   * Reset password
   */
  resetPassword: rateLimitedProcedure
    .input(
      z.object({
        email: z.string().email(),
        captchaToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await providersService.resetPassword(
          input.email,
          `${process.env.EXPO_PUBLIC_API_URL}/auth/reset-password`,
          input.captchaToken
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Password reset failed',
          });
        }

        return {
          success: true,
          message: 'Password reset email sent',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password reset failed',
        });
      }
    }),

  /**
   * Update password
   */
  updatePassword: protectedProcedure
    .input(
      z.object({
        newPassword: z.string().min(8).max(128),
        currentPassword: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify current password by attempting sign in
        const verifyResult = await providersService.signInWithEmail(
          ctx.user.email,
          input.currentPassword
        );

        if (verifyResult.error) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Current password is incorrect',
          });
        }

        // Update password
        const result = await providersService.updatePassword(
          input.newPassword,
          ctx.req.headers.authorization?.replace('Bearer ', '') || ''
        );

        if (!result.success) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: result.error || 'Password update failed',
          });
        }

        return {
          success: true,
          message: 'Password updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Password update failed',
        });
      }
    }),

  /**
   * Sign out
   */
  signOut: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        // Remove session from Redis
        const sessionCookie = ctx.req.cookies?.session;
        if (sessionCookie) {
          await sessionService.deleteSession(sessionCookie);
        }

        // Sign out from Supabase
        const token = ctx.req.headers.authorization?.replace('Bearer ', '') || '';
        await authService.signOutUser(token);

        return {
          success: true,
          message: 'Signed out successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Sign out failed',
        });
      }
    }),

  /**
   * Sign out from all devices
   */
  signOutAll: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const deletedCount = await sessionService.deleteAllUserSessions(ctx.user.id);

        return {
          success: true,
          data: { deletedSessions: deletedCount },
          message: 'Signed out from all devices successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sign out from all devices',
        });
      }
    }),

  /**
   * Get active sessions
   */
  getSessions: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const sessions = await sessionService.getUserSessions(
          ctx.user.id,
          ctx.req.cookies?.session
        );

        return {
          success: true,
          data: sessions,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get sessions',
        });
      }
    }),

  /**
   * Upload avatar
   */
  uploadAvatar: protectedProcedure
    .input(
      z.object({
        file: z.string(), // Base64 encoded file
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64 file
        const fileBuffer = Buffer.from(input.file, 'base64');

        // Get current profile to check for old avatar
        const currentProfile = await profileService.getProfile(ctx.user.id);
        const oldAvatarUrl = currentProfile?.avatarUrl;

        // Upload new avatar
        const uploadResult = await storageService.replaceAvatar(
          ctx.user.id,
          fileBuffer,
          input.fileName,
          input.mimeType,
          oldAvatarUrl
        );

        // Update profile with new avatar URL
        await profileService.updateProfile(ctx.user.id, {
          avatarUrl: uploadResult.publicUrl,
        });

        return {
          success: true,
          data: {
            avatarUrl: uploadResult.publicUrl,
            size: uploadResult.size,
          },
          message: 'Avatar uploaded successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Avatar upload failed',
        });
      }
    }),

  /**
   * Get current user profile
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const { user } = ctx;

      try {
        const userProfile = await profileService.getProfile(user.id);

        if (!userProfile) {
          // Create profile if it doesn't exist
          const newProfile = await profileService.createProfile(user.id, {
            displayName: user.email?.split('@')[0] || null,
          });

          return {
            success: true,
            data: newProfile,
          };
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
    .input(UpdateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const updatedProfile = await profileService.updateProfile(user.id, input);

        return {
          success: true,
          data: updatedProfile,
          message: 'Profile updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
        });
      }
    }),

  /**
   * Update privacy settings
   */
  updatePrivacySettings: protectedProcedure
    .input(PrivacySettingsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const updatedProfile = await profileService.updatePrivacySettings(
          ctx.user.id,
          input
        );

        return {
          success: true,
          data: updatedProfile.privacySettings,
          message: 'Privacy settings updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update privacy settings',
        });
      }
    }),

  /**
   * Update notification settings
   */
  updateNotificationSettings: protectedProcedure
    .input(NotificationSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const updatedProfile = await profileService.updateNotificationSettings(
          ctx.user.id,
          input
        );

        return {
          success: true,
          data: updatedProfile.notificationSettings,
          message: 'Notification settings updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification settings',
        });
      }
    }),

  /**
   * Create or sync user from Supabase Auth
   */
  syncUser: protectedProcedure
    .input(CreateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const existingProfile = await profileService.getProfile(user.id);

        if (existingProfile) {
          // Update existing profile
          const updatedProfile = await profileService.updateProfile(user.id, input);

          return {
            success: true,
            data: updatedProfile,
            message: 'User synced successfully',
          };
        } else {
          // Create new profile
          const newProfile = await profileService.createProfile(user.id, input);

          return {
            success: true,
            data: newProfile,
            message: 'User created successfully',
          };
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

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
      const { user } = ctx;

      try {
        const stats = await profileService.getProfileStats(user.id);

        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve user statistics',
        });
      }
    }),

  /**
   * Search profiles
   */
  searchProfiles: protectedProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const profiles = await profileService.searchProfiles(
          input.query,
          ctx.user.id,
          input.limit
        );

        return {
          success: true,
          data: profiles,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Profile search failed',
        });
      }
    }),

  /**
   * Delete account and all associated data
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().min(1),
        confirmation: z.string().refine((val) => val === 'DELETE', {
          message: 'Please type "DELETE" to confirm account deletion',
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Verify password before deletion
        const verifyResult = await providersService.signInWithEmail(
          ctx.user.email,
          input.password
        );

        if (verifyResult.error) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Password is incorrect',
          });
        }

        // Delete profile and all associated data
        const deleteResult = await profileService.deleteProfile(ctx.user.id);

        // Remove all sessions
        await sessionService.deleteAllUserSessions(ctx.user.id);

        return {
          success: true,
          data: {
            deletedItems: deleteResult.deletedItems,
          },
          message: 'Account deleted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Account deletion failed',
        });
      }
    }),
});