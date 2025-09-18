// User Profile CRUD Operations Service
import { PrismaClient, UserProfile } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Validation schemas
export const CreateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  interests: z.array(z.string()).max(20).optional(),
  privacySettings: z.record(z.any()).optional(),
  notificationSettings: z.record(z.any()).optional(),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  interests: z.array(z.string()).max(20).optional(),
  privacySettings: z.record(z.any()).optional(),
  notificationSettings: z.record(z.any()).optional(),
});

export const PrivacySettingsSchema = z.object({
  profile_visible: z.boolean().optional(),
  activity_visible: z.boolean().optional(),
  allow_friend_requests: z.boolean().optional(),
  show_watching_list: z.boolean().optional(),
  show_completed_list: z.boolean().optional(),
  show_want_to_watch_list: z.boolean().optional(),
  show_dropped_list: z.boolean().optional(),
  allow_list_sharing: z.boolean().optional(),
  searchable_by_email: z.boolean().optional(),
  allow_activity_notifications: z.boolean().optional(),
});

export const NotificationSettingsSchema = z.object({
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  new_content_alerts: z.boolean().optional(),
  friend_activity: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),
  cable_reminders: z.boolean().optional(),
  list_updates: z.boolean().optional(),
  friend_requests: z.boolean().optional(),
  challenge_updates: z.boolean().optional(),
  system_announcements: z.boolean().optional(),
});

export interface ProfileStats {
  totalContent: number;
  watchingCount: number;
  completedCount: number;
  wantToWatchCount: number;
  droppedCount: number;
  listsCount: number;
  friendsCount: number;
  achievementsCount: number;
  joinedDate: Date;
  lastActiveDate: Date;
}

