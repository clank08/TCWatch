# API Keys Setup Guide

This document provides instructions for obtaining and configuring all external API keys required for TCWatch.

## Required API Keys

### 1. Watchmode API (Required)
**Purpose**: Streaming availability data across 200+ platforms
**Cost**: Free tier available (5,000 requests/month), paid tiers start at $10/month
**Website**: https://api.watchmode.com/

**Setup Steps**:
1. Visit https://api.watchmode.com/
2. Sign up for an account
3. Choose your plan (Free tier is sufficient for development)
4. Copy your API key from the dashboard
5. Add to environment variables: `WATCHMODE_API_KEY=your_key_here`

**Rate Limits**:
- Free: 1,000 requests/day, 5,000/month
- Paid: Up to 100,000 requests/month

### 2. The Movie Database (TMDb) API (Required)
**Purpose**: Movie and TV show metadata, images, cast information
**Cost**: Free
**Website**: https://www.themoviedb.org/settings/api

**Setup Steps**:
1. Create account at https://www.themoviedb.org/
2. Go to Settings > API
3. Request an API key (choose "Developer" option)
4. Fill out the application form (use TCWatch project details)
5. Copy your API key (v3 auth)
6. Add to environment variables: `TMDB_API_KEY=your_key_here`

**Rate Limits**: 40 requests per 10 seconds

### 3. TheTVDB API (Required)
**Purpose**: Detailed TV series and episode data
**Cost**: Free tier available, paid tiers for commercial use
**Website**: https://thetvdb.com/api-information

**Setup Steps**:
1. Create account at https://thetvdb.com/
2. Go to API Information page
3. Subscribe to API access
4. Create a new API key in your account
5. Copy your API key
6. Add to environment variables: `THETVDB_API_KEY=your_key_here`

**Rate Limits**: 1,000 requests per day (free tier)

### 4. Supabase (Required)
**Purpose**: Database, authentication, file storage
**Cost**: Free tier available, paid tiers start at $25/month
**Website**: https://supabase.com/

**Setup Steps**:
1. Create account at https://supabase.com/
2. Create a new project
3. Go to Settings > API
4. Copy the following values:
   - Project URL: `SUPABASE_URL`
   - Anon key: `SUPABASE_ANON_KEY`
   - Service role key: `SUPABASE_SERVICE_ROLE_KEY`
5. Go to Settings > Database and copy the connection string for `DATABASE_URL`

### 5. Meilisearch (Required)
**Purpose**: Fast search functionality
**Cost**: Self-hosted (free) or Meilisearch Cloud ($29/month)
**Website**: https://www.meilisearch.com/

**Options**:

#### Option A: Local Development (Free)
- Use the Docker container included in docker-compose.yml
- Set `MEILISEARCH_MASTER_KEY=dev_meili_master_key_123`

#### Option B: Meilisearch Cloud
1. Sign up at https://www.meilisearch.com/cloud
2. Create a new project
3. Copy your endpoint URL and API key
4. Set `MEILISEARCH_HOST=https://ms-your-project.meilisearch.io`
5. Set `MEILISEARCH_MASTER_KEY=your_api_key`

### 6. Temporal Cloud (Required)
**Purpose**: Workflow orchestration for API syncing
**Cost**: Free tier available, paid tiers start at $200/month
**Website**: https://temporal.io/cloud

**Setup Steps**:
1. Sign up at https://temporal.io/cloud
2. Create a new namespace
3. Download client certificates
4. Set environment variables:
   - `TEMPORAL_CLOUD_URL=your-namespace.tmprl.cloud:7233`
   - `TEMPORAL_NAMESPACE=your-namespace`

### 7. Sentry (Recommended)
**Purpose**: Error tracking and performance monitoring
**Cost**: Free tier available (5,000 errors/month), paid tiers start at $26/month
**Website**: https://sentry.io/

**Setup Steps**:
1. Create account at https://sentry.io/
2. Create a new project (select Node.js for backend, React Native for mobile)
3. Copy your DSN from the project settings
4. Set environment variables:
   - `SENTRY_DSN=your_dsn_here`
   - `EXPO_PUBLIC_SENTRY_DSN=your_dsn_here` (for mobile app)

## Optional API Keys

### TVMaze API
**Purpose**: Additional TV scheduling data
**Cost**: Free
**Setup**: No API key required, just set `TVMAZE_BASE_URL=https://api.tvmaze.com`

### Wikidata API
**Purpose**: Criminal case and true crime metadata
**Cost**: Free
**Setup**: No API key required, just set `WIKIDATA_BASE_URL=https://www.wikidata.org/w/api.php`

## Environment Configuration

### Development Environment
Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Staging/Production Environment
Configure environment variables in your deployment platform:
- Vercel: Project Settings > Environment Variables
- Railway: Variables tab in your project
- Docker/Kubernetes: Secrets and ConfigMaps
- AWS: Systems Manager Parameter Store or Secrets Manager

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables only
   - Add `.env*` to `.gitignore` (already done)

2. **Use different keys for different environments**
   - Development keys for local development
   - Staging keys for staging environment
   - Production keys for production

3. **Rotate keys regularly**
   - Set up monitoring for key usage
   - Rotate keys every 90 days

4. **Use least privilege principle**
   - Only request the minimum permissions needed
   - Use read-only keys where possible

5. **Monitor API usage**
   - Set up alerts for unusual API usage
   - Monitor rate limits and quotas

## Cost Estimation

### Free Tier (Development)
- Watchmode: Free (5,000 requests/month)
- TMDb: Free
- TheTVDB: Free (1,000 requests/day)
- Supabase: Free (500MB database, 2GB bandwidth)
- Meilisearch: Free (self-hosted)
- Temporal: Free tier available
- Sentry: Free (5,000 errors/month)
- **Total: $0/month**

### Production Scale (Estimated)
- Watchmode: $50/month (100,000 requests)
- TMDb: Free
- TheTVDB: $20/month (commercial use)
- Supabase: $25/month (8GB database, 100GB bandwidth)
- Meilisearch Cloud: $29/month
- Temporal Cloud: $200/month
- Sentry: $26/month (50,000 errors)
- **Total: ~$350/month**

## Troubleshooting

### Common Issues

1. **"Invalid API Key" errors**
   - Check that the key is correctly copied (no extra spaces)
   - Verify the key is active and not expired
   - Check rate limits aren't exceeded

2. **CORS errors with APIs**
   - Some APIs require domain whitelisting
   - Add your domains to API dashboard settings

3. **Rate limit exceeded**
   - Implement caching to reduce API calls
   - Consider upgrading to paid tiers
   - Add request queuing and retry logic

4. **Connection timeouts**
   - Check API service status pages
   - Implement proper timeout and retry logic
   - Consider using circuit breaker pattern

### Support Resources

- Watchmode: support@watchmode.com
- TMDb: https://www.themoviedb.org/talk
- TheTVDB: https://forums.thetvdb.com/
- Supabase: https://supabase.com/support
- Meilisearch: https://discord.meilisearch.com/
- Temporal: https://community.temporal.io/
- Sentry: https://sentry.io/support/