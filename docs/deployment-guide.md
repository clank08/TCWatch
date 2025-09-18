# TCWatch Deployment Guide

This guide covers the complete deployment process for TCWatch across different environments and platforms.

## Quick Start

### Local Development Setup
```bash
# Clone the repository
git clone https://github.com/your-org/tcwatch.git
cd tcwatch

# Setup development environment
npm run setup

# Start development services
npm run docker:up

# Check service health
npm run health:check
```

### Monitoring Stack
```bash
# Start monitoring services
npm run monitoring:start

# Check monitoring status
npm run monitoring:status

# View monitoring dashboards
# Grafana: http://localhost:3001 (admin/admin123)
# Prometheus: http://localhost:9090
```

## Environment Overview

### Development Environment
- **Purpose**: Local development and testing
- **Database**: Local PostgreSQL or Supabase development project
- **Caching**: Local Redis container
- **Search**: Local Meilisearch container
- **Workflows**: Temporal Cloud development namespace
- **Monitoring**: Optional Docker-based stack

### Staging Environment
- **Purpose**: Pre-production testing and QA
- **Database**: Supabase staging project
- **Caching**: Redis Cloud or self-hosted
- **Search**: Meilisearch Cloud staging instance
- **Workflows**: Temporal Cloud staging namespace
- **Monitoring**: Sentry + Docker monitoring stack

### Production Environment
- **Purpose**: Live application serving users
- **Database**: Supabase production project
- **Caching**: Redis Cloud production instance
- **Search**: Meilisearch Cloud production instance
- **Workflows**: Temporal Cloud production namespace
- **Monitoring**: Sentry + full monitoring stack

## Deployment Targets

### 1. Vercel (Web Application)

**Prerequisites**:
- Vercel account and CLI installed
- Environment variables configured in Vercel dashboard

**Staging Deployment**:
```bash
npm run deploy:staging:vercel
```

**Production Deployment**:
```bash
npm run deploy:production:vercel
```

**Manual Deployment**:
```bash
cd TC-Frontend
npx vercel --prod --env-file=../.env.production
```

### 2. Docker (Self-Hosted)

**Prerequisites**:
- Docker and Docker Compose installed
- Docker registry access (if using remote registry)

**Staging Deployment**:
```bash
npm run deploy:staging:docker
```

**Production Deployment**:
```bash
npm run deploy:production:docker
```

**Manual Deployment**:
```bash
# Build and start production containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check container health
docker-compose ps
```

### 3. Expo EAS (Mobile Application)

**Prerequisites**:
- Expo account and EAS CLI installed
- Apple Developer account (for iOS)
- Google Play Console account (for Android)

**Staging Build**:
```bash
npm run deploy:mobile:staging
```

**Production Build and Submit**:
```bash
npm run deploy:mobile:production
```

**Manual Process**:
```bash
cd TC-Frontend

# Build for staging
npx eas build --platform all --profile staging

# Build and submit for production
npx eas build --platform all --profile production
npx eas submit --platform all
```

## Environment Configuration

### Required Environment Variables

