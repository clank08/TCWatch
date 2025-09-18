# TCWatch Authentication System

This directory contains the comprehensive authentication and user management system for TCWatch backend.

## Overview

The authentication system provides secure user registration, login, profile management, and session handling with enterprise-grade security features.

## Architecture

### Services

- **AuthService** (`auth.service.ts`) - Core authentication logic with Supabase integration
- **AuthProvidersService** (`providers.service.ts`) - OAuth and email/password authentication
- **ProfileService** (`profile.service.ts`) - User profile CRUD operations with validation
- **SessionService** (`session.service.ts`) - Redis-based secure session management
- **StorageService** (`storage.service.ts`) - Supabase Storage for avatar uploads

### Middleware

- **JWTMiddleware** (`../middleware/auth/jwt.middleware.ts`) - JWT validation and refresh token handling
- **RateLimitMiddleware** (`../middleware/auth/rate-limit.middleware.ts`) - Rate limiting and brute force protection
- **SecurityMiddleware** (`../middleware/auth/security.middleware.ts`) - CSRF, CORS, and security headers

## Features

### Authentication Methods
- ✅ Email/password authentication
- ✅ OAuth providers (Google, Apple, GitHub, Facebook, Twitter)
- ✅ JWT token-based authentication
- ✅ Refresh token rotation
- ✅ Session-based authentication with Redis

### Security Features
- ✅ Rate limiting (per endpoint and global)
- ✅ Brute force protection with progressive lockout
- ✅ CSRF token protection
- ✅ Secure CORS configuration
- ✅ Comprehensive security headers
- ✅ Request validation and sanitization
- ✅ Suspicious activity detection
- ✅ IP-based rate limiting

### User Management
- ✅ User profile creation and updates
- ✅ Privacy settings with granular controls
- ✅ Notification preferences
- ✅ Avatar upload to Supabase Storage
- ✅ Profile search with privacy filters
- ✅ Account deletion with data cleanup

### Session Management
- ✅ Redis-based session storage
- ✅ Multi-device session tracking
- ✅ Session expiration and cleanup
- ✅ Secure cookie configuration
- ✅ Session analytics and monitoring

## API Endpoints

### Public Endpoints
- `GET /api/auth/getProviders` - Get available auth providers
- `POST /api/auth/signUp` - Register new user
- `POST /api/auth/signIn` - Sign in user
- `POST /api/auth/signInWithProvider` - OAuth sign in
- `POST /api/auth/resetPassword` - Password reset

### Protected Endpoints
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/updateProfile` - Update user profile
- `POST /api/auth/updatePrivacySettings` - Update privacy settings
- `POST /api/auth/updateNotificationSettings` - Update notification preferences
- `POST /api/auth/uploadAvatar` - Upload avatar image
- `POST /api/auth/updatePassword` - Change password
- `POST /api/auth/signOut` - Sign out current session
- `POST /api/auth/signOutAll` - Sign out all sessions
- `GET /api/auth/getSessions` - Get active sessions
- `GET /api/auth/getStats` - Get user statistics
- `GET /api/auth/searchProfiles` - Search user profiles
- `DELETE /api/auth/deleteAccount` - Delete account

### Direct HTTP Endpoints
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout with session cleanup
- `GET /auth/callback` - OAuth callback handler

## Configuration

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis
REDIS_URL=redis://localhost:6379

# OAuth Providers (optional)
SUPABASE_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_APPLE_CLIENT_ID=your_apple_client_id
SUPABASE_GITHUB_CLIENT_ID=your_github_client_id

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Security
SESSION_SECRET=your_session_secret_minimum_32_characters
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW_MS=900000
```

### Rate Limiting Rules

| Endpoint | Window | Max Requests | Purpose |
|----------|---------|--------------|---------|
| `auth.signIn` | 15 minutes | 5 | Prevent brute force login |
| `auth.signUp` | 1 hour | 3 | Prevent spam registration |
| `auth.resetPassword` | 1 hour | 3 | Prevent email spam |
| `upload.avatar` | 1 hour | 10 | Prevent upload abuse |
| `api.general` | 15 minutes | 100 | General API protection |

### Privacy Settings

Users can control:
- Profile visibility to other users
- Activity feed visibility
- Friend request permissions
- List sharing permissions
- Email searchability
- Notification preferences

### Notification Settings

Configurable notifications:
- Push notifications (mobile)
- Email notifications
- New content alerts
- Friend activity updates
- Weekly digest emails
- Cable TV reminders
- List update notifications
- Friend request alerts
- Challenge updates
- System announcements

## Security Considerations

### Data Protection
- All passwords are handled by Supabase Auth (never stored locally)
- Session data is encrypted in Redis
- File uploads are validated for type and size
- User data follows privacy settings

### Attack Prevention
- SQL injection protection via Prisma ORM
- XSS protection with input validation and CSP headers
- CSRF protection with secure tokens
- Rate limiting prevents automated attacks
- Brute force protection with progressive delays

### Monitoring
- Failed authentication attempts are tracked
- Suspicious activity detection
- Security metrics available via admin endpoint
- Comprehensive logging for audit trails

## Usage Examples

### Basic Authentication Flow

```typescript
// Sign up
const result = await trpc.auth.signUp.mutate({
  email: 'user@example.com',
  password: 'securePassword123',
  displayName: 'John Doe'
});

// Sign in
const session = await trpc.auth.signIn.mutate({
  email: 'user@example.com',
  password: 'securePassword123'
});

// Update profile
await trpc.auth.updateProfile.mutate({
  displayName: 'John Smith',
  interests: ['documentary', 'murder-mystery']
});
```

### OAuth Flow

```typescript
// Initiate OAuth
const { url } = await trpc.auth.signInWithProvider.mutate({
  provider: 'google',
  redirectTo: 'https://myapp.com/auth/callback'
});

// Redirect user to the OAuth URL
window.location.href = url;
```

### Session Management

```typescript
// Get active sessions
const sessions = await trpc.auth.getSessions.query();

// Sign out from all devices
await trpc.auth.signOutAll.mutate();
```

## Development

### Testing
```bash
npm run test:unit      # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e       # End-to-end tests
```

### Security Auditing
```bash
npm audit              # Check for vulnerabilities
npm run lint:security # Security linting
```

## Monitoring

The system provides comprehensive monitoring through:
- Health check endpoint (`/health`)
- Security stats endpoint (`/admin/security-stats`)
- Rate limiting metrics
- Session analytics
- Failed attempt tracking

## Migration Notes

When upgrading from the simple auth system:
1. User profiles will be automatically created on first access
2. Existing sessions will remain valid during transition
3. Rate limiting rules will apply to existing endpoints
4. New security headers may require frontend updates

## Support

For questions or issues with the authentication system, check:
1. Server logs for error details
2. Redis for session debugging
3. Supabase dashboard for auth provider issues
4. Rate limiting stats for blocked requests