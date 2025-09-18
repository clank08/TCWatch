// Enhanced Fastify Server with Security Middleware
import fastify, { FastifyInstance } from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createContext } from './context';
import { router } from './routers';
import { SecurityMiddleware } from './middleware/auth/security.middleware';
import { RateLimitMiddleware } from './middleware/auth/rate-limit.middleware';
import { JWTMiddleware } from './middleware/auth/jwt.middleware';
import { StorageService } from './services/auth/storage.service';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

// Initialize services
const redis = new Redis(process.env.REDIS_URL!);
const prisma = new PrismaClient();

// Initialize middleware
const securityMiddleware = new SecurityMiddleware({
  allowedOrigins: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
});

const rateLimitMiddleware = new RateLimitMiddleware(redis, {
  enableBruteForceProtection: true,
  maxFailedAttempts: 5,
  lockoutDuration: 15,
  enableRateLimiting: true,
});

const jwtMiddleware = new JWTMiddleware(prisma, redis);
const storageService = new StorageService();

export async function createServer(): Promise<FastifyInstance> {
  const server = fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      } : undefined,
    },
    maxParamLength: 5000,
    bodyLimit: 50 * 1024 * 1024, // 50MB
    keepAliveTimeout: 30000,
    requestIdHeader: 'x-request-id',
  });

  // Register essential plugins
  await server.register(import('@fastify/helmet'), {\n    contentSecurityPolicy: {\n      directives: {\n        defaultSrc: [\"'self'\"],\n        scriptSrc: [\"'self'\", \"'unsafe-inline'\"],\n        styleSrc: [\"'self'\", \"'unsafe-inline'\"],\n        imgSrc: [\"'self'\", \"data:\", \"https:\"],\n        fontSrc: [\"'self'\", \"https:\"],\n        connectSrc: [\"'self'\", \"https:\"],\n        mediaSrc: [\"'self'\"],\n        objectSrc: [\"'none'\"],\n        childSrc: [\"'none'\"],\n        frameAncestors: [\"'none'\"],\n        formAction: [\"'self'\"],\n        baseUri: [\"'self'\"],\n        upgradeInsecureRequests: process.env.NODE_ENV === 'production'\n      }\n    },\n    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',\n    hsts: process.env.NODE_ENV === 'production' ? {\n      maxAge: 31536000,\n      includeSubDomains: true,\n      preload: true\n    } : false\n  });

  await server.register(import('@fastify/cors'), {\n    origin: (origin, callback) => {\n      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:19006'];\n      \n      // Allow requests with no origin (mobile apps, etc.)\n      if (!origin) {\n        callback(null, true);\n        return;\n      }\n\n      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {\n        callback(null, true);\n      } else {\n        callback(new Error('Not allowed by CORS'), false);\n      }\n    },\n    credentials: true,\n    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],\n    allowedHeaders: [\n      'Origin',\n      'X-Requested-With',\n      'Content-Type',\n      'Accept',\n      'Authorization',\n      'X-CSRF-Token',\n      'X-Session-ID'\n    ]\n  });

  await server.register(import('@fastify/rate-limit'), {\n    max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),\n    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),\n    redis: redis,\n    nameSpace: 'tcwatch_rate_limit:',\n    continueExceeding: true,\n    skipOnError: false,\n    skipSuccessfulRequests: false,\n    skipClientErrors: false,\n    keyGenerator: (req) => {\n      return `${req.ip}:${req.headers['user-agent'] || 'unknown'}`;\n    },\n    errorResponseBuilder: (req, context) => {\n      return {\n        statusCode: 429,\n        error: 'Too Many Requests',\n        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,\n        retryAfter: Math.round(context.ttl / 1000)\n      };\n    }\n  });

  await server.register(import('@fastify/redis'), {\n    client: redis,\n    closeOnExit: true\n  });

  await server.register(import('@fastify/cookie'), {\n    secret: process.env.SESSION_SECRET || 'tcwatch-session-secret-key',\n    parseOptions: {\n      httpOnly: true,\n      secure: process.env.NODE_ENV === 'production',\n      sameSite: 'strict',\n      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days\n    }\n  });

  // Apply security middleware\n  server.addHook('onRequest', securityMiddleware.applySecurityHeaders());\n  server.addHook('onRequest', securityMiddleware.createRequestValidator());\n\n  // Apply IP-based rate limiting\n  server.addHook('onRequest', rateLimitMiddleware.createIPRateLimit());\n\n  // Register tRPC\n  await server.register(fastifyTRPCPlugin, {\n    prefix: '/api',\n    trpcOptions: {\n      router,\n      createContext,\n      onError: ({ path, error, type, ctx }) => {\n        // Log errors for monitoring\n        server.log.error({\n          path,\n          type,\n          error: error.message,\n          code: error.code,\n          cause: error.cause,\n          userId: ctx?.user?.id,\n          ip: ctx?.req.ip,\n        }, 'tRPC Error');\n\n        // Don't expose internal errors in production\n        if (process.env.NODE_ENV === 'production' && error.code === 'INTERNAL_SERVER_ERROR') {\n          throw new Error('Internal server error');\n        }\n      },\n      responseMeta: ({ ctx, paths, errors, type }) => {\n        // Add custom headers\n        const headers: Record<string, string> = {};\n\n        // Add rate limiting info\n        if (ctx?.req.headers['x-ratelimit-limit']) {\n          headers['x-ratelimit-limit'] = ctx.req.headers['x-ratelimit-limit'] as string;\n          headers['x-ratelimit-remaining'] = ctx.req.headers['x-ratelimit-remaining'] as string;\n          headers['x-ratelimit-reset'] = ctx.req.headers['x-ratelimit-reset'] as string;\n        }\n\n        // Add CSRF token for authenticated users\n        if (ctx?.user && type === 'query') {\n          const sessionId = ctx.req.cookies?.session;\n          if (sessionId) {\n            const csrfToken = securityMiddleware.generateCSRFToken(sessionId);\n            headers['x-csrf-token'] = csrfToken;\n          }\n        }\n\n        return { headers };\n      }\n    }\n  });

  // Health check endpoint\n  server.get('/health', {\n    schema: {\n      response: {\n        200: {\n          type: 'object',\n          properties: {\n            status: { type: 'string' },\n            timestamp: { type: 'string' },\n            uptime: { type: 'number' },\n            database: { type: 'string' },\n            redis: { type: 'string' },\n            storage: { type: 'string' }\n          }\n        }\n      }\n    }\n  }, async (request, reply) => {\n    try {\n      // Check database connection\n      await prisma.$queryRaw`SELECT 1`;\n      const dbStatus = 'connected';\n\n      // Check Redis connection\n      const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';\n\n      // Check storage service\n      const storageStatus = 'available'; // Could add actual storage health check\n\n      return {\n        status: 'healthy',\n        timestamp: new Date().toISOString(),\n        uptime: process.uptime(),\n        database: dbStatus,\n        redis: redisStatus,\n        storage: storageStatus\n      };\n    } catch (error) {\n      server.log.error(error, 'Health check failed');\n      reply.status(503);\n      return {\n        status: 'unhealthy',\n        timestamp: new Date().toISOString(),\n        uptime: process.uptime(),\n        database: 'error',\n        redis: redis.status,\n        storage: 'error'\n      };\n    }\n  });\n\n  // Auth callback endpoint for OAuth\n  server.get('/auth/callback', async (request, reply) => {\n    try {\n      const { code, state } = request.query as { code?: string; state?: string };\n\n      if (!code) {\n        reply.status(400);\n        return { error: 'Missing authorization code' };\n      }\n\n      // Handle OAuth callback through providers service\n      // This would redirect to the frontend with the session info\n      reply.redirect(`${process.env.EXPO_PUBLIC_FRONTEND_URL}/auth/callback?code=${code}&state=${state}`);\n    } catch (error) {\n      server.log.error(error, 'Auth callback error');\n      reply.status(500);\n      return { error: 'Authentication failed' };\n    }\n  });\n\n  // Auth endpoints for token refresh and logout\n  server.post('/auth/refresh', {\n    preHandler: [rateLimitMiddleware.createRateLimiter('auth.refresh')]\n  }, jwtMiddleware.handleRefreshToken.bind(jwtMiddleware));\n\n  server.post('/auth/logout', {\n    preHandler: [jwtMiddleware.requireAuth.bind(jwtMiddleware)]\n  }, jwtMiddleware.handleLogout.bind(jwtMiddleware));\n\n  server.post('/auth/logout-all', {\n    preHandler: [jwtMiddleware.requireAuth.bind(jwtMiddleware)]\n  }, jwtMiddleware.handleLogoutAll.bind(jwtMiddleware));\n\n  // Security monitoring endpoint (admin only)\n  server.get('/admin/security-stats', {\n    preHandler: [jwtMiddleware.requireAdmin.bind(jwtMiddleware)]\n  }, async (request, reply) => {\n    try {\n      const [rateLimitStats, securityStats] = await Promise.all([\n        rateLimitMiddleware.getStats(),\n        Promise.resolve(securityMiddleware.getSecurityStats())\n      ]);\n\n      return {\n        rateLimit: rateLimitStats,\n        security: securityStats,\n        timestamp: new Date().toISOString()\n      };\n    } catch (error) {\n      server.log.error(error, 'Security stats error');\n      reply.status(500);\n      return { error: 'Failed to get security stats' };\n    }\n  });\n\n  // Initialize storage buckets\n  try {\n    await storageService.initializeBuckets();\n    server.log.info('Storage buckets initialized');\n  } catch (error) {\n    server.log.error(error, 'Failed to initialize storage buckets');\n  }\n\n  // Graceful shutdown\n  const signals = ['SIGINT', 'SIGTERM'];\n  signals.forEach((signal) => {\n    process.on(signal, async () => {\n      server.log.info(`Received ${signal}, shutting down gracefully`);\n      \n      try {\n        await server.close();\n        await prisma.$disconnect();\n        redis.disconnect();\n        server.log.info('Server shut down successfully');\n        process.exit(0);\n      } catch (error) {\n        server.log.error(error, 'Error during shutdown');\n        process.exit(1);\n      }\n    });\n  });\n\n  // Error handling\n  server.setNotFoundHandler((request, reply) => {\n    reply.status(404).send({\n      statusCode: 404,\n      error: 'Not Found',\n      message: `Route ${request.method}:${request.url} not found`\n    });\n  });\n\n  server.setErrorHandler((error, request, reply) => {\n    server.log.error({\n      error: error.message,\n      stack: error.stack,\n      url: request.url,\n      method: request.method,\n      ip: request.ip,\n      userAgent: request.headers['user-agent']\n    }, 'Unhandled server error');\n\n    const statusCode = error.statusCode || 500;\n    const message = process.env.NODE_ENV === 'production' && statusCode >= 500\n      ? 'Internal server error'\n      : error.message;\n\n    reply.status(statusCode).send({\n      statusCode,\n      error: error.name || 'Error',\n      message\n    });\n  });\n\n  return server;\n}\n\n// Start server if this file is run directly\nif (require.main === module) {\n  const start = async () => {\n    try {\n      const server = await createServer();\n      const port = parseInt(process.env.PORT || '3001');\n      const host = process.env.HOST || '0.0.0.0';\n\n      await server.listen({ port, host });\n      server.log.info(`🚀 TCWatch API server listening on http://${host}:${port}`);\n      server.log.info(`📚 Health check available at http://${host}:${port}/health`);\n    } catch (error) {\n      console.error('Failed to start server:', error);\n      process.exit(1);\n    }\n  };\n\n  start();\n}