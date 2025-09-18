# TCWatch Deployment Guide

This document outlines the deployment strategy, branch protection rules, and CI/CD workflows for the TCWatch project.

## Repository Structure

```
TCWatch/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                 # Continuous Integration
│   │   ├── backend-deploy.yml     # Backend Deployment
│   │   └── mobile-build.yml       # Mobile App Builds
│   └── dependabot.yml            # Dependency Updates
├── TC-Frontend/                   # Expo React Native Mobile App
├── TC-Backend/                    # Fastify/tRPC Backend API
├── packages/                      # Shared Libraries
├── .env.development              # Development Environment
├── .env.staging                  # Staging Environment
└── .env.production              # Production Environment
```

## Branch Strategy

### Main Branches

- **`main`** - Production-ready code. All releases are tagged from this branch.
- **`develop`** - Integration branch for feature development. Automatically deploys to staging.

### Feature Branches

- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes
- **`release/*`** - Release preparation branches

## Branch Protection Rules

### Main Branch Protection

Configure the following protection rules for the `main` branch in GitHub:

```yaml
Branch Protection Rules for 'main':
  Require a pull request before merging: ✅
    Require approvals: 2
    Dismiss stale PR approvals when new commits are pushed: ✅
    Require review from code owners: ✅
    Restrict pushes that create files that exceed GitHub's file size limit: ✅

  Require status checks to pass before merging: ✅
    Require branches to be up to date before merging: ✅
    Required status checks:
      - CI Pipeline Success (ci-success)
      - Test Frontend (test-frontend)
      - Test Backend (test-backend)
      - Lint & Format (lint)
      - Build Verification (build)
      - Security Scan (security)

  Require conversation resolution before merging: ✅
  Require signed commits: ✅
  Require linear history: ✅
  Include administrators: ✅
  Restrict pushes: ✅
    Restrict pushes to specific people or teams: tcwatch-team
  Allow force pushes: ❌
  Allow deletions: ❌
```

### Develop Branch Protection

Configure the following protection rules for the `develop` branch:

```yaml
Branch Protection Rules for 'develop':
  Require a pull request before merging: ✅
    Require approvals: 1
    Dismiss stale PR approvals when new commits are pushed: ✅
    Require review from code owners: ❌

  Require status checks to pass before merging: ✅
    Require branches to be up to date before merging: ✅
    Required status checks:
      - CI Pipeline Success (ci-success)
      - Test Frontend (test-frontend)
      - Test Backend (test-backend)
      - Lint & Format (lint)

  Require conversation resolution before merging: ✅
  Require signed commits: ❌
  Require linear history: ❌
  Include administrators: ❌
  Allow force pushes: ❌
  Allow deletions: ❌
```

## Deployment Environments

### Development Environment

- **Purpose**: Local development and testing
- **Trigger**: Manual (`docker-compose up`)
- **Database**: Local PostgreSQL or Supabase dev project
- **API URL**: `http://localhost:3001`
- **Mobile App**: Expo development builds

### Staging Environment

- **Purpose**: Pre-production testing and QA
- **Trigger**: Automatic on push to `develop` branch
- **Infrastructure**: AWS ECS or similar
- **Database**: Supabase staging project
- **API URL**: `https://api-staging.tcwatch.app`
- **Mobile App**: Expo preview builds distributed via EAS

### Production Environment

- **Purpose**: Live user-facing application
- **Trigger**: Manual deployment from `main` branch
- **Infrastructure**: AWS ECS with auto-scaling
- **Database**: Supabase production project
- **API URL**: `https://api.tcwatch.app`
- **Mobile App**: App Store and Google Play Store releases

## CI/CD Workflows

### 1. Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger

**Jobs:**
1. **Changes Detection** - Identifies which parts of the monorepo changed
2. **Setup** - Installs dependencies and builds shared packages
3. **Lint & Format** - ESLint, Prettier, TypeScript type checking
4. **Test Frontend** - Jest tests for React Native app
5. **Test Backend** - Jest tests for Fastify API with test database
6. **Build Verification** - Ensures both frontend and backend build successfully
7. **Security Scan** - Trivy vulnerability scanning and npm audit

**Caching Strategy:**
- Node modules cache with lock file hash
- Build artifacts cache for faster subsequent runs
- Separate caches for frontend, backend, and packages

### 2. Backend Deployment (`backend-deploy.yml`)

**Triggers:**
- Push to `main` branch (staging + production)
- Manual trigger with environment selection

**Jobs:**
1. **Pre-deployment Checks** - Run tests and build verification
2. **Build & Push Docker Image** - Multi-platform builds with SBOM generation
3. **Security Scan** - Container vulnerability assessment
4. **Deploy to Staging** - ECS service update with health checks
5. **Deploy to Production** - Blue-green deployment with rollback capability
6. **Notifications** - Slack notifications for deployment status

**Deployment Strategy:**
- **Staging**: Automatic deployment on `main` branch push
- **Production**: Manual approval required via GitHub environments
- **Rollback**: Automatic rollback on health check failures

### 3. Mobile Build (`mobile-build.yml`)

**Triggers:**
- Push to `main` or `develop` branches (mobile changes only)
- Pull requests (development builds)
- Manual trigger with platform/profile selection

**Jobs:**
1. **Development Builds** - Quick builds for PR testing
2. **Preview Builds** - Staging builds with TestFlight/Internal Testing
3. **Production Builds** - App Store/Play Store submissions
4. **OTA Updates** - Expo updates for compatible changes

**Build Profiles:**
- **Development**: Debug builds for testing
- **Preview**: Staging builds for internal testing
- **Production**: Release builds for app stores

