// Security middleware configuration
import { FastifyInstance } from 'fastify';

/**
 * Register security middleware
 */
export async function registerSecurity(fastify: any) {
  // CORS configuration
  await fastify.register(import('@fastify/cors'), {
    origin: (origin: string | undefined, callback: any) => {
      const hostname = new URL(origin || 'http://localhost').hostname;

      // Allow localhost for development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (hostname.includes('vercel.app')) {
        return callback(null, true);
      }

      // Allow production domains
      const allowedDomains = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedDomains.includes(hostname)) {
        return callback(null, true);
      }

      // Allow Expo development
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Reject all other origins
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-trpc-source'],
  });

  // Helmet for security headers
  await fastify.register(import('@fastify/helmet'), {
    global: true,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for API server
  });

  // Rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
    skipOnError: true,
    errorResponseBuilder: (request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded, retry in ${Math.round(context.ttl / 1000)} seconds`,
        retryAfter: Math.round(context.ttl / 1000),
      },
    }),
    keyGenerator: (request) => {
      // Use user ID if authenticated, otherwise IP
      const authorization = request.headers.authorization;
      if (authorization) {
        try {
          // Extract user ID from token (simplified)
          const token = authorization.replace('Bearer ', '');
          // In a real implementation, you'd decode the JWT here
          return `user:${token.substring(0, 10)}`; // Simple approach for demo
        } catch {
          // Fall back to IP
        }
      }
      return request.ip;
    },
    // Different limits for different routes
    dynamicOptions: async (request) => {
      // Higher limits for authenticated users
      if (request.headers.authorization) {
        return {
          max: 200,
          timeWindow: '1 minute',
        };
      }

      // Lower limits for public endpoints
      if (request.url.includes('/health') || request.url.includes('/trpc/content.search')) {
        return {
          max: 50,
          timeWindow: '1 minute',
        };
      }

      // Default limits
      return {};
    },
  });

  // Request size limit
  fastify.addContentTypeParser('application/json', {
    parseAs: 'string',
    bodyLimit: 1024 * 1024, // 1MB limit
  }, (req, body, done) => {
    try {
      const json = JSON.parse(body as string);
      done(null, json);
    } catch (err) {
      err.statusCode = 400;
      done(err, undefined);
    }
  });
}

/**
 * Request logging middleware
 */
export async function registerLogging(fastify: any) {
  fastify.addHook('onRequest', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      contentType: request.headers['content-type'],
    }, 'Incoming request');
  });

  fastify.addHook('onResponse', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.getResponseTime(),
    }, 'Request completed');
  });
}

/**
 * Health check middleware
 */
export async function registerHealthChecks(fastify: any) {
  // Basic health check
  fastify.get('/health', async (request, reply) => {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    return {
      status: 'ok',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    };
  });

  // Detailed health check
  fastify.get('/health/detailed', async (request, reply) => {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    const memoryUsage = process.memoryUsage();

    // Check database connection
    let dbStatus = 'ok';
    try {
      // Import here to avoid circular dependencies
      const { prisma } = await import('../context');
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'error';
      request.log.error('Database health check failed:', error);
    }

    // Check Redis connection (if configured)
    let redisStatus = 'ok';
    try {
      // Redis health check would go here
      // await redis.ping();
    } catch (error) {
      redisStatus = 'error';
      request.log.error('Redis health check failed:', error);
    }

    const healthData = {
      status: dbStatus === 'ok' && redisStatus === 'ok' ? 'ok' : 'degraded',
      timestamp,
      uptime: `${Math.floor(uptime)}s`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };

    if (healthData.status !== 'ok') {
      reply.status(503);
    }

    return healthData;
  });

  // Readiness probe
  fastify.get('/ready', async (request, reply) => {
    try {
      const { prisma } = await import('../context');
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' };
    } catch (error) {
      reply.status(503);
      return { status: 'not ready', error: 'Database connection failed' };
    }
  });

  // Liveness probe
  fastify.get('/live', async (request, reply) => {
    return { status: 'alive' };
  });
}