# TCWatch Prisma ORM Setup

## Overview

This document describes the complete Prisma ORM setup for TCWatch, including the comprehensive database schema, seed data, and usage instructions.

## Database Schema

The Prisma schema (`prisma/schema.prisma`) includes all tables required for the TCWatch application:

### Core Tables

#### User Management
- **`user_profiles`** - Extended user profiles (extends Supabase auth.users)
- **`friendships`** - Friend relationships and connection status
- **`social_activities`** - User activity feed and social interactions
- **`notifications`** - User notifications and alerts
- **`user_achievements`** - User badges and achievements

#### Content Management
- **`content`** - Aggregated True Crime content metadata
- **`content_cases`** - Criminal case information and metadata
- **`content_case_links`** - Many-to-many relationship between content and cases
- **`user_content`** - User content tracking (want_to_watch, watching, completed, archived)
- **`episode_progress`** - TV series episode tracking

#### Lists and Social Features
- **`custom_lists`** - User-created shareable lists
- **`list_items`** - Content items within custom lists

#### Community Features
- **`challenges`** - Community challenges and events
- **`challenge_content`** - Content included in each challenge
- **`challenge_participants`** - User participation in challenges
- **`challenge_progress`** - Individual content progress within challenges

#### System Management
- **`sync_jobs`** - External API synchronization tracking

### Key Features

1. **UUID Primary Keys** - All tables use UUID for scalability
2. **Proper Timestamps** - Created/updated timestamps on all relevant tables
3. **Foreign Key Relationships** - Properly defined with cascade/set null behavior
4. **Performance Indexes** - Strategic indexes for common query patterns
5. **JSON Storage** - Flexible JSON fields for metadata and configuration
6. **Enums** - Type-safe enums for status fields

### Schema Enums

- `ContentType`: MOVIE, TV_SERIES, DOCUMENTARY, PODCAST
- `TrackingStatus`: WANT_TO_WATCH, WATCHING, COMPLETED, ABANDONED
- `ListPrivacy`: PRIVATE, FRIENDS, PUBLIC
- `FriendshipStatus`: PENDING, ACCEPTED, BLOCKED
- `ChallengeType`: VIEWING_CHALLENGE, RESEARCH_PROJECT, CONTENT_MARATHON, CASE_DEEP_DIVE, SEASONAL_EVENT
- `ChallengeStatus`: UPCOMING, ACTIVE, COMPLETED, CANCELLED
- `ParticipantStatus`: JOINED, ACTIVE, COMPLETED, WITHDRAWN
- `AchievementType`: CHALLENGE_COMPLETED, STREAK_ACHIEVED, CONTENT_MILESTONE, SOCIAL_MILESTONE, RESEARCH_BADGE, COMMUNITY_AWARD
- `SyncStatus`: PENDING, RUNNING, COMPLETED, FAILED
- `CaseStatus`: SOLVED, UNSOLVED, COLD

## Setup Instructions

### Prerequisites

1. **Node.js 20+** - Required runtime
2. **Docker** - For local development services
3. **PostgreSQL** - Either local (Docker) or Supabase

### Local Development Setup

1. **Start Development Services**
   ```bash
   cd TC-Backend
   npm run docker:dev
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

4. **Run Migrations** (when database connection is working)
   ```bash
   npm run db:migrate
   ```

5. **Seed Database**
   ```bash
   npm run db:seed
   ```

### Environment Configuration

The `.env` file contains database connection settings:

```env
# Local Development
DATABASE_URL=postgresql://postgres:dev_password_123@localhost:5432/tcwatch
DIRECT_URL=postgresql://postgres:dev_password_123@localhost:5432/tcwatch

# Supabase Production
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Database Migration Strategy

#### Local Development
- Uses local PostgreSQL via Docker
- Full schema control and rapid iteration
- Prisma migrations for schema changes