## Secret Management

### Required Secrets

Configure the following secrets in your GitHub repository:

#### AWS Secrets
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

#### Database Secrets
```
SUPABASE_STAGING_URL
SUPABASE_STAGING_ANON_KEY
SUPABASE_STAGING_SERVICE_ROLE_KEY
SUPABASE_PRODUCTION_URL
SUPABASE_PRODUCTION_ANON_KEY
SUPABASE_PRODUCTION_SERVICE_ROLE_KEY
```

#### Expo/Mobile Secrets
```
EXPO_TOKEN
APPLE_ID
APPLE_APP_SPECIFIC_PASSWORD
GOOGLE_SERVICE_ACCOUNT_KEY
EXPO_PUSH_STAGING_ACCESS_TOKEN
EXPO_PUSH_PRODUCTION_ACCESS_TOKEN
```

#### External API Keys
```
WATCHMODE_STAGING_API_KEY
WATCHMODE_PRODUCTION_API_KEY
TMDB_STAGING_API_KEY
TMDB_PRODUCTION_API_KEY
TVDB_STAGING_API_KEY
TVDB_PRODUCTION_API_KEY
```

#### Monitoring & Notifications
```
SENTRY_STAGING_DSN
SENTRY_PRODUCTION_DSN
SLACK_WEBHOOK_URL
```

#### Application Secrets
```
JWT_STAGING_SECRET
JWT_PRODUCTION_SECRET
SESSION_STAGING_SECRET
SESSION_PRODUCTION_SECRET
```

### Environment Variables

Environment-specific variables are managed through:
1. **Development**: `.env.development` file (local development)
2. **Staging**: GitHub environment secrets + `.env.staging` template
3. **Production**: GitHub environment secrets + `.env.production` template

## Deployment Process

### Feature Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop and Test Locally**
   ```bash
   npm run dev
   npm run test
   ```

3. **Create Pull Request**
   - CI pipeline runs automatically
   - Development mobile builds created for testing
   - Code review required

4. **Merge to Develop**
   - Automatic deployment to staging environment
   - Preview mobile builds published

### Release Workflow

1. **Create Release Branch**
   ```bash
   git checkout -b release/v1.0.0
   ```

2. **Final Testing and Bug Fixes**
   - Deploy to staging for final QA
   - Fix any issues found

3. **Merge to Main**
   - Create pull request from release branch to main
   - Requires 2 approvals and all status checks
   - Manual production deployment approval

4. **Production Deployment**
   - Backend deployed via ECS blue-green strategy
   - Mobile builds submitted to app stores
   - Tag release in GitHub

### Hotfix Workflow

1. **Create Hotfix Branch from Main**
   ```bash
   git checkout main
   git checkout -b hotfix/critical-fix
   ```

2. **Fix and Test**
   - Minimal changes only
   - Test thoroughly

3. **Fast-track to Production**
   - Emergency approval process
   - Direct deployment to production
   - Merge back to develop

## Monitoring and Alerting

### Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **Health Checks**: Automated endpoint monitoring
- **Metrics**: Custom application metrics via Prometheus

### Infrastructure Monitoring
- **AWS CloudWatch**: Infrastructure metrics and logs
- **ECS Service Health**: Container health and auto-scaling
- **Database Performance**: Supabase monitoring dashboards

### Notifications
- **Slack Integration**: Deployment status and alerts
- **GitHub Status Checks**: PR status and deployment updates
- **PagerDuty**: Critical production alerts (optional)

## Rollback Procedures

### Backend Rollback
```bash
# Automatic rollback on deployment failure
# Manual rollback via GitHub Actions
gh workflow run backend-deploy.yml -f rollback=true
```

### Mobile App Rollback
```bash
# Expo OTA rollback
expo publish:rollback
```

### Database Rollback
- Database migrations are forward-only
- Use database backups for critical rollbacks
- Coordinate with application rollback

## Security Considerations

### Code Security
- **Dependency Scanning**: Dependabot and Trivy vulnerability scanning
- **Secret Scanning**: GitHub secret scanning enabled
- **Code Scanning**: CodeQL analysis for security vulnerabilities

### Deployment Security
- **Signed Commits**: Required for main branch
- **Environment Isolation**: Separate credentials and infrastructure per environment
- **Access Controls**: Limited deployment permissions via GitHub teams

### Runtime Security
- **Container Scanning**: Multi-stage security scanning in CI/CD
- **Network Security**: VPC isolation and security groups
- **Data Encryption**: TLS in transit, encryption at rest

## Troubleshooting

### Common Issues

1. **CI Pipeline Failures**
   - Check individual job logs in GitHub Actions
   - Verify all required secrets are configured
   - Ensure branch is up to date with target

2. **Deployment Failures**
   - Check ECS service logs in AWS CloudWatch
   - Verify environment variables are set correctly
   - Check health endpoint responses

3. **Mobile Build Failures**
   - Verify Expo credentials are valid
   - Check EAS build logs for specific errors
   - Ensure app.json configuration is correct

### Getting Help

- **GitHub Issues**: Create issues for bugs and feature requests
- **Documentation**: Check project documentation in `/docs`
- **Team Communication**: Use designated Slack channels
- **On-call Procedures**: Follow incident response playbook

## Best Practices

### Development
- Always create feature branches from `develop`
- Write tests for new functionality
- Update documentation with changes
- Use conventional commit messages

### Deployment
- Test changes in staging before production
- Monitor deployments closely
- Have rollback plan ready
- Coordinate with team for major releases

### Security
- Rotate secrets regularly
- Review access permissions quarterly
- Keep dependencies updated
- Follow security scanning recommendations