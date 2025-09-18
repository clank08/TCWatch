import * as Sentry from '@sentry/react-native';
import { init as sentryExpoInit } from 'sentry-expo';

export interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  dist?: string;
  tracesSampleRate: number;
  enabled: boolean;
  enableNativeCrashHandling: boolean;
  enableAutoSessionTracking: boolean;
  enableAutoPerformanceTracking: boolean;
}

/**
 * Initialize Sentry for React Native/Expo error tracking and performance monitoring
 */
export function initializeSentry(): void {
  const config = getSentryConfig();

  if (!config.enabled || !config.dsn) {
    console.warn('[Sentry] Sentry is disabled or DSN not configured');
    return;
  }

  sentryExpoInit({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    dist: config.dist,

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate,
    enableAutoPerformanceTracking: config.enableAutoPerformanceTracking,

    // Native crash handling
    enableNativeCrashHandling: config.enableNativeCrashHandling,

    // Session tracking
    enableAutoSessionTracking: config.enableAutoSessionTracking,

    // Integrations
    integrations: [
      // React Native specific integrations
      new Sentry.ReactNativeTracing({
        // Track navigation performance
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        enableAppStartTracking: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        enableUserInteractionTracing: true,
      }),

      // React specific integration
      new Sentry.ReactNativeProfiler(),

      // HTTP integration for API calls
      new Sentry.HttpIntegration({
        tracing: true,
        captureRequestHeaders: false, // Don't capture sensitive headers
        captureResponseHeaders: false,
      }),

      // Redux integration (if using Redux)
      // new Sentry.ExtraErrorData(),
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

    // Set max breadcrumbs
    maxBreadcrumbs: 100,

    // Configure request data
    sendDefaultPii: false,

    // Debug mode (only in development)
    debug: __DEV__,

    // Initial scope configuration
    initialScope: {
      tags: {
        component: 'tcwatch-mobile',
        platform: 'react-native',
      },
    },

    // Disable automatic breadcrumbs for sensitive operations
    defaultIntegrations: false,

    // Manual integration setup for better control
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        enableAppStartTracking: true,
        enableNativeFramesTracking: true,
        enableStallTracking: true,
        enableUserInteractionTracing: true,
      }),
    ],
  });

  // Set additional context
  Sentry.setContext('app', {
    name: 'TCWatch',
    version: getAppVersion(),
    buildNumber: getBuildNumber(),
  });

  console.log(`[Sentry] Initialized successfully in ${config.environment} environment`);
}

/**
 * Get Sentry configuration from environment variables and app config
 */
function getSentryConfig(): SentryConfig {
  // In Expo, these would typically come from app.json/app.config.js
  // or from environment variables via expo-constants
  const Constants = require('expo-constants').default;

  return {
    dsn: Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    environment: __DEV__ ? 'development' : (Constants.expoConfig?.extra?.environment || 'production'),
    release: Constants.expoConfig?.extra?.sentryRelease || `tcwatch-mobile@${getAppVersion()}`,
    dist: Constants.expoConfig?.extra?.sentryDist || getBuildNumber(),
    tracesSampleRate: parseFloat(Constants.expoConfig?.extra?.sentryTracesSampleRate || '0.1'),
    enabled: Constants.expoConfig?.extra?.sentryEnabled !== false,
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: true,
    enableAutoPerformanceTracking: true,
  };
}

/**
 * Get app version from Expo constants
 */
function getAppVersion(): string {
  const Constants = require('expo-constants').default;
  return Constants.expoConfig?.version || '1.0.0';
}

/**
 * Get build number from Expo constants
 */
function getBuildNumber(): string {
  const Constants = require('expo-constants').default;
  return Constants.expoConfig?.ios?.buildNumber ||
         Constants.expoConfig?.android?.versionCode?.toString() ||
         '1';
}

/**
 * Filter sensitive data from error events
 */
function filterSensitiveData(event: Sentry.Event): Sentry.Event | null {
  if (!event) return null;

  // Remove sensitive headers from HTTP requests
  if (event.request?.headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'x-session-token'];
    sensitiveHeaders.forEach(header => {
      if (event.request!.headers![header]) {
        event.request!.headers![header] = '[Filtered]';
      }
    });
  }

  // Remove sensitive query parameters
  if (event.request?.query_string) {
    const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key', 'session_id'];
    let queryString = event.request.query_string;
    sensitiveParams.forEach(param => {
      const regex = new RegExp(`(${param}=)[^&]*`, 'gi');
      queryString = queryString.replace(regex, '$1[Filtered]');
    });
    event.request.query_string = queryString;
  }

  // Filter sensitive data from extra context
  if (event.extra) {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'api_key', 'auth', 'credentials'];
    sensitiveKeys.forEach(key => {
      if (event.extra![key]) {
        event.extra![key] = '[Filtered]';
      }
    });
  }

  // Filter AsyncStorage data if present
  if (event.contexts?.['React Context']) {
    filterReactContext(event.contexts['React Context']);
  }

  return event;
}

