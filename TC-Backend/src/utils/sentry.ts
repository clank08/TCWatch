import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enabled: boolean;
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(): void {
  const config = getSentryConfig();

  if (!config.enabled || !config.dsn) {
    console.warn('[Sentry] Sentry is disabled or DSN not configured');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,
    profilesSampleRate: config.profilesSampleRate,

    // Integrations
    integrations: [
      // Enable HTTP requests tracking
      new Sentry.Integrations.Http({ tracing: true }),

      // Enable Express integration for Fastify compatibility
      new Sentry.Integrations.Express({ app: undefined }),

      // Enable profiling integration
      nodeProfilingIntegration(),

      // Enable console integration with breadcrumbs
      new Sentry.Integrations.Console(),

      // Enable modules integration
      new Sentry.Integrations.Modules(),

      // Enable context integration
      new Sentry.Integrations.Context({
        app: true,
        device: true,
        os: true,
        runtime: true,
      }),
    ],

    // Error filtering to avoid sensitive data
    beforeSend(event) {
      return filterSensitiveData(event);
    },

    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      return filterSensitiveBreadcrumb(breadcrumb);
    },

    // Performance transaction filtering
    beforeSendTransaction(transaction) {
      return filterSensitiveTransaction(transaction);
    },

    // Enable automatic session tracking
    autoSessionTracking: true,

    // Enable capturing unhandled rejections
    captureUnhandledRejections: true,

    // Enable capturing uncaught exceptions
    captureUnhandledException: true,

    // Set max breadcrumbs
    maxBreadcrumbs: 100,

    // Configure request data
    sendDefaultPii: false,

    // Initial scope configuration
    initialScope: {
      tags: {
        component: 'tcwatch-backend',
        service: 'api-server',
      },
    },
  });

  console.log(`[Sentry] Initialized successfully in ${config.environment} environment`);
}

/**
 * Get Sentry configuration from environment variables
 */
function getSentryConfig(): SentryConfig {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || `tcwatch-backend@${process.env.npm_package_version || '1.0.0'}`,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    enabled: process.env.SENTRY_ENABLED !== 'false',
  };
}

/**
 * Filter sensitive data from error events
 */
function filterSensitiveData(event: Sentry.Event): Sentry.Event | null {
  if (!event) return null;

  // Remove sensitive headers
  if (event.request?.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    sensitiveHeaders.forEach(header => {
      if (event.request!.headers![header]) {
        event.request!.headers![header] = '[Filtered]';
      }
    });
  }

  // Remove sensitive query parameters
  if (event.request?.query_string) {
    const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key'];
    let queryString = event.request.query_string;
    sensitiveParams.forEach(param => {
      const regex = new RegExp(`(${param}=)[^&]*`, 'gi');
      queryString = queryString.replace(regex, '$1[Filtered]');
    });
    event.request.query_string = queryString;
  }

  // Filter sensitive data from extra context
  if (event.extra) {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key', 'auth'];
    sensitiveKeys.forEach(key => {
      if (event.extra![key]) {
        event.extra![key] = '[Filtered]';
      }
    });
  }

  return event;
}

/**
 * Filter sensitive data from breadcrumbs
 */
function filterSensitiveBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (!breadcrumb) return null;

  // Filter console logs containing sensitive data
  if (breadcrumb.category === 'console' && breadcrumb.message) {
    const sensitivePatterns = [/password/i, /token/i, /key/i, /secret/i, /auth/i];
    if (sensitivePatterns.some(pattern => pattern.test(breadcrumb.message!))) {
      breadcrumb.message = '[Filtered sensitive log]';
    }
  }

  // Filter HTTP breadcrumbs
  if (breadcrumb.category === 'http' && breadcrumb.data) {
    if (breadcrumb.data.url) {
      // Remove sensitive query parameters from URLs
      const url = new URL(breadcrumb.data.url);
      const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key'];
      sensitiveParams.forEach(param => {
        if (url.searchParams.has(param)) {
          url.searchParams.set(param, '[Filtered]');
        }
      });
      breadcrumb.data.url = url.toString();
    }
  }

  return breadcrumb;
}

/**
 * Filter sensitive data from performance transactions
 */
function filterSensitiveTransaction(transaction: Sentry.Transaction): Sentry.Transaction | null {
  if (!transaction) return null;

  // Filter transaction names containing sensitive data
  const sensitivePatterns = [/\/auth\//, /\/login/, /\/register/, /\/reset-password/];
  if (sensitivePatterns.some(pattern => pattern.test(transaction.name))) {
    transaction.setTag('contains_sensitive_data', true);
  }

  return transaction;
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add custom tags to Sentry context
 */
export function setSentryTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Add custom context to Sentry
 */
export function setSentryContext(key: string, context: Record<string, any>): void {
  Sentry.setContext(key, context);
}

/**
 * Add breadcrumb manually
 */
export function addSentryBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data || {},
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, operation: string): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

/**
 * Flush Sentry events (useful for serverless or before shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

/**
 * Close Sentry client
 */
export async function closeSentry(timeout: number = 2000): Promise<boolean> {
  return Sentry.close(timeout);
}

/**
 * Express/Fastify error handler
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error: any) {
      // Only send 4xx and 5xx errors to Sentry
      return error.status >= 400;
    },
  });
}

/**
 * Express/Fastify request handler
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    ip: false, // Don't send IP addresses
    request: ['headers', 'method', 'query_string', 'url'],
    user: ['id', 'username', 'email'],
  });
}

/**
 * Fastify plugin for Sentry integration
 */
export async function sentryFastifyPlugin(fastify: any, options: any) {
  // Add Sentry context to each request
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    // Set request context
    Sentry.setTag('route', request.routerPath || 'unknown');
    Sentry.setTag('method', request.method);

    // Add request breadcrumb
    Sentry.addBreadcrumb({
      message: `${request.method} ${request.url}`,
      category: 'http',
      level: 'info',
      data: {
        method: request.method,
        url: request.url,
        query: request.query,
        headers: filterHeaders(request.headers),
      },
    });
  });

  // Add error handling
  fastify.setErrorHandler(async (error: Error, request: any, reply: any) => {
    // Capture error in Sentry
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'fastify');
      scope.setContext('request', {
        method: request.method,
        url: request.url,
        headers: filterHeaders(request.headers),
        query: request.query,
        params: request.params,
      });
      Sentry.captureException(error);
    });

    // Continue with normal error handling
    throw error;
  });
}

/**
 * Filter sensitive headers for logging
 */
function filterHeaders(headers: Record<string, any>): Record<string, any> {
  const filtered = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[Filtered]';
    }
  });

  return filtered;
}

// Export Sentry for direct usage if needed
export { Sentry };