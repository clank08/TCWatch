// Enhanced JWT Validation Middleware with Refresh Token Support
import { FastifyRequest, FastifyReply } from 'fastify';
import { TRPCError } from '@trpc/server';
import { AuthService } from '../../services/auth/auth.service';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

interface AuthRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  session?: {
    sessionId: string;
    expiresAt: Date;
  };
}

export class JWTMiddleware {
  private authService: AuthService;

  constructor(prisma: PrismaClient, redis: Redis) {
    this.authService = new AuthService(prisma, redis);
  }

  /**
   * Extract and validate JWT token from request headers
   */
  async validateToken(req: AuthRequest, reply: FastifyReply): Promise<void> {
    try {
      const authorization = req.headers.authorization;
      const sessionCookie = req.cookies?.session;

      // Try to get token from Authorization header first
      let token: string | null = null;
      if (authorization && authorization.startsWith('Bearer ')) {
        token = authorization.replace('Bearer ', '');
      }

      // If no Bearer token, try session cookie approach
      if (!token && sessionCookie) {
        const sessionData = await this.authService.validateSession(sessionCookie);
        if (sessionData) {
          req.user = sessionData;
          req.session = {
            sessionId: sessionCookie,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          };
          return;
        }
      }

      if (!token) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        });
      }

      // Verify token with Supabase
      const user = await this.authService.verifyToken(token);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        });
      }

      // Set user context
      req.user = {
        id: user.id,
        email: user.email!,
        role: user.user_metadata?.role || 'user',
      };

    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication failed',
      });
    }
  }

  /**
   * Middleware for optional authentication (doesn't throw if no token)
   */
  async optionalAuth(req: AuthRequest, reply: FastifyReply): Promise<void> {
    try {
      await this.validateToken(req, reply);
    } catch (error) {
      // Silently continue without user context for optional auth
      req.user = undefined;
    }
  }

  /**
   * Middleware for required authentication
   */
  async requireAuth(req: AuthRequest, reply: FastifyReply): Promise<void> {
    await this.validateToken(req, reply);

    if (!req.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }
  }

  /**
   * Middleware for role-based access control
   */
  async requireRole(requiredRole: string) {
    return async (req: AuthRequest, reply: FastifyReply): Promise<void> => {
      await this.requireAuth(req, reply);

      if (!req.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      if (req.user.role !== requiredRole && req.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Role '${requiredRole}' required`,
        });
      }
    };
  }

  /**
   * Middleware for admin access
   */
  async requireAdmin(req: AuthRequest, reply: FastifyReply): Promise<void> {
    await this.requireAuth(req, reply);

    if (!req.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    if (req.user.role !== 'admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required',
      });
    }
  }

  /**
   * Refresh token endpoint handler
   */
  async handleRefreshToken(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      const { refresh_token } = req.body as { refresh_token: string };

      if (!refresh_token) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Refresh token required',
        });
      }

      const tokens = await this.authService.refreshToken(refresh_token);

      if (!tokens) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      // Verify the new access token to get user info
      const user = await this.authService.verifyToken(tokens.accessToken);
      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Failed to verify refreshed token',
        });
      }

      // Create new session
      const sessionId = await this.authService.createSession(
        user.id,
        user.email!,
        tokens.refreshToken,
        req.ip,
        req.headers['user-agent']
      );

      // Set secure session cookie
      reply.setCookie('session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: tokens.refreshExpiresIn * 1000, // Convert to milliseconds
        path: '/',
      });

      reply.send({
        success: true,
        data: {
          access_token: tokens.accessToken,
          expires_in: tokens.expiresIn,
        },
      });

    } catch (error) {
      if (error instanceof TRPCError) {
        reply.code(error.code === 'UNAUTHORIZED' ? 401 : 400);
        reply.send({
          success: false,
          error: error.message,
        });
        return;
      }

      reply.code(500);
      reply.send({
        success: false,
        error: 'Token refresh failed',
      });
    }
  }

  /**
   * Logout endpoint handler
   */
  async handleLogout(req: AuthRequest, reply: FastifyReply): Promise<void> {
    try {
      const sessionCookie = req.cookies?.session;

      if (sessionCookie) {
        await this.authService.removeSession(sessionCookie);
      }

      // Clear session cookie
      reply.clearCookie('session', {
        path: '/',
      });

      // If user is authenticated via Bearer token, sign out from Supabase
      const authorization = req.headers.authorization;
      if (authorization && authorization.startsWith('Bearer ')) {
        const token = authorization.replace('Bearer ', '');
        await this.authService.signOutUser(token);
      }

      reply.send({
        success: true,
        message: 'Logged out successfully',
      });

    } catch (error) {
      reply.code(500);
      reply.send({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Logout from all devices
   */
  async handleLogoutAll(req: AuthRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!req.user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        });
      }

      // Remove all sessions for the user
      await this.authService.removeAllUserSessions(req.user.id);

      // Clear session cookie
      reply.clearCookie('session', {
        path: '/',
      });

      reply.send({
        success: true,
        message: 'Logged out from all devices successfully',
      });

    } catch (error) {
      if (error instanceof TRPCError) {
        reply.code(error.code === 'UNAUTHORIZED' ? 401 : 400);
        reply.send({
          success: false,
          error: error.message,
        });
        return;
      }

      reply.code(500);
      reply.send({
        success: false,
        error: 'Logout failed',
      });
    }
  }
}