/**
 * Filter sensitive data from React context
 */
function filterReactContext(context: any): void {
  if (!context) return;

  const sensitiveKeys = ['authToken', 'sessionToken', 'password', 'credentials', 'apiKey'];

  function filterRecursive(obj: any): void {
    if (typeof obj !== 'object' || obj === null) return;

    Object.keys(obj).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
        obj[key] = '[Filtered]';
      } else if (typeof obj[key] === 'object') {
        filterRecursive(obj[key]);
      }
    });
  }

  filterRecursive(context);
}

/**
 * Filter sensitive data from breadcrumbs
 */
function filterSensitiveBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb | null {
  if (!breadcrumb) return null;

  // Filter console logs containing sensitive data
  if (breadcrumb.category === 'console' && breadcrumb.message) {
    const sensitivePatterns = [/password/i, /token/i, /key/i, /secret/i, /auth/i, /credential/i];
    if (sensitivePatterns.some(pattern => pattern.test(breadcrumb.message!))) {
      breadcrumb.message = '[Filtered sensitive log]';
    }
  }

  // Filter HTTP breadcrumbs
  if (breadcrumb.category === 'http' && breadcrumb.data) {
    if (breadcrumb.data.url) {
      // Remove sensitive query parameters from URLs
      try {
        const url = new URL(breadcrumb.data.url);
        const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key', 'session_id'];
        sensitiveParams.forEach(param => {
          if (url.searchParams.has(param)) {
            url.searchParams.set(param, '[Filtered]');
          }
        });
        breadcrumb.data.url = url.toString();
      } catch (e) {
        // If URL parsing fails, just keep the original URL
      }
    }

    // Filter request/response data
    if (breadcrumb.data.request_body_size) {
      delete breadcrumb.data.request_body; // Remove request body completely
    }
    if (breadcrumb.data.response_body_size) {
      delete breadcrumb.data.response_body; // Remove response body completely
    }
  }

  // Filter navigation breadcrumbs with sensitive routes
  if (breadcrumb.category === 'navigation') {
    const sensitiveRoutes = ['/login', '/register', '/reset-password', '/profile/edit'];
    if (breadcrumb.data?.to && sensitiveRoutes.some(route => breadcrumb.data!.to!.includes(route))) {
      breadcrumb.data.to = '[Filtered sensitive route]';
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
  const sensitivePatterns = [/\/auth\//, /\/login/, /\/register/, /\/reset-password/, /\/profile\/edit/];
  if (sensitivePatterns.some(pattern => pattern.test(transaction.name))) {
    transaction.setTag('contains_sensitive_data', true);
    // Don't completely filter the transaction, but mark it
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
  // Filter sensitive data before setting context
  const filteredContext = JSON.parse(JSON.stringify(context));
  filterReactContext(filteredContext);
  Sentry.setContext(key, filteredContext);
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
 * Track screen view for analytics
 */
export function trackScreenView(screenName: string, context?: Record<string, any>): void {
  Sentry.addBreadcrumb({
    message: `Screen: ${screenName}`,
    category: 'navigation',
    level: 'info',
    data: {
      screen: screenName,
      ...context,
    },
  });
}

/**
 * Track user action
 */
export function trackUserAction(action: string, context?: Record<string, any>): void {
  addSentryBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: 'info',
    data: context,
  });
}

/**
 * Track API call performance
 */
export function trackApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
  addSentryBreadcrumb({
    message: `API ${method} ${endpoint}`,
    category: 'http',
    level: success ? 'info' : 'warning',
    data: {
      endpoint,
      method,
      duration,
      success,
    },
  });
}

/**
 * Set release information
 */
export function setReleaseInfo(release: string, dist?: string): void {
  Sentry.configureScope((scope) => {
    scope.setTag('release', release);
    if (dist) {
      scope.setTag('dist', dist);
    }
  });
}

/**
 * Flush Sentry events (useful before app termination)
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
 * Navigation tracking helper for React Navigation
 */
export function createNavigationIntegration() {
  return new Sentry.ReactNavigationInstrumentation();
}

/**
 * Error boundary component wrapper
 */
export function withSentryErrorBoundary<P>(Component: React.ComponentType<P>) {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>An error occurred and has been reported.</p>
        <button onClick={resetError}>Try again</button>
      </div>
    ),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('error_boundary', 'react');
      scope.setContext('error_info', errorInfo);
    },
  });
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(transactionName: string) {
  const [transaction, setTransaction] = React.useState<Sentry.Transaction | null>(null);

  React.useEffect(() => {
    const trans = startTransaction(transactionName, 'react_render');
    setTransaction(trans);

    return () => {
      if (trans) {
        trans.finish();
      }
    };
  }, [transactionName]);

  return transaction;
}

// Export Sentry for direct usage if needed
export { Sentry };