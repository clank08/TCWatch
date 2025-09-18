// Simplified Content Router - Search, tracking, recommendations
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const contentRouter = router({
  /**
   * Search for content
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        contentType: z.enum(['MOVIE', 'TV_SERIES', 'DOCUMENTARY', 'PODCAST']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { query, contentType, page, limit } = input;

      try {
        const where: any = {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        };

        if (contentType) {
          where.contentType = contentType;
        }

        const skip = (page - 1) * limit;

        const [content, total] = await Promise.all([
          prisma.content.findMany({
            where,
            skip,
            take: limit,
            orderBy: [
              { releaseDate: 'desc' },
              { title: 'asc' },
            ],
            select: {
              id: true,
              title: true,
              description: true,
              contentType: true,
              genreTags: true,
              caseTags: true,
              releaseDate: true,
              runtimeMinutes: true,
              posterUrl: true,
              platforms: true,
              totalSeasons: true,
              totalEpisodes: true,
              status: true,
            },
          }),
          prisma.content.count({ where }),
        ]);

        return {
          success: true,
          data: content,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + content.length < total,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search content',
        });
      }
    }),

  /**
   * Get content by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;

      try {
        const content = await prisma.content.findUnique({
          where: { id: input.id },
          include: {
            contentCaseLinks: {
              include: {
                contentCase: true,
              },
            },
          },
        });

        if (!content) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Content not found',
          });
        }

        return {
          success: true,
          data: content,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve content',
        });
      }
    }),

  /**
   * Track content (add to user's list)
   */
  track: protectedProcedure
    .input(
      z.object({
        contentId: z.string().uuid(),
        status: z.enum(['WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'ABANDONED']),
        rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
        platformWatched: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Check if content exists
        const content = await prisma.content.findUnique({
          where: { id: input.contentId },
        });

        if (!content) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Content not found',
          });
        }

        // Check if already tracking
        const existingTracking = await prisma.userContent.findUnique({
          where: {
            userId_contentId: {
              userId: user.id,
              contentId: input.contentId,
            },
          },
        });

        let userContent;

        if (existingTracking) {
          // Update existing tracking
          userContent = await prisma.userContent.update({
            where: {
              userId_contentId: {
                userId: user.id,
                contentId: input.contentId,
              },
            },
            data: {
              status: input.status,
              rating: input.rating,
              notes: input.notes,
              tags: input.tags || [],
              platformWatched: input.platformWatched,
              dateStarted: input.status === 'WATCHING' ? new Date() : existingTracking.dateStarted,
              dateCompleted: input.status === 'COMPLETED' ? new Date() : null,
              updatedAt: new Date(),
            },
            include: {
              content: true,
            },
          });
        } else {
          // Create new tracking
          userContent = await prisma.userContent.create({
            data: {
              userId: user.id,
              contentId: input.contentId,
              status: input.status,
              rating: input.rating,
              notes: input.notes,
              tags: input.tags || [],
              platformWatched: input.platformWatched,
              dateStarted: input.status === 'WATCHING' ? new Date() : undefined,
              dateCompleted: input.status === 'COMPLETED' ? new Date() : undefined,
            },
            include: {
              content: true,
            },
          });
        }

        return {
          success: true,
          data: userContent,
          message: existingTracking ? 'Tracking updated' : 'Content added to tracking',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to track content',
        });
      }
    }),

  /**
   * Remove content from tracking
   */
  untrack: protectedProcedure
    .input(z.object({ contentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        const userContent = await prisma.userContent.findUnique({
          where: {
            userId_contentId: {
              userId: user.id,
              contentId: input.contentId,
            },
          },
        });

        if (!userContent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Content not found in your tracking list',
          });
        }

        await prisma.userContent.delete({
          where: {
            userId_contentId: {
              userId: user.id,
              contentId: input.contentId,
            },
          },
        });

        return {
          success: true,
          message: 'Content removed from tracking',
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to remove content from tracking',
        });
      }
    }),

  /**
   * Get user's tracked content
   */
  getTracked: protectedProcedure
    .input(
      z.object({
        status: z.enum(['WANT_TO_WATCH', 'WATCHING', 'COMPLETED', 'ABANDONED']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;
      const { status, page, limit } = input;

      try {
        const where: any = { userId: user.id };

        if (status) {
          where.status = status;
        }

        const skip = (page - 1) * limit;

        const [userContent, total] = await Promise.all([
          prisma.userContent.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
              updatedAt: 'desc',
            },
            include: {
              content: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  contentType: true,
                  genreTags: true,
                  caseTags: true,
                  releaseDate: true,
                  posterUrl: true,
                  platforms: true,
                },
              },
            },
          }),
          prisma.userContent.count({ where }),
        ]);

        return {
          success: true,
          data: userContent,
          pagination: {
            page,
            limit,
            total,
            hasMore: skip + userContent.length < total,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to retrieve tracked content',
        });
      }
    }),

  /**
   * Get recommendations for user
   */
  getRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        type: z.enum(['trending', 'similar', 'new']).default('trending'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user, prisma } = ctx;

      try {
        // Simple recommendations based on type
        let recommendations;

        switch (input.type) {
          case 'trending':
            recommendations = await prisma.content.findMany({
              take: input.limit,
              orderBy: {
                createdAt: 'desc',
              },
              where: {
                userContent: {
                  none: {
                    userId: user.id,
                  },
                },
              },
              select: {
                id: true,
                title: true,
                description: true,
                contentType: true,
                genreTags: true,
                caseTags: true,
                releaseDate: true,
                posterUrl: true,
                platforms: true,
              },
            });
            break;

          case 'similar':
            // Get user's favorite genres from their tracked content
            const userInterests = await prisma.userProfile.findUnique({
              where: { userId: user.id },
              select: { interests: true },
            });

            recommendations = await prisma.content.findMany({
              where: {
                genreTags: {
                  hasSome: userInterests?.interests || [],
                },
                userContent: {
                  none: {
                    userId: user.id,
                  },
                },
              },
              take: input.limit,
              orderBy: {
                releaseDate: 'desc',
              },
              select: {
                id: true,
                title: true,
                description: true,
                contentType: true,
                genreTags: true,
                caseTags: true,
                releaseDate: true,
                posterUrl: true,
                platforms: true,
              },
            });
            break;

          default: // new
            recommendations = await prisma.content.findMany({
              where: {
                userContent: {
                  none: {
                    userId: user.id,
                  },
                },
                releaseDate: {
                  gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
                },
              },
              take: input.limit,
              orderBy: {
                releaseDate: 'desc',
              },
              select: {
                id: true,
                title: true,
                description: true,
                contentType: true,
                genreTags: true,
                caseTags: true,
                releaseDate: true,
                posterUrl: true,
                platforms: true,
              },
            });
        }

        return {
          success: true,
          data: recommendations,
          message: `${input.type} recommendations`,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get recommendations',
        });
      }
    }),
});