export class ProfileService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new user profile
   */
  async createProfile(
    userId: string,
    profileData: z.infer<typeof CreateProfileSchema>
  ): Promise<UserProfile> {
    try {
      // Validate input data
      const validatedData = CreateProfileSchema.parse(profileData);

      // Check if profile already exists
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User profile already exists',
        });
      }

      // Set default privacy settings
      const defaultPrivacySettings = {
        profile_visible: true,
        activity_visible: true,
        allow_friend_requests: true,
        show_watching_list: true,
        show_completed_list: true,
        show_want_to_watch_list: true,
        show_dropped_list: false,
        allow_list_sharing: true,
        searchable_by_email: true,
        allow_activity_notifications: true,
        ...validatedData.privacySettings,
      };

      // Set default notification settings
      const defaultNotificationSettings = {
        push_enabled: true,
        email_enabled: true,
        new_content_alerts: true,
        friend_activity: true,
        weekly_digest: true,
        cable_reminders: true,
        list_updates: true,
        friend_requests: true,
        challenge_updates: true,
        system_announcements: false,
        ...validatedData.notificationSettings,
      };

      const profile = await this.prisma.userProfile.create({
        data: {
          userId,
          displayName: validatedData.displayName,
          avatarUrl: validatedData.avatarUrl,
          interests: validatedData.interests || [],
          privacySettings: defaultPrivacySettings,
          notificationSettings: defaultNotificationSettings,
        },
      });

      return profile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid profile data',
          cause: error,
        });
      }

      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to create profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user profile',
      });
    }
  }

  /**
   * Get user profile by user ID
   */
  async getProfile(userId: string, requestingUserId?: string): Promise<UserProfile | null> {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        return null;
      }

      // Apply privacy settings if requested by different user
      if (requestingUserId && requestingUserId !== userId) {
        const privacySettings = profile.privacySettings as any;

        if (!privacySettings?.profile_visible) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Profile is private',
          });
        }

        // Filter sensitive information based on privacy settings
        return {
          ...profile,
          // Hide certain fields based on privacy settings
          interests: privacySettings?.activity_visible ? profile.interests : [],
        };
      }

      return profile;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to get profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve user profile',
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    profileData: z.infer<typeof UpdateProfileSchema>
  ): Promise<UserProfile> {
    try {
      // Validate input data
      const validatedData = UpdateProfileSchema.parse(profileData);

      // Check if profile exists
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      // Update profile with validated data
      const updatedProfile = await this.prisma.userProfile.update({
        where: { userId },
        data: {
          displayName: validatedData.displayName ?? undefined,
          avatarUrl: validatedData.avatarUrl ?? undefined,
          interests: validatedData.interests ?? undefined,
          privacySettings: validatedData.privacySettings ?? undefined,
          notificationSettings: validatedData.notificationSettings ?? undefined,
          updatedAt: new Date(),
        },
      });

      return updatedProfile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid profile data',
          cause: error,
        });
      }

      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to update profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user profile',
      });
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(
    userId: string,
    privacySettings: z.infer<typeof PrivacySettingsSchema>
  ): Promise<UserProfile> {
    try {
      // Validate privacy settings
      const validatedSettings = PrivacySettingsSchema.parse(privacySettings);

      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      // Merge with existing privacy settings
      const currentSettings = existingProfile.privacySettings as any;
      const newSettings = {
        ...currentSettings,
        ...validatedSettings,
      };

      const updatedProfile = await this.prisma.userProfile.update({
        where: { userId },
        data: {
          privacySettings: newSettings,
          updatedAt: new Date(),
        },
      });

      return updatedProfile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid privacy settings',
          cause: error,
        });
      }

      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to update privacy settings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update privacy settings',
      });
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    notificationSettings: z.infer<typeof NotificationSettingsSchema>
  ): Promise<UserProfile> {
    try {
      // Validate notification settings
      const validatedSettings = NotificationSettingsSchema.parse(notificationSettings);

      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      // Merge with existing notification settings
      const currentSettings = existingProfile.notificationSettings as any;
      const newSettings = {
        ...currentSettings,
        ...validatedSettings,
      };

      const updatedProfile = await this.prisma.userProfile.update({
        where: { userId },
        data: {
          notificationSettings: newSettings,
          updatedAt: new Date(),
        },
      });

      return updatedProfile;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid notification settings',
          cause: error,
        });
      }

      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to update notification settings:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update notification settings',
      });
    }
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteProfile(userId: string): Promise<{ success: boolean; deletedItems: string[] }> {
    try {
      const deletedItems: string[] = [];

      // Start a transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Delete user content tracking
        const userContentDeleted = await tx.userContent.deleteMany({
          where: { userId },
        });
        if (userContentDeleted.count > 0) {
          deletedItems.push(`${userContentDeleted.count} user content items`);
        }

        // Delete episode progress
        const episodeProgressDeleted = await tx.episodeProgress.deleteMany({
          where: { userId },
        });
        if (episodeProgressDeleted.count > 0) {
          deletedItems.push(`${episodeProgressDeleted.count} episode progress records`);
        }

        // Delete custom lists
        const customListsDeleted = await tx.customList.deleteMany({
          where: { userId },
        });
        if (customListsDeleted.count > 0) {
          deletedItems.push(`${customListsDeleted.count} custom lists`);
        }

        // Delete friendships
        const friendshipsDeleted = await tx.friendship.deleteMany({
          where: {
            OR: [
              { requesterId: userId },
              { addresseeId: userId },
            ],
          },
        });
        if (friendshipsDeleted.count > 0) {
          deletedItems.push(`${friendshipsDeleted.count} friendships`);
        }

        // Delete social activities
        const socialActivitiesDeleted = await tx.socialActivity.deleteMany({
          where: { userId },
        });
        if (socialActivitiesDeleted.count > 0) {
          deletedItems.push(`${socialActivitiesDeleted.count} social activities`);
        }

        // Delete notifications
        const notificationsDeleted = await tx.notification.deleteMany({
          where: { userId },
        });
        if (notificationsDeleted.count > 0) {
          deletedItems.push(`${notificationsDeleted.count} notifications`);
        }

        // Finally, delete the user profile
        const profileDeleted = await tx.userProfile.delete({
          where: { userId },
        });
        deletedItems.push('user profile');

        return { success: true, deletedItems };
      });

      return result;
    } catch (error) {
      console.error('Failed to delete profile:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user profile',
      });
    }
  }

  /**
   * Get user profile statistics
   */
  async getProfileStats(userId: string): Promise<ProfileStats> {
    try {
      const [
        profile,
        totalContent,
        watchingCount,
        completedCount,
        wantToWatchCount,
        droppedCount,
        listsCount,
        friendsCount,
      ] = await Promise.all([
        this.prisma.userProfile.findUnique({
          where: { userId },
          select: { createdAt: true, updatedAt: true },
        }),
        this.prisma.userContent.count({ where: { userId } }),
        this.prisma.userContent.count({
          where: { userId, status: 'WATCHING' }
        }),
        this.prisma.userContent.count({
          where: { userId, status: 'COMPLETED' }
        }),
        this.prisma.userContent.count({
          where: { userId, status: 'WANT_TO_WATCH' }
        }),
        this.prisma.userContent.count({
          where: { userId, status: 'DROPPED' }
        }),
        this.prisma.customList.count({ where: { userId } }),
        this.prisma.friendship.count({
          where: {
            OR: [
              { requesterId: userId, status: 'ACCEPTED' },
              { addresseeId: userId, status: 'ACCEPTED' }
            ]
          }
        }),
      ]);

      if (!profile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User profile not found',
        });
      }

      return {
        totalContent,
        watchingCount,
        completedCount,
        wantToWatchCount,
        droppedCount,
        listsCount,
        friendsCount,
        achievementsCount: 0, // TODO: Implement achievements
        joinedDate: profile.createdAt,
        lastActiveDate: profile.updatedAt,
      };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      console.error('Failed to get profile stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve profile statistics',
      });
    }
  }

  /**
   * Search profiles by display name or email (respecting privacy settings)
   */
  async searchProfiles(
    query: string,
    requestingUserId: string,
    limit: number = 20
  ): Promise<UserProfile[]> {
    try {
      // Search for profiles where privacy allows it
      const profiles = await this.prisma.userProfile.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  displayName: {
                    contains: query,
                    mode: 'insensitive',
                  },
                },
                // Note: We can't search by email directly from UserProfile
                // This would require joining with Supabase auth.users
              ],
            },
            {
              // Only include profiles that are searchable
              privacySettings: {
                path: ['profile_visible'],
                equals: true,
              },
            },
            {
              // Don't include the requesting user
              userId: {
                not: requestingUserId,
              },
            },
          ],
        },
        take: limit,
        select: {
          id: true,
          userId: true,
          displayName: true,
          avatarUrl: true,
          interests: true,
          createdAt: true,
          updatedAt: true,
          privacySettings: true,
          notificationSettings: true,
        },
      });

      // Filter out sensitive information based on privacy settings
      return profiles.map(profile => {
        const privacySettings = profile.privacySettings as any;

        return {
          ...profile,
          interests: privacySettings?.activity_visible ? profile.interests : [],
        };
      });
    } catch (error) {
      console.error('Failed to search profiles:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search user profiles',
      });
    }
  }

  /**
   * Check if a profile exists
   */
  async profileExists(userId: string): Promise<boolean> {
    try {
      const profile = await this.prisma.userProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      return !!profile;
    } catch (error) {
      console.error('Failed to check profile existence:', error);
      return false;
    }
  }
}