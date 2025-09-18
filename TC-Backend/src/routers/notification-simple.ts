// Simplified Notification Router - Alerts and digest management
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const notificationRouter = router({
  /**
   * Get user's notifications
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().default(false),
        type: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const { unreadOnly, type, page, limit } = input;

      try {
        const where: any = { userId: user.id };

        if (unreadOnly) {
          where.read = false;
        }

        if (type) {
          where.type = type;
        }

        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              sentAt: 'desc',
            },
          }),
          prisma.notification.count({ where }),
          prisma.notification.count({
            where: {
              userId: user.id,
              read: false,
            },
          }),
        ]);

        return {
          success: true,
          data: notifications,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + notifications.length < total,
          },
          unreadCount,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve notifications',
        });
      }
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const notification = await prisma.notification.findUnique({
          where: { id: input.notificationId },
        });

        if (!notification) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Notification not found',
          });
        }

        if (notification.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only mark your own notifications as read',
          });
        }

        const updatedNotification = await prisma.notification.update({
          where: { id: input.notificationId },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        return {
          success: true,
          data: updatedNotification,
          message: 'Notification marked as read',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read',
        });
      }
    }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const result = await prisma.notification.updateMany({
          where: {
            userId: user.id,
            read: false,
          },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        return {
          success: true,
          data: { count: result.count },
          message: `${result.count} notifications marked as read`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notifications as read',
        });
      }
    }),

  /**
   * Delete notification
   */
  deleteNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const notification = await prisma.notification.findUnique({
          where: { id: input.notificationId },
        });

        if (!notification) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Notification not found',
          });
        }

        if (notification.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own notifications',
          });
        }

        await prisma.notification.delete({
          where: { id: input.notificationId },
        });

        return {
          success: true,
          message: 'Notification deleted',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification',
        });
      }
    }),

  /**
   * Create notification (internal use)
   */
  createNotification: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.string(),
        title: z.string().min(1).max(255),
        message: z.string().min(1),
        data: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx;

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            data: input.data,
          },
        });

        return {
          success: true,
          data: notification,
          message: 'Notification created',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create notification',
        });
      }
    }),

  /**
   * Get notification preferences
   */
  getPreferences: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const userRecord = await prisma.userProfile.findUnique({
          where: { userId: user.id },
          select: {
            notificationSettings: true,
          },
        });

        if (!userRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        return {
          success: true,
          data: userRecord.notificationSettings,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve notification preferences',
        });
      }
    }),

  /**
   * Update notification preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        pushEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        newContentAlerts: z.boolean().optional(),
        friendActivity: z.boolean().optional(),
        weeklyDigest: z.boolean().optional(),
        cableReminders: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Get current preferences
        const userRecord = await prisma.userProfile.findUnique({
          where: { userId: user.id },
          select: { notificationSettings: true },
        });

        if (!userRecord) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }

        const currentSettings = userRecord.notificationSettings as any || {};

        // Update notification preferences
        const updatedSettings = {
          ...currentSettings,
          push_enabled: input.pushEnabled ?? currentSettings.push_enabled,
          email_enabled: input.emailEnabled ?? currentSettings.email_enabled,
          new_content_alerts: input.newContentAlerts ?? currentSettings.new_content_alerts,
          friend_activity: input.friendActivity ?? currentSettings.friend_activity,
          weekly_digest: input.weeklyDigest ?? currentSettings.weekly_digest,
          cable_reminders: input.cableReminders ?? currentSettings.cable_reminders,
        };

        await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            notificationSettings: updatedSettings,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          data: updatedSettings,
          message: 'Notification preferences updated',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update notification preferences',
        });
      }
    }),

  /**
   * Send test notification
   */
  sendTestNotification: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const notification = await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'system',
            title: 'Test Notification',
            message: 'This is a test notification to verify your notification settings are working correctly.',
            data: {
              isTest: true,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return {
          success: true,
          data: notification,
          message: 'Test notification sent',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send test notification',
        });
      }
    }),

  /**
   * Get unread count
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const { user, prisma } = ctx;

      try {
        const unreadCount = await prisma.notification.count({
          where: {
            userId: user.id,
            read: false,
          },
        });

        return {
          success: true,
          data: { count: unreadCount },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get unread count',
        });
      }
    }),

  /**
   * Clear old notifications
   */
  clearOldNotifications: protectedProcedure
    .input(
      z.object({
        olderThanDays: z.number().min(1).max(365).default(30),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - input.olderThanDays);

        const result = await prisma.notification.deleteMany({
          where: {
            userId: user.id,
            read: true,
            sentAt: {
              lt: cutoffDate,
            },
          },
        });

        return {
          success: true,
          data: { deletedCount: result.count },
          message: `Deleted ${result.count} old notifications`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clear old notifications',
        });
      }
    }),
});