# Sentry Setup Guide for TCWatch

This guide provides instructions for setting up and configuring Sentry error monitoring and performance tracking for the TCWatch project.

## Table of Contents

1. [Overview](#overview)
2. [Creating a Sentry Account and Project](#creating-a-sentry-account-and-project)
3. [Environment Configuration](#environment-configuration)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Release Tracking](#release-tracking)
7. [Source Maps Configuration](#source-maps-configuration)
8. [Alert Rules and Notifications](#alert-rules-and-notifications)
9. [Testing Your Setup](#testing-your-setup)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Overview

Sentry has been integrated into both the backend (Node.js/Fastify) and frontend (React Native/Expo) components of TCWatch to provide:

- **Error Tracking**: Automatic capture and reporting of errors
- **Performance Monitoring**: Track API response times, rendering performance, and user interactions
- **Release Management**: Track deployments and associate errors with specific releases
- **User Context**: Associate errors with user information while maintaining privacy
- **Custom Alerts**: Get notified when error rates spike or performance degrades

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   TC-Frontend   │    │   TC-Backend    │
│  (React Native) │    │  (Node.js)      │
│                 │    │                 │
│ • @sentry/      │    │ • @sentry/node  │
│   react-native  │    │ • @sentry/      │
│ • sentry-expo   │    │   tracing       │
│                 │    │ • @sentry/      │
│                 │    │   profiling     │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌─────────────┐
              │   Sentry    │
              │ Error &     │
              │ Performance │
              │ Monitoring  │
              └─────────────┘
```

## Creating a Sentry Account and Project

### 1. Sign Up for Sentry

1. Go to [sentry.io](https://sentry.io)
2. Create a free account (includes 5,000 errors/month)
3. Verify your email address

### 2. Create Projects

You'll need two separate projects in Sentry:

#### Backend Project
1. Click "Create Project"
2. Select **Node.js** as the platform
3. Name it `tcwatch-backend`
4. Copy the **DSN** (Data Source Name) - you'll need this for configuration

#### Frontend Project
1. Click "Create Project" again
2. Select **React Native** as the platform
3. Name it `tcwatch-frontend` or `tcwatch-mobile`
4. Copy the **DSN** - you'll need this for mobile configuration

### 3. Project Settings

For both projects, configure:
- **Team**: Assign to your development team
- **Environment**: Set up development, staging, and production environments
- **Data Scrubbing**: Enable to automatically filter sensitive data

## Environment Configuration

### Backend Environment Variables

Add these to your `.env` files in `TC-Backend/`:

```bash
# .env.development
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=tcwatch-backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
SENTRY_ENABLED=true

# .env.staging
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=staging
SENTRY_RELEASE=tcwatch-backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.5
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_ENABLED=true

# .env.production
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=tcwatch-backend@1.0.0
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.01
SENTRY_ENABLED=true
```

### Frontend Configuration

For the React Native/Expo app, add Sentry configuration to your `app.config.js` or `app.json`:

```javascript
// app.config.js
export default {
  expo: {
    // ... other config
    extra: {
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      sentryEnvironment: process.env.NODE_ENV || 'development',
      sentryRelease: `tcwatch-mobile@${require('./package.json').version}`,
      sentryTracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      sentryEnabled: process.env.EXPO_PUBLIC_SENTRY_ENABLED !== 'false',
    },
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: 'your-org-slug',
            project: 'tcwatch-frontend',
            authToken: process.env.SENTRY_AUTH_TOKEN,
          },
        },
      ],
    },
  },
};
```

Create a `.env` file in the frontend root:

```bash
# TC-Frontend/.env
EXPO_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
EXPO_PUBLIC_SENTRY_ENABLED=true
SENTRY_AUTH_TOKEN=your-auth-token-for-uploads
```

## Backend Setup

The backend Sentry integration is already configured in `TC-Backend/src/utils/sentry.ts` and integrated into `TC-Backend/src/index.ts`.

### Key Features

- **Automatic Error Capture**: All unhandled errors are automatically sent to Sentry
- **Performance Monitoring**: HTTP requests and database queries are tracked
- **Custom Context**: User information and request details are included
- **Data Filtering**: Sensitive information is automatically filtered out
- **Fastify Integration**: Custom plugin for seamless integration

### Configuration Options

You can adjust the configuration in `TC-Backend/src/utils/sentry.ts`:

```typescript
// Sampling rates
tracesSampleRate: 0.1,    // 10% of transactions for performance monitoring
profilesSampleRate: 0.1,  // 10% of transactions for profiling

// Error filtering
beforeSend(event) {
  // Custom logic to filter or modify events
  return filterSensitiveData(event);
}
```

## Frontend Setup

The frontend Sentry integration is configured in `TC-Frontend/utils/sentry.ts` and initialized in `TC-Frontend/app/_layout.tsx`.

### Key Features

- **React Native Integration**: Native crash reporting and performance tracking
- **Navigation Tracking**: Automatic screen navigation tracking
- **User Interaction Tracking**: Touch events and gesture tracking
- **Performance Monitoring**: App startup time, screen rendering performance
- **Error Boundaries**: Automatic error capture in React components

### Expo-Specific Setup

1. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

2. **Configure app.json** for source maps:
   ```json
   {
     "expo": {
       "hooks": {
         "postPublish": [
           {
             "file": "sentry-expo/upload-sourcemaps",
             "config": {
               "organization": "your-sentry-org",
               "project": "tcwatch-frontend"
             }
           }
         ]
       }
     }
   }
   ```

## Release Tracking

### Backend Releases

For the backend, releases are automatically tagged using the package version. To create a new release:

1. Update version in `package.json`
2. Deploy your application
3. Optionally, use Sentry CLI to create releases manually:

```bash
# Install Sentry CLI
npm install -g @sentry/cli

# Create release
sentry-cli releases new tcwatch-backend@1.1.0

# Associate commits
sentry-cli releases set-commits tcwatch-backend@1.1.0 --auto

# Deploy release
sentry-cli releases deploys tcwatch-backend@1.1.0 new -e production
```

### Frontend Releases

For Expo/React Native releases:

1. Update version in `package.json`
2. Build your app with EAS Build
3. Source maps are automatically uploaded via the postPublish hook

For manual release management:

```bash
# Create release for mobile
sentry-cli releases new tcwatch-mobile@1.1.0

# Upload source maps
sentry-cli releases files tcwatch-mobile@1.1.0 upload-sourcemaps ./dist --validate

# Finalize release
sentry-cli releases finalize tcwatch-mobile@1.1.0
```

## Source Maps Configuration

### Backend Source Maps

For Node.js TypeScript projects:

```bash
# Generate source maps during build
tsc --sourceMap

# Upload source maps to Sentry
sentry-cli releases files tcwatch-backend@1.0.0 upload-sourcemaps ./dist --validate
```

### Frontend Source Maps

Source maps are automatically handled by `sentry-expo` during the build process. Ensure your `app.config.js` includes the postPublish hook.

For manual upload:

```bash
# For Expo managed workflow
expo export --dev

# Upload source maps
sentry-cli releases files tcwatch-mobile@1.0.0 upload-sourcemaps ./dist --validate
```

## Alert Rules and Notifications

### Recommended Alert Rules

Set up alerts in the Sentry dashboard:

#### Error Rate Alerts
- **When**: Error count is more than 50 in 1 minute
- **Environment**: Production
- **Actions**: Email/Slack notification

#### Performance Alerts
- **When**: P95 response time is more than 2 seconds
- **Environment**: Production
- **Actions**: Email notification

#### New Issues
- **When**: A new issue is created
- **Environment**: Production
- **Actions**: Slack notification

### Setting Up Integrations

1. Go to **Settings > Integrations**
2. Configure **Slack** for team notifications
3. Configure **GitHub** for linking commits to releases
4. Configure **PagerDuty** for critical alerts (if applicable)

## Testing Your Setup

### Backend Testing

1. **Test Error Capture**:
   ```bash
   curl -X POST http://localhost:3000/test-error
   ```

2. **Test Performance Monitoring**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check Logs**:
   ```bash
   npm run dev
   # Look for "Sentry initialized successfully" message
   ```

### Frontend Testing

1. **Test Error Capture**:
   Add a test button that throws an error:
   ```typescript
   import { captureException } from '../utils/sentry';

   const testError = () => {
     captureException(new Error('Test error from frontend'));
   };
   ```

2. **Test Performance**:
   Navigation between screens should automatically be tracked

3. **Check Initialization**:
   Look for Sentry initialization logs in your development console

### Verify in Sentry Dashboard

1. Go to your Sentry project dashboard
2. Check **Issues** tab for captured errors
3. Check **Performance** tab for transaction data
4. Check **Releases** tab for deployment tracking

## Best Practices

### Security

- **Never log sensitive data**: Passwords, tokens, and personal information are automatically filtered
- **Use environment-specific sampling**: Lower sampling rates in production to reduce data costs
- **Review data scrubbing rules**: Ensure sensitive fields are properly masked

### Performance

- **Optimize sampling rates**:
  - Development: 100% (1.0) for full visibility
  - Staging: 50% (0.5) for testing
  - Production: 10% (0.1) to control costs

- **Use breadcrumbs wisely**: They provide context but can increase payload size
- **Set appropriate timeouts**: Ensure Sentry doesn't block your application

### Error Handling

- **Add context to errors**:
  ```typescript
  captureException(error, {
    user: { id: userId },
    extra: { operation: 'content-sync' }
  });
  ```

- **Use custom tags**:
  ```typescript
  setSentryTags({
    feature: 'content-tracking',
    version: '1.0.0'
  });
  ```

- **Filter noise**: Set up rules to ignore expected errors (e.g., network timeouts)

### Monitoring

- **Set up dashboards**: Create custom dashboards for key metrics
- **Regular review**: Weekly review of error trends and performance metrics
- **Team alerts**: Ensure the right people are notified for different types of issues

## Troubleshooting

### Common Issues

#### "Sentry DSN not configured"
- Check that `SENTRY_DSN` environment variable is set
- Verify the DSN format: `https://key@sentry.io/project-id`
- Ensure environment files are loaded properly

#### "Source maps not working"
- Verify source maps are generated during build
- Check that `sentry-cli` is installed and configured
- Ensure auth token has the correct permissions

#### "No events in Sentry"
- Check network connectivity to sentry.io
- Verify the DSN is correct for your project
- Check if Sentry is enabled (`SENTRY_ENABLED=true`)

#### "Too many events / quota exceeded"
- Reduce sampling rates in production
- Set up data filters to exclude noisy errors
- Review and adjust your Sentry plan

### Debug Mode

Enable debug mode to see Sentry internal logs:

**Backend:**
```typescript
// In sentry.ts
Sentry.init({
  debug: process.env.NODE_ENV === 'development',
  // ... other options
});
```

**Frontend:**
```typescript
// In sentry.ts
sentryExpoInit({
  debug: __DEV__,
  // ... other options
});
```

### Testing Connectivity

Test if Sentry is reachable:

```bash
# Test DSN connectivity
curl -X POST \
  'https://sentry.io/api/PROJECT_ID/store/' \
  -H 'X-Sentry-Auth: Sentry sentry_version=7, sentry_key=YOUR_KEY, sentry_client=test/1.0' \
  -H 'Content-Type: application/json' \
  -d '{"message": "Test message"}'
```

### Getting Help

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Community Forum**: [forum.sentry.io](https://forum.sentry.io)
- **GitHub Issues**: [github.com/getsentry](https://github.com/getsentry)

## Environment-Specific Notes

### Development
- Enable debug mode for detailed logging
- Use 100% sampling rate for full visibility
- Test error capture and performance tracking

### Staging
- Mirror production configuration with higher sampling
- Test release and deployment tracking
- Validate alert rules and notifications

### Production
- Use conservative sampling rates (5-10%)
- Enable all error filters and data scrubbing
- Monitor performance impact
- Set up critical alerts and escalation paths

---

## Quick Start Checklist

- [ ] Create Sentry account and projects
- [ ] Configure environment variables
- [ ] Test error capture in development
- [ ] Test performance monitoring
- [ ] Set up release tracking
- [ ] Configure source maps
- [ ] Set up alert rules
- [ ] Test in staging environment
- [ ] Deploy to production with monitoring
- [ ] Review and optimize configuration

For additional support or questions about the TCWatch Sentry setup, please refer to the project documentation or contact the development team.