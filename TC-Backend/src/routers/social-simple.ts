// Simplified Social Router - Lists, friends, activity feeds
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const socialRouter = router({
  /**
   * Create a custom list
   */
  createList: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        privacy: z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']).default('PRIVATE'),
        contentIds: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const customList = await prisma.customList.create({
          data: {
            userId: user.id,
            title: input.title,
            description: input.description,
            privacy: input.privacy,
          },
        });

        // Add content to list if provided
        if (input.contentIds && input.contentIds.length > 0) {
          await prisma.listItem.createMany({
            data: input.contentIds.map((contentId, index) => ({
              listId: customList.id,
              contentId,
              orderIndex: index,
            })),
          });
        }

        // Fetch the complete list with content
        const completeList = await prisma.customList.findUnique({
          where: { id: customList.id },
          include: {
            listItems: {
              orderBy: { orderIndex: 'asc' },
              include: {
                content: {
                  select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    contentType: true,
                  },
                },
              },
            },
          },
        });

        return {
          success: true,
          data: completeList,
          message: 'List created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create list',
        });
      }
    }),

  /**
   * Get user's lists
   */
  getLists: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid().optional(), // If not provided, get current user's lists
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const { userId = user.id, page, limit } = input;

      try {
        const isOwnLists = userId === user.id;
        const where: any = { userId };

        // If viewing another user's lists, only show public and friends lists
        if (!isOwnLists) {
          where.privacy = {
            in: ['PUBLIC', 'FRIENDS'],
          };
        }

        const skip = (page - 1) * limit;

        const [lists, total] = await Promise.all([
          prisma.customList.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              updatedAt: 'desc',
            },
            include: {
              listItems: {
                take: 5, // Preview of first 5 items
                orderBy: { orderIndex: 'asc' },
                include: {
                  content: {
                    select: {
                      id: true,
                      title: true,
                      posterUrl: true,
                    },
                  },
                },
              },
            },
          }),
          prisma.customList.count({ where }),
        ]);

        return {
          success: true,
          data: lists,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + lists.length < total,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve lists',
        });
      }
    }),

  /**
   * Get a specific list
   */
  getList: protectedProcedure
    .input(z.object({ listId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const list = await prisma.customList.findUnique({
          where: { id: input.listId },
          include: {
            userProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            listItems: {
              orderBy: { orderIndex: 'asc' },
              include: {
                content: true,
              },
            },
          },
        });

        if (!list) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'List not found',
          });
        }

        // Check if user can view this list
        const canView =
          list.userId === user.id ||
          list.privacy === 'PUBLIC' ||
          (list.privacy === 'FRIENDS'); // TODO: Add friend check

        if (!canView) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view this list',
          });
        }

        return {
          success: true,
          data: list,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve list',
        });
      }
    }),

  /**
   * Update a list
   */
  updateList: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        privacy: z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Check if user owns the list
        const list = await prisma.customList.findUnique({
          where: { id: input.listId },
        });

        if (!list) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'List not found',
          });
        }

        if (list.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only update your own lists',
          });
        }

        const updatedList = await prisma.customList.update({
          where: { id: input.listId },
          data: {
            title: input.title,
            description: input.description,
            privacy: input.privacy,
            updatedAt: new Date(),
          },
          include: {
            listItems: {
              orderBy: { orderIndex: 'asc' },
              include: {
                content: {
                  select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                  },
                },
              },
            },
          },
        });

        return {
          success: true,
          data: updatedList,
          message: 'List updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update list',
        });
      }
    }),

  /**
   * Delete a list
   */
  deleteList: protectedProcedure
    .input(z.object({ listId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const list = await prisma.customList.findUnique({
          where: { id: input.listId },
        });

        if (!list) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'List not found',
          });
        }

        if (list.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only delete your own lists',
          });
        }

        await prisma.customList.delete({
          where: { id: input.listId },
        });

        return {
          success: true,
          message: 'List deleted successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete list',
        });
      }
    }),

  /**
   * Add content to list
   */
  addToList: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        contentId: z.string().uuid(),
        position: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Verify list ownership
        const list = await prisma.customList.findUnique({
          where: { id: input.listId },
        });

        if (!list) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'List not found',
          });
        }

        if (list.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only modify your own lists',
          });
        }

        // Check if content already exists in list
        const existingItem = await prisma.listItem.findUnique({
          where: {
            listId_contentId: {
              listId: input.listId,
              contentId: input.contentId,
            },
          },
        });

        if (existingItem) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Content already exists in this list',
          });
        }

        // Get the next order position if not specified
        const orderIndex = input.position ?? (
          await prisma.listItem.count({ where: { listId: input.listId } })
        );

        const listItem = await prisma.listItem.create({
          data: {
            listId: input.listId,
            contentId: input.contentId,
            orderIndex,
            notes: input.notes,
          },
          include: {
            content: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                contentType: true,
              },
            },
          },
        });

        // Update list timestamp
        await prisma.customList.update({
          where: { id: input.listId },
          data: { updatedAt: new Date() },
        });

        return {
          success: true,
          data: listItem,
          message: 'Content added to list',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add content to list',
        });
      }
    }),

  /**
   * Remove content from list
   */
  removeFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string().uuid(),
        contentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Verify list ownership
        const list = await prisma.customList.findUnique({
          where: { id: input.listId },
        });

        if (!list) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'List not found',
          });
        }

        if (list.userId !== user.id) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only modify your own lists',
          });
        }

        await prisma.listItem.delete({
          where: {
            listId_contentId: {
              listId: input.listId,
              contentId: input.contentId,
            },
          },
        });

        // Update list timestamp
        await prisma.customList.update({
          where: { id: input.listId },
          data: { updatedAt: new Date() },
        });

        return {
          success: true,
          message: 'Content removed from list',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove content from list',
        });
      }
    }),

  /**
   * Get activity feed
   */
  getActivityFeed: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const { page, limit } = input;

      try {
        const skip = (page - 1) * limit;

        // Get recent social activities
        const activities = await prisma.socialActivity.findMany({
          where: {
            userId: { not: user.id }, // Exclude current user's activities
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            userProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            content: {
              select: {
                id: true,
                title: true,
                posterUrl: true,
                contentType: true,
              },
            },
            customList: {
              select: {
                id: true,
                title: true,
                privacy: true,
              },
            },
          },
        });

        return {
          success: true,
          data: activities,
          pagination: {
            page,
            limit,
            hasMore: activities.length === limit,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve activity feed',
        });
      }
    }),
});