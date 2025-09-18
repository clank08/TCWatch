# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TCWatch (True Crime Tracker) is a cross-platform mobile and web application for tracking True Crime content across 200+ streaming services and cable networks. Currently the mobile app (Expo) has been initialized, with full implementation planned per the architecture and design documentation.

## Technology Stack

### Frontend

-   **Mobile** (TC-Frontend/): Expo React Native with TypeScript, Expo Router (initialized)
    -   Future additions: NativeWind (Tailwind CSS), Tanstack Query v5, Zustand, tRPC client
-   **Web** (Planned): Remix v2 with TypeScript, Tailwind CSS, SSR

### Backend

-   **Runtime**: Node.js 20 LTS with Fastify and TypeScript
-   **Database**: PostgreSQL via Supabase
-   **Caching**: Redis (Docker container)
-   **Authentication**: Supabase Auth
-   **Search**: Meilisearch for content discovery
-   **Workflow Orchestration**: Temporal for API sync workflows
-   **APIs**: tRPC server for type-safe APIs
-   **Containerization**: Docker and Docker Compose for all services

### Infrastructure

-   **Database & Auth**: Supabase
-   **Web Hosting**: Vercel
-   **Mobile Builds**: Expo EAS
-   **Search Engine**: Meilisearch Cloud
-   **Workflow**: Temporal Cloud

### External API Integrations

-   Watchmode API (streaming availability across 200+ platforms)
-   TMDb API (movie/TV metadata)
-   TheTVDB API (episode-level TV series data)
-   TVMaze API (TV scheduling)
-   Wikidata API (criminal/case data)

## Project Structure

```
TCWatch/
├── TC-Frontend/               # Expo React Native mobile app (initialized)
├── TC-Backend/                # Backend services (planned)
├── project-documentation/     # All project documentation
│   ├── product-requirements.md
│   ├── tech-stack-pref.md
│   ├── architecture-output.md  # Complete technical architecture
│   └── design-documentation/
└── TASKS.MD                   # Development phases and task breakdown
```

## Development Commands

### Mobile Development (TC-Frontend)

```bash
cd TC-Frontend
npm install              # Install dependencies
npm start               # Start Expo development server (or expo start)
npm run android         # Run on Android
npm run ios            # Run on iOS
npm run web            # Run in web browser
npm run lint           # Run ESLint
```

### Backend Development (Future)

```bash
docker-compose up -d    # Start all backend services
docker-compose logs -f # View logs
docker-compose down     # Stop all services
```

## Architecture Overview

### Service Architecture

The application follows a microservices architecture with Docker containerization:

```
Client Apps (Mobile/Web) → API Gateway (nginx/traefik) → tRPC Server
                                                         ↓
                              Core Services: Content, Social, Auth, Notification, Workflow
                                                         ↓
                              Data Layer: Supabase (PostgreSQL + Auth), Redis, Meilisearch
                                                         ↓
                              External APIs: Watchmode, TMDb, TheTVDB, TVMaze, Wikidata
```

### Database Schema Highlights

-   **users** → Extended by Supabase Auth
-   **content** → Aggregated metadata from external APIs
-   **user_content** → User's tracking states and progress
-   **episode_progress** → TV series episode tracking
-   **custom_lists** → User-created shareable lists
-   **content_cases** → Criminal case metadata and linkages

All tables use Row Level Security (RLS) for privacy-first data access.

### API Architecture (tRPC)

-   **authRouter**: Registration, login, profile management
-   **contentRouter**: Search, tracking, recommendations
-   **socialRouter**: Lists, friends, activity feeds
-   **notificationRouter**: Alerts and digest management

### Temporal Workflows

-   Content synchronization across 5 external APIs
-   Daily platform availability updates
-   Weekly content digest generation
-   Failure handling with exponential backoff

### Development Phases

See `TASKS.MD` for complete 10-phase development roadmap:

1. Foundation & Infrastructure (1-2 weeks)
2. Authentication (1 week)
3. Backend Services (2 weeks)
4. Frontend Foundation (2 weeks)
5. Content Discovery (2 weeks)
6. Content Tracking (2 weeks)
7. Social Features (2 weeks)
8. Notifications (1 week)
9. Testing & QA (2 weeks)
10. Production Deployment (1 week)

## Performance Targets

-   App launch: <2 seconds
-   Search response: <100ms (Meilisearch)
-   API response: <500ms p99
-   Workflow completion: 99.9% success rate

## Key Differentiators

-   True Crime content focus (not general entertainment)
-   Case-based organization (content grouped by criminal cases)
-   Privacy-first social features (all content private by default)
-   Support for both streaming AND cable networks
-   Target audience: 25-55 year old True Crime enthusiasts

### Memories

-   Read `project-documentation` for complete requirements, user stories, and technical specifications.

-   check TASK.md before starting your work
-   mark completed tasks immediately
-   add newly discovered tasks