**All Environments**:
- `NODE_ENV` - Environment (development/staging/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**External APIs**:
- `WATCHMODE_API_KEY` - Watchmode API key
- `TMDB_API_KEY` - TMDb API key
- `THETVDB_API_KEY` - TheTVDB API key

**Search**:
- `MEILISEARCH_HOST` - Meilisearch server URL
- `MEILISEARCH_MASTER_KEY` - Meilisearch master key

**Monitoring** (Optional):
- `SENTRY_DSN` - Sentry project DSN
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN for mobile app

### Setting Environment Variables

**Vercel**:
1. Go to Project Settings > Environment Variables
2. Add variables for each environment (Development, Preview, Production)
3. Reference variables in build settings

**Docker**:
1. Create environment-specific `.env` files
2. Use Docker secrets for sensitive data in production
3. Configure through docker-compose override files

**EAS Build**:
1. Configure in `eas.json` build profiles
2. Use EAS secrets for sensitive data: `eas secret:create`

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline automatically:
1. Runs tests and quality checks
2. Builds applications
3. Deploys to staging on push to `develop` branch
4. Deploys to production on push to `main` branch

**Staging Pipeline**:
```yaml
# Triggered on push to develop branch
- Lint and test code
- Build applications
- Deploy web app to Vercel staging
- Build mobile app for internal testing
- Run smoke tests
```

**Production Pipeline**:
```yaml
# Triggered on push to main branch
- Lint and test code
- Build applications
- Deploy web app to Vercel production
- Build and submit mobile app to stores
- Run comprehensive health checks
- Send deployment notifications
```

### Manual Pipeline Triggers

**Deploy Staging**:
```bash
# Web application
npm run deploy:staging:vercel

# Docker containers
npm run deploy:staging:docker

# Mobile application
npm run deploy:mobile:staging
```

**Deploy Production**:
```bash
# Web application
npm run deploy:production:vercel

# Docker containers
npm run deploy:production:docker

# Mobile application
npm run deploy:mobile:production
```

## Health Checks and Monitoring

### System Health Check
```bash
# Run comprehensive health check
npm run health:check

# Check specific services
./scripts/health-checks/system-health.sh -v
```

### Monitoring Dashboard Access

**Grafana** (http://localhost:3001):
- Username: admin
- Password: admin123
- Dashboards: TCWatch Overview, System Metrics

**Prometheus** (http://localhost:9090):
- Metrics collection and querying
- Alert rule configuration

**Sentry** (https://sentry.io):
- Error tracking and performance monitoring
- Release health and user feedback

### Health Check Endpoints

**Backend API**:
- `GET /health` - Basic health status
- `GET /health/detailed` - Detailed service status
- `GET /metrics` - Prometheus metrics

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "meilisearch": "healthy",
    "temporal": "healthy"
  },
  "version": "1.0.0"
}
```

## Troubleshooting

### Common Deployment Issues

**1. Environment Variable Errors**
```bash
# Check environment configuration
cat .env.production

# Verify required variables are set
npm run health:check
```

**2. Docker Build Failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild containers
npm run docker:build
```

**3. Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check Supabase service status
curl -f https://your-project.supabase.co/rest/v1/
```

**4. Mobile Build Failures**
```bash
# Clear Expo cache
cd TC-Frontend
npx expo install --fix

# Check EAS build logs
npx eas build:list
```

### Performance Issues

**1. Slow API Responses**
- Check database query performance
- Review Redis cache hit rates
- Monitor external API response times

**2. High Memory Usage**
- Check container resource limits
- Review application memory leaks
- Monitor garbage collection patterns

**3. Search Performance**
- Check Meilisearch index status
- Review search query complexity
- Monitor search response times

## Security Considerations

### Production Security Checklist

- [ ] All API keys rotated and secured
- [ ] Database connections use SSL
- [ ] Redis connections are password-protected
- [ ] HTTPS enforced for all traffic
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages don't leak sensitive data
- [ ] Logging configured to exclude sensitive data
- [ ] Security headers configured

### Security Monitoring

- Monitor failed authentication attempts
- Track API key usage and anomalies
- Set up alerts for unusual traffic patterns
- Regular security scans with Snyk/Trivy
- Monitor dependency vulnerabilities

## Backup and Recovery

### Database Backups
- Supabase automatic daily backups
- Point-in-time recovery available
- Manual backup procedures documented

### Configuration Backups
- Environment configurations in version control
- Infrastructure as Code with Terraform/Pulumi
- Deployment scripts and procedures documented

### Disaster Recovery Plan
1. Assess impact and scope
2. Activate backup services
3. Restore from latest backups
4. Verify system functionality
5. Communicate with stakeholders
6. Document incident and improvements

## Support and Escalation

### Monitoring Alerts
- Critical: Page on-call engineer immediately
- Warning: Create ticket for next business day
- Info: Log for trending analysis

### Escalation Contacts
- Technical Lead: [Contact Info]
- Platform Team: [Contact Info]
- Security Team: [Contact Info]

### Runbooks
- Service restart procedures
- Database maintenance tasks
- Certificate renewal process
- Scaling procedures
- Incident response playbook