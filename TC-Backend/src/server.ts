// Simplified TCWatch Backend Server Entry Point
import { config } from 'dotenv';
config(); // Load environment variables first

import Fastify from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';

// Import application components
import { appRouter } from './routers';
import { createContext, cleanup } from './context';

const fastify = Fastify({
  logger: true,
  requestTimeout: 30000,
  bodyLimit: 1024 * 1024,
});

const start = async () => {
  try {
    // Register CORS
    await fastify.register(import('@fastify/cors'), {
      origin: true,
      credentials: true,
    });

    // Register Helmet for security
    await fastify.register(import('@fastify/helmet'), {
      global: true,
    });

    // Register tRPC
    await fastify.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError: ({ path, error }: any) => {
          console.error(`tRPC Error on ${path}:`, error);
        },
      },
    });

    // Health check endpoint
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      };
    });

    // API info endpoint
    fastify.get('/', async () => {
      return {
        name: 'TCWatch Backend API',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
          health: '/health',
          trpc: '/trpc',
        },
      };
    });

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`🚀 TCWatch Backend API started successfully`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Server listening on http://${host}:${port}`);
    console.log(`❤️  Health check: http://${host}:${port}/health`);
    console.log(`🔧 tRPC endpoint: http://${host}:${port}/trpc`);
  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully`);

  try {
    await fastify.close();
    await cleanup();
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();