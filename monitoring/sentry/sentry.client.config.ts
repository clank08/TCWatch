// Sentry configuration for frontend applications
import * as Sentry from '@sentry/react-native';
// For web: import * as Sentry from '@sentry/remix';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    debug: process.env.NODE_ENV === 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Additional settings
    environment: process.env.NODE_ENV || 'development',
    release: process.env.EXPO_PUBLIC_APP_VERSION,

    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request?.headers?.Authorization) {
        delete event.request.headers.Authorization;
      }

      // Don't send events in development (unless explicitly enabled)
      if (process.env.NODE_ENV === 'development' && !process.env.EXPO_PUBLIC_SENTRY_DEVELOPMENT) {
        return null;
      }

      return event;
    },

    integrations: [
      // Add React Native specific integrations
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['localhost', /^https:\/\/api\.tcwatch\.app/],
      }),
    ],
  });
};

// Error boundary helper
export const withSentryErrorBoundary = (Component: React.ComponentType) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: ({ error, resetError }) => (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Something went wrong</h2>
        <p>{error.message}</p>
        <button onClick={resetError}>Try again</button>
      </div>
    ),
  });
};