#### Production (Supabase)
- Managed PostgreSQL with auth integration
- Row Level Security (RLS) policies
- Supabase Dashboard for database management

## Seed Data

The seed script (`src/scripts/seed.ts`) provides comprehensive sample data:

### Sample Content
- **Movies**: "Extremely Wicked, Shockingly Evil and Vile", "Zodiac"
- **TV Series**: "Mind Hunter" with episode tracking
- **Documentaries**: "Conversations with a Killer", "I'll Be Gone in the Dark"

### Sample Cases
- Ted Bundy Murders
- Zodiac Killer
- Golden State Killer
- BTK Killer
- JonBenét Ramsey Case

### Sample Users
- True Crime Sarah (active user with tracking)
- Detective Mike (law enforcement perspective)
- Crime Podcast Lisa (privacy-focused user)

### Sample Features
- Friend relationships and social activities
- Custom lists with content
- Challenge participation and progress
- User achievements and notifications

## Available Scripts

```bash
# Database Management
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run database migrations
npm run db:seed        # Populate with sample data
npm run db:reset       # Reset database (destructive)

# Development
npm run dev           # Start development server
npm run docker:dev    # Start Docker services
npm run docker:dev:logs # View Docker logs

# Testing
npm run test          # Run unit tests
npm run test:coverage # Run tests with coverage
```

## Architecture Compliance

The schema complies with the TCWatch architecture documentation:

✅ **User Management** - Complete user profiles with privacy settings
✅ **Content Tracking** - Four-state tracking system (want/watching/completed/archived)
✅ **Social Features** - Friends, lists, activity feeds with privacy controls
✅ **Community Features** - Challenges, achievements, gamification
✅ **Criminal Cases** - Structured case metadata with content linkage
✅ **Search Support** - Full-text search vectors for content discovery
✅ **Platform Tracking** - Streaming/cable availability metadata
✅ **Notification System** - Comprehensive notification preferences
✅ **External API Sync** - Tracking for API synchronization jobs

## Performance Considerations

### Indexes
- Composite indexes for common query patterns
- GIN indexes for array fields and JSON search
- Descending indexes for chronological data

### Relationships
- Proper foreign key constraints with appropriate cascade behavior
- Many-to-many relationships via junction tables
- Efficient one-to-many relationships

### Scalability
- UUID primary keys for distributed systems
- JSON fields for flexible metadata
- Proper normalization to reduce data duplication

## Security Features

### Row Level Security (RLS)
- User data isolation at database level
- Privacy-aware data access patterns
- Friend-based content visibility

### Data Privacy
- Configurable privacy settings per user
- Private-by-default approach
- Granular notification preferences

## Next Steps

1. **Database Connection** - Resolve local PostgreSQL connection issues
2. **Migration Execution** - Run initial migration to create schema
3. **Seed Data** - Populate development database
4. **API Integration** - Connect tRPC routers to Prisma models
5. **Testing** - Implement unit tests for database operations

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Docker services are running: `npm run docker:dev`
   - Check database credentials in `.env`
   - Verify PostgreSQL container health

2. **Migration Failures**
   - Check database permissions
   - Ensure database exists and is accessible
   - Review schema for syntax errors

3. **Seed Script Errors**
   - Ensure database schema is migrated
   - Check for unique constraint violations
   - Verify foreign key relationships

### Database Management

```bash
# Check Docker services
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect directly to database
docker exec -it tcwatch-postgres psql -U postgres -d tcwatch

# Reset everything
npm run docker:dev:clean && npm run docker:dev
```

## Architecture Alignment

This Prisma setup fully implements the database schema defined in the TCWatch architecture documentation, including:

- All required tables and relationships
- Proper data types and constraints
- Performance optimization through strategic indexing
- Security considerations for user data
- Extensibility for future features
- Integration with Supabase for production deployment

The schema supports the complete feature set planned for TCWatch, from basic content tracking to advanced social and community features.