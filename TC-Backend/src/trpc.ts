// tRPC Server Setup
import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { Context, requireAuth } from './context';

// Initialize tRPC with context
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
  defaultMeta: {
    authRequired: false,
  },
});

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure that requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  try {
    requireAuth(ctx);
    return next({
      ctx: {
        ...ctx,
        user: ctx.user!, // TypeScript knows user is defined after requireAuth
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
});

/**
 * Admin procedure that requires admin role
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  try {
    requireAuth(ctx);

    if (ctx.user!.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin role required',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user!,
      },
    });
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
});

/**
 * Rate limited procedure (can be combined with other middlewares)
 */
export const rateLimitedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Rate limiting logic would go here
  // For now, just pass through
  // TODO: Implement Redis-based rate limiting

  return next();
});

// Custom middleware for logging
export const loggedProcedure = t.procedure.use(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  console.log(`[tRPC] ${type} ${path} took ${durationMs}ms`);

  return result;
});

// Middleware for input validation logging
export const validatedProcedure = t.procedure.use(async ({ input, next }) => {
  console.log(`[tRPC] Input:`, input);
  const result = await next();
  console.log(`[tRPC] Output:`, result);
  return result;
});