// tRPC Context with Supabase Auth
import { inferAsyncReturnType } from '@trpc/server';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { PrismaClient } from '@prisma/client';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import * as jwt from 'jsonwebtoken';

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Supabase (for JWT validation)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/**
 * Extract user from Authorization header using Supabase JWT
 */
async function extractUser(authorization?: string): Promise<AuthUser | null> {
  if (!authorization) {
    return null;
  }

  try {
    // Extract token from "Bearer <token>" format
    const token = authorization.replace('Bearer ', '');

    if (!token) {
      return null;
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('Failed to verify token:', error?.message);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: user.user_metadata?.role || 'user',
    };
  } catch (error) {
    console.error('Error extracting user from token:', error);
    return null;
  }
}

/**
 * Create tRPC context
 */
export async function createContext({ req }: CreateFastifyContextOptions) {
  // Extract user from Authorization header
  const user = await extractUser(req.headers.authorization);

  return {
    req,
    prisma,
    supabase,
    user,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

/**
 * Helper to ensure user is authenticated
 */
export function requireAuth(ctx: Context): asserts ctx is Context & { user: NonNullable<Context['user']> } {
  if (!ctx.user) {
    throw new Error('UNAUTHORIZED');
  }
}

/**
 * Helper to ensure user has specific role
 */
export function requireRole(ctx: Context, requiredRole: string): asserts ctx is Context & { user: NonNullable<Context['user']> } {
  requireAuth(ctx);

  if (ctx.user.role !== requiredRole && ctx.user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
}

// Export Prisma instance for use in other modules
export { prisma };

// Cleanup function for graceful shutdown
export async function cleanup() {
  await prisma.$disconnect();
}