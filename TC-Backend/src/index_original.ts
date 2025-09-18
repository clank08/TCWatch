// TCWatch Backend Server Entry Point
import { config } from 'dotenv';
config(); // Load environment variables first

import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

// Import application components
import { appRouter } from './routers';
import { createContext, cleanup } from './context';
import { errorHandler, notFoundHandler } from './middleware/error';
import { registerSecurity, registerLogging, registerHealthChecks } from './middleware/security';

const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development' ? {
    level: process.env.LOG_LEVEL || 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  } : {
    level: process.env.LOG_LEVEL || 'info',
  },
  requestTimeout: 30000, // 30 seconds
  bodyLimit: 1024 * 1024, // 1MB
});

const start = async () => {
  try {
    // Register security middleware (CORS, Helmet, Rate Limiting)
    await registerSecurity(fastify);

    // Register logging middleware
    await registerLogging(fastify);

    // Register health check endpoints
    await registerHealthChecks(fastify);

    // Register tRPC
    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError: ({ path, error, type, req }: any) => {
          // Log tRPC errors
          fastify.log.error({
            error: error.message,
            code: error.code,
            path,
            type,
            url: req?.url,
            method: req?.method,
            stack: error.stack,
          }, 'tRPC Error');
        },
      },
    });

    // API info endpoint
    fastify.get('/', async (request, reply) => {
      return {
        name: 'TCWatch Backend API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: '/health',
          healthDetailed: '/health/detailed',
          ready: '/ready',
          live: '/live',
          trpc: '/trpc',
        },
        documentation: process.env.NODE_ENV === 'development' ? {
          swagger: '/docs',
        } : undefined,
      };
    });

    // Register error handlers
    fastify.setErrorHandler(errorHandler);
    fastify.setNotFoundHandler(notFoundHandler);

    // Register Swagger documentation in development
    if (process.env.NODE_ENV === 'development') {
      await fastify.register(import('@fastify/swagger'), {
        openapi: {
          openapi: '3.0.0',
          info: {
            title: 'TCWatch Backend API',
            description: 'True Crime content tracking API',
            version: '1.0.0',
          },
          servers: [
            {
              url: `http://localhost:${process.env.PORT || 3000}`,
              description: 'Development server',
            },
          ],
          tags: [
            { name: 'Health', description: 'Health check endpoints' },
            { name: 'tRPC', description: 'Type-safe API procedures' },
          ],
        },
      });

      await fastify.register(import('@fastify/swagger-ui'), {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: false,
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
      });
    }

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    fastify.log.info(`🚀 TCWatch Backend API started successfully`);
    fastify.log.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    fastify.log.info(`🌐 Server listening on http://${host}:${port}`);
    fastify.log.info(`❤️  Health check: http://${host}:${port}/health`);
    fastify.log.info(`🔧 tRPC endpoint: http://${host}:${port}/trpc`);

    if (process.env.NODE_ENV === 'development') {
      fastify.log.info(`📚 API Documentation: http://${host}:${port}/docs`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully`);

  try {
    // Close Fastify server
    await fastify.close();

    // Cleanup database connections
    await cleanup();

    fastify.log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    fastify.log.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  fastify.log.fatal(err, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  fastify.log.fatal(err, 'Unhandled rejection');
  process.exit(1);
});

start();