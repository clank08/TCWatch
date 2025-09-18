# TCWatch Backend

The backend API server for TCWatch (True Crime Tracker) - a cross-platform application for tracking True Crime content across 200+ streaming services.

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (Required)
- **Node.js 20+** (Recommended)
- **npm 9+** (Recommended)

### One-Command Setup

```bash
# Linux/macOS
chmod +x scripts/dev-setup.sh && ./scripts/dev-setup.sh

# Windows (PowerShell)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\dev-setup.ps1
```

### Manual Setup

1. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and secrets
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Services**
   ```bash
   # Start all Docker services
   npm run docker:dev

   # Or start with build
   npm run docker:dev:build
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🐳 Docker Environment

### Services Included

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Redis** | 6379 | Caching & sessions | Redis ping |
| **Meilisearch** | 7700 | Content search engine | HTTP health |
| **Nginx** | 80/443 | API Gateway | - |
| **Backend API** | 3000 | Main application | `/health` endpoint |

**External Managed Services:**
| Service | Description | Provider |
|---------|-------------|---------|
| **PostgreSQL** | Primary database with auth | Supabase |
| **Temporal** | Workflow orchestration | Temporal Cloud |

### Development Tools (Optional)

Start with: `npm run docker:tools`

| Tool | Port | Description | Credentials |
|------|------|-------------|-------------|
| **Redis Commander** | 8081 | Redis GUI | admin/admin123 |

**External Management Tools:**
| Tool | Description | Access |
|------|-------------|--------|
| **Supabase Dashboard** | Database & Auth management | https://app.supabase.com |
| **Temporal Cloud UI** | Workflow monitoring | https://cloud.temporal.io |

### Docker Commands

```bash
# Development
npm run docker:dev              # Start all services
npm run docker:dev:build        # Start with rebuild
npm run docker:dev:logs         # View logs
npm run docker:dev:down         # Stop services
npm run docker:dev:clean        # Stop and remove volumes

# Production
npm run docker:prod             # Start production services
npm run docker:prod:build       # Start production with rebuild

# Tools
npm run docker:tools            # Start development tools
npm run docker:tools:down       # Stop development tools
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                     # Start dev server with hot-reload
npm run build                   # Build for production
npm start                       # Start production server

# Testing
npm test                        # Run tests
npm run test:watch              # Run tests in watch mode
npm run test:coverage           # Run tests with coverage

# Code Quality
npm run lint                    # Run ESLint
npm run lint:fix                # Fix ESLint errors
npm run format                  # Format code with Prettier
npm run type-check              # TypeScript type checking

# Database
npm run db:migrate              # Run database migrations
npm run db:generate             # Generate Prisma client
npm run db:seed                 # Seed database with sample data
npm run db:reset                # Reset database

# Utilities
npm run health                  # Check API health
npm run setup                   # Complete environment setup
npm run clean                   # Clean build artifacts
```

### Project Structure

```
TC-Backend/
├── src/
│   ├── config/          # Configuration files
│   ├── db/              # Database models and migrations
│   ├── middleware/      # Fastify middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── workflows/       # Temporal workflows
│   └── index.ts         # Application entry point
├── docker/              # Docker configuration files
│   ├── nginx/           # Nginx reverse proxy config
│   ├── postgres/        # PostgreSQL initialization
│   └── temporal/        # Temporal configuration
├── scripts/             # Development scripts
├── tests/               # Test files
├── docker-compose.yml   # Development services
├── docker-compose.prod.yml # Production overrides
├── Dockerfile           # Production image
├── Dockerfile.dev       # Development image
└── .env.example         # Environment variables template
```

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Application
NODE_ENV=development
PORT=3000

# Database (Supabase)
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cache
REDIS_URL=redis://localhost:6379

# Search
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_master_key

# External APIs
WATCHMODE_API_KEY=your_watchmode_key
TMDB_API_KEY=your_tmdb_key
THETVDB_API_KEY=your_thetvdb_key

# Security
JWT_SECRET=your_jwt_secret_here
```

### Required Service Setup

**Managed Services:**
1. **Supabase** - [Create Project](https://app.supabase.com/) for PostgreSQL + Auth
2. **Temporal Cloud** - [Get Account](https://cloud.temporal.io/) for workflow orchestration

**External API Keys:**
1. **Watchmode API** - [Get API Key](https://api.watchmode.com/)
2. **TMDb API** - [Get API Key](https://www.themoviedb.org/settings/api)
3. **TheTVDB API** - [Get API Key](https://thetvdb.com/api-information)
4. **TVMaze API** - [Get API Key](https://www.tvmaze.com/api)

## 📊 Monitoring & Health

### Health Checks

```bash
# Check API health
curl http://localhost:3000/health

# Check individual services
docker-compose ps
docker-compose logs -f [service-name]
```

### Service URLs

- **API Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **Meilisearch**: http://localhost:7700
- **Redis Commander**: http://localhost:8081 (with tools)
- **Supabase Dashboard**: https://app.supabase.com (database management)
- **Temporal Cloud UI**: https://cloud.temporal.io (workflow monitoring)

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full workflow testing

## 🚀 Production Deployment

### Building for Production

```bash
# Build Docker image
docker build -t tcwatch-backend .

# Run production stack
npm run docker:prod
```

### Environment Considerations

- Supabase handles database scaling and backups automatically
- Temporal Cloud provides managed workflow orchestration
- Configure proper SSL certificates for custom domains
- Set secure JWT secrets
- Enable proper logging levels
- Configure monitoring and alerts

## 🔒 Security

### Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** on API endpoints
- **CORS Protection** with allowlist
- **Input Validation** using Zod schemas
- **SQL Injection Protection** via Prisma ORM
- **Security Headers** via Helmet middleware

### Security Best Practices

- Always use HTTPS in production
- Rotate JWT secrets regularly
- Monitor API usage for anomalies
- Keep dependencies updated
- Use environment variables for secrets

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run `npm run lint:fix` and `npm run format`
4. Ensure all tests pass with `npm test`
5. Submit a pull request

## 📝 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/docs/json

## 🆘 Troubleshooting

### Common Issues

**Docker services won't start:**
```bash
# Check Docker is running
docker info

# Clean up and restart
npm run docker:dev:clean
npm run docker:dev
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -tulpn | grep :3000

# Kill processes or change ports in docker-compose.yml
```

**Environment variables not loading:**
```bash
# Ensure .env file exists
cp .env.example .env

# Check file permissions
chmod 644 .env
```

**Database connection issues:**
```bash
# Check Supabase connection
curl -H "apikey: your_supabase_anon_key" https://your-project-ref.supabase.co/rest/v1/

# View Supabase dashboard
# Visit https://app.supabase.com for database monitoring

# Reset database migrations
npm run db:reset
```

### Getting Help

- Check the [project documentation](../project-documentation/)
- View Docker logs: `npm run docker:dev:logs`
- Check service health: `docker-compose ps`
- Review environment variables in `.env`

## 📄 License

MIT License - see LICENSE file for details.