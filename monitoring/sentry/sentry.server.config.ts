// Sentry configuration for backend services
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    debug: process.env.NODE_ENV === 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Additional settings
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION,

    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request?.headers?.authorization) {
        delete event.request.headers.authorization;
      }

      // Filter out health check requests
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      // Don't send events in development (unless explicitly enabled)
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEVELOPMENT) {
        return null;
      }

      return event;
    },

    integrations: [
      // Add Node.js specific integrations
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express(),
      new ProfilingIntegration(),
    ],
  });
};

// Express error handler middleware
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Only handle 500+ errors
    return error.status >= 500;
  },
});

// Express request handler middleware
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  ip: false, // Don't capture IP addresses for privacy
});

// Fastify plugin for Sentry
export const sentryFastifyPlugin = async (fastify: any) => {
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    Sentry.addBreadcrumb({
      message: `${request.method} ${request.url}`,
      category: 'http',
      level: 'info',
    });
  });

  fastify.setErrorHandler(async (error: any, request: any, reply: any) => {
    if (reply.statusCode >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('path', request.url);
        scope.setTag('method', request.method);
        scope.setContext('request', {
          url: request.url,
          method: request.method,
          headers: request.headers,
          query: request.query,
          params: request.params,
        });
        Sentry.captureException(error);
      });
    }

    // Continue with normal error handling
    throw error;
  });
};