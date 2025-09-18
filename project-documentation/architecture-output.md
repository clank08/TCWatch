# TCWatch Technical Architecture Blueprint

## Executive Summary

TCWatch is a cross-platform True Crime content tracking application with mobile (Expo React Native) and web (Remix) frontends, backed by a containerized Node.js/Fastify microservices architecture. The system leverages Supabase for authentication, database, and realtime features, with Docker containerization for all services and external API integrations managed through Temporal workflows.

### Key Architectural Decisions

1. **Supabase-Centric Backend**: Integrated auth, PostgreSQL database, realtime subscriptions, and row-level security
2. **Docker Container Architecture**: All services containerized for consistent deployment and scaling
3. **tRPC for API Layer**: End-to-end type safety eliminating API contract bugs
4. **Temporal for Workflows**: Reliable external API synchronization with built-in retry logic
5. **Meilisearch for Search**: Purpose-built search engine for <100ms response times
6. **Redis for Caching**: Multi-layer caching strategy for performance optimization

### Performance Targets
- App launch: <2 seconds
- Search response: <100ms (Meilisearch)
- API response: <500ms p99
- Deep-link success: 95%+
- Workflow completion: 99.9% success rate

---

## 1. System Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐              ┌─────────────────┐             │
│  │   Mobile App    │              │    Web App      │             │
│  │ (Expo RN + TS)  │              │  (Remix + TS)   │             │
│  │  - NativeWind   │              │  - Tailwind CSS │             │
│  │  - Expo Router  │              │  - SSR/SSG      │             │
│  │  - TanStack Q   │              │  - TanStack Q   │             │
│  │  - tRPC Client  │              │  - tRPC Client  │             │
│  └─────────────────┘              └─────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Load Balancer / Reverse Proxy                 │ │
│  │                    (nginx/traefik)                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Core Services (Docker)                        │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐ │
│ │  tRPC API    │ │   Content    │ │   Social     │ │   Auth    │ │
│ │   Server     │ │   Service    │ │   Service    │ │  Service  │ │
│ │ (Fastify/TS) │ │ (Fastify/TS) │ │ (Fastify/TS) │ │(Fastify)  │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘ │
│                                                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │ Notification │ │   Search     │ │   Workflow   │              │
│ │   Service    │ │   Service    │ │   Service    │              │
│ │ (Fastify/TS) │ │(Meilisearch) │ │ (Temporal)   │              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data & Cache Layer                            │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │   Supabase   │ │    Redis     │ │ Meilisearch  │              │
│ │  PostgreSQL  │ │    Cache     │ │    Index     │              │
│ │   + Auth +   │ │   (Docker)   │ │  (Docker)    │              │
│ │   Realtime   │ │              │ │              │              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Integrations                          │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│ │  Watchmode   │ │    TMDb      │ │   TheTVDB    │              │
│ │     API      │ │     API      │ │     API      │              │
│ └──────────────┘ └──────────────┘ └──────────────┘              │
│                                                                   │
│ ┌──────────────┐ ┌──────────────┐                               │
│ │   TVMaze     │ │  Wikidata    │                               │
│ │     API      │ │     API      │                               │
│ └──────────────┘ └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Container Architecture

```yaml
# docker-compose.yml structure
services:
  # API Services
  api-gateway:       # nginx/traefik reverse proxy
  trpc-server:       # Main tRPC API server
  content-service:   # Content management and tracking
  social-service:    # Social features and sharing
  auth-service:      # Authentication middleware
  notification-service: # Push notifications and alerts
  workflow-service:  # Temporal workflow worker

  # Data Services
  redis:            # Caching and session storage
  meilisearch:      # Search engine
  postgres-local:   # Local development database (production uses Supabase)

  # External Integration Workers
  watchmode-worker: # Watchmode API integration
  tmdb-worker:      # TMDb API integration
  tvdb-worker:      # TheTVDB API integration

  # Monitoring & Utilities
  sentry-relay:     # Error tracking relay
  prometheus:       # Metrics collection
  grafana:          # Monitoring dashboard
```

### Security Boundaries

1. **External Perimeter**: TLS 1.3 encryption, API rate limiting, DDoS protection
2. **API Gateway**: JWT validation, request sanitization, CORS policies
3. **Service Mesh**: Inter-service authentication, encrypted communication
4. **Database**: Supabase Row-Level Security (RLS), encrypted at rest
5. **Application**: Input validation, XSS protection, CSRF tokens

### Data Flow Architecture

```
User Request → Load Balancer → tRPC Server → Service Layer → Supabase/Redis/Meilisearch
     ↑                                                              ↓
Authentication ← Supabase Auth ← JWT Validation ← Service Response ←
```

---

## 2. Component Design

### Frontend Architecture

#### Mobile Application (Expo React Native)

**Component Structure:**
```typescript
src/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication flow
│   ├── (tabs)/            # Main tab navigation
│   ├── search/            # Search functionality
│   └── profile/           # User profile
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── content/          # Content-specific components
│   └── social/           # Social feature components
├── hooks/                # Custom React hooks
├── services/             # API and external services
├── store/                # Zustand state management
├── types/                # TypeScript definitions
└── utils/                # Utility functions
```

**State Management Architecture:**
```typescript
// Zustand store structure
interface AppState {
  user: UserState;
  content: ContentState;
  social: SocialState;
  preferences: PreferencesState;
}

// TanStack Query for server state
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

#### Web Application (Remix)

**Route Structure:**
```typescript
app/
├── routes/
│   ├── _layout.tsx        # Main layout with navigation
│   ├── _auth.tsx          # Authentication layout
│   ├── index.tsx          # Dashboard
│   ├── search.tsx         # Search page
│   ├── content/           # Content pages
│   ├── social/            # Social features
│   └── settings/          # User settings
├── components/            # Shared React components
├── services/              # Server-side services
├── utils/                 # Utility functions
└── types/                 # Shared TypeScript types
```

### Backend Services Architecture

#### tRPC API Server

**Container Specification:**
```dockerfile
# Dockerfile.trpc-server
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY . .
RUN npm run build

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**Service Architecture:**
```typescript
// tRPC Router Structure
export const appRouter = router({
  auth: authRouter,        // Authentication & user management
  content: contentRouter,  // Content tracking & discovery
  social: socialRouter,    // Social features & sharing
  search: searchRouter,    // Search functionality
  notifications: notificationRouter, // Push notifications
  admin: adminRouter,      // Administrative functions
});

// Middleware stack
const middleware = {
  cors: cors({ origin: process.env.ALLOWED_ORIGINS }),
  auth: authMiddleware,    // JWT validation
  rateLimit: rateLimitMiddleware,
  validation: validationMiddleware,
  logging: loggingMiddleware,
};
```

#### Microservice Breakdown

**1. Content Service**
- Content discovery and aggregation
- Tracking state management
- Rating and review system
- Personal notes and tagging
- Episode-level progress tracking

**2. Social Service**
- Custom list creation and management
- Friend connections and activity feeds
- Privacy controls and permissions
- Community challenges and gamification
- List sharing and collaboration

**3. Authentication Service**
- Supabase Auth integration
- JWT token management
- Session handling
- User profile management
- Social authentication flows

**4. Notification Service**
- Push notification delivery
- Email notifications
- Alert preference management
- Weekly digest generation
- Real-time notification websockets

**5. Workflow Service**
- External API synchronization
- Content availability monitoring
- Data processing workflows
- Error handling and retry logic
- Background job management

---

## 3. API Contracts (tRPC)

### Authentication Router

```typescript
export const authRouter = router({
  // User registration
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      interests: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Supabase Auth integration
      const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
      });

      if (error) throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error.message,
      });

      return { user: data.user, needsVerification: true };
    }),

  // User login
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      });

      if (error) throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials',
      });

      return { user: data.user, session: data.session };
    }),

  // Get current user
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.user;
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      displayName: z.string().optional(),
      interests: z.array(z.string()).optional(),
      privacy: z.object({
        profilePublic: z.boolean(),
        activityVisible: z.boolean(),
        allowFriendRequests: z.boolean(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(input)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      });

      return { success: true };
    }),
});
```

### Content Router

```typescript
export const contentRouter = router({
  // Search content across platforms
  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      platforms: z.array(z.string()).optional(),
      contentTypes: z.array(z.enum(['movie', 'tv', 'documentary'])).optional(),
      cases: z.array(z.string()).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      // Meilisearch integration
      const searchResults = await meilisearchClient.index('content').search(input.query, {
        filter: buildSearchFilters(input),
        limit: input.limit,
        offset: input.offset,
        attributesToHighlight: ['title', 'description'],
      });

      return {
        results: searchResults.hits,
        totalHits: searchResults.estimatedTotalHits,
        processingTimeMs: searchResults.processingTimeMs,
      };
    }),

  // Add content to user's tracking
  addToList: protectedProcedure
    .input(z.object({
      contentId: z.string(),
      status: z.enum(['want_to_watch', 'watching', 'completed', 'abandoned']),
      platform: z.string().optional(),
      rating: z.number().min(1).max(5).optional(),
      notes: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabase
        .from('user_content')
        .upsert({
          user_id: ctx.user.id,
          content_id: input.contentId,
          status: input.status,
          platform: input.platform,
          rating: input.rating,
          notes: input.notes,
          tags: input.tags,
          updated_at: new Date().toISOString(),
        });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add content to list',
      });

      // Trigger social activity update if user has opted in
      if (ctx.user.privacy_settings?.activity_visible) {
        await publishActivityEvent({
          userId: ctx.user.id,
          type: 'content_added',
          contentId: input.contentId,
          status: input.status,
        });
      }

      return { success: true };
    }),

  // Get user's content lists
  getMyContent: protectedProcedure
    .input(z.object({
      status: z.enum(['want_to_watch', 'watching', 'completed', 'abandoned']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const query = supabase
        .from('user_content')
        .select(`
          *,
          content:content_id (
            title,
            description,
            poster_url,
            content_type,
            release_date,
            platforms,
            cases
          )
        `)
        .eq('user_id', ctx.user.id)
        .order('updated_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status) {
        query.eq('status', input.status);
      }

      const { data, error } = await query;

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch content',
      });

      return { content: data || [] };
    }),

  // Update episode progress
  updateProgress: protectedProcedure
    .input(z.object({
      contentId: z.string(),
      seasonNumber: z.number(),
      episodeNumber: z.number(),
      watched: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabase
        .from('episode_progress')
        .upsert({
          user_id: ctx.user.id,
          content_id: input.contentId,
          season_number: input.seasonNumber,
          episode_number: input.episodeNumber,
          watched: input.watched,
          watched_at: input.watched ? new Date().toISOString() : null,
        });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update progress',
      });

      return { success: true };
    }),

  // Get content recommendations
  getRecommendations: protectedProcedure
    .input(z.object({
      type: z.enum(['trending', 'for_you', 'similar', 'case_based']).default('for_you'),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Redis cache check first
      const cacheKey = `recommendations:${ctx.user.id}:${input.type}:${input.limit}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Generate recommendations based on user's content and preferences
      const recommendations = await generateRecommendations(ctx.user.id, input.type, input.limit);

      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(recommendations));

      return recommendations;
    }),
});
```

### Social Router

```typescript
export const socialRouter = router({
  // Create custom list
  createList: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      privacy: z.enum(['private', 'friends', 'public']).default('private'),
      contentIds: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: list, error: listError } = await supabase
        .from('custom_lists')
        .insert({
          user_id: ctx.user.id,
          title: input.title,
          description: input.description,
          privacy: input.privacy,
        })
        .select()
        .single();

      if (listError) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create list',
      });

      // Add content to list
      if (input.contentIds.length > 0) {
        const listItems = input.contentIds.map((contentId, index) => ({
          list_id: list.id,
          content_id: contentId,
          order_index: index,
        }));

        const { error: itemsError } = await supabase
          .from('list_items')
          .insert(listItems);

        if (itemsError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add items to list',
        });
      }

      return { list };
    }),

  // Get user's lists
  getMyLists: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await supabase
        .from('custom_lists')
        .select(`
          *,
          list_items!inner (
            content:content_id (
              title,
              poster_url
            )
          )
        `)
        .eq('user_id', ctx.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch lists',
      });

      return { lists: data || [] };
    }),

  // Get friend activity feed
  getFriendActivity: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Only show activity if user has opted into social features
      if (!ctx.user.privacy_settings?.activity_visible) {
        return { activities: [] };
      }

      const { data, error } = await supabase
        .from('friend_activities')
        .select(`
          *,
          user:user_id (
            display_name,
            avatar_url
          ),
          content:content_id (
            title,
            poster_url
          )
        `)
        .in('user_id', ctx.user.friend_ids || [])
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch friend activity',
      });

      return { activities: data || [] };
    }),

  // Share list
  shareList: protectedProcedure
    .input(z.object({
      listId: z.string(),
      privacy: z.enum(['friends', 'public']),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await supabase
        .from('custom_lists')
        .update({ privacy: input.privacy })
        .eq('id', input.listId)
        .eq('user_id', ctx.user.id);

      if (error) throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Not authorized to update this list',
      });

      // Generate shareable URL
      const shareUrl = `${process.env.APP_URL}/lists/${input.listId}`;

      return { shareUrl };
    }),
});
```

### Authentication Middleware

```typescript
export const authMiddleware = async (req: FastifyRequest, reply: FastifyReply) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No authentication token provided',
    });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token',
      });
    }

    // Fetch user profile and preferences
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    req.user = { ...user, ...profile };
  } catch (error) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication failed',
    });
  }
};
```

---

## 4. Data Models & Database Schema

### Supabase PostgreSQL Schema

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    interests TEXT[], -- JSON array of True Crime categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Privacy settings
    privacy_settings JSONB DEFAULT '{
        "profile_public": false,
        "activity_visible": false,
        "allow_friend_requests": true
    }',

    -- Platform connections
    connected_platforms TEXT[], -- Array of platform IDs

    -- Preferences
    notification_preferences JSONB DEFAULT '{
        "new_content_alerts": true,
        "friend_activity": true,
        "weekly_digest": true,
        "cable_reminders": true
    }',

    UNIQUE(user_id)
);

-- Content metadata (aggregated from external APIs)
CREATE TABLE content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id VARCHAR(100) NOT NULL, -- TMDb/TheTVDB ID
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_type VARCHAR(20) CHECK (content_type IN ('movie', 'tv_series', 'documentary', 'podcast')),
    genre_tags TEXT[], -- Array of genre tags
    case_tags TEXT[], -- Array of criminal case identifiers
    release_date DATE,
    runtime_minutes INTEGER,
    poster_url TEXT,
    backdrop_url TEXT,

    -- Platform availability (cached from Watchmode API)
    platforms JSONB, -- Platform availability with deep links

    -- TV series specific
    total_seasons INTEGER,
    total_episodes INTEGER,
    status VARCHAR(20), -- ongoing, completed, cancelled

    -- Aggregated ratings
    tmdb_rating DECIMAL(3,1),
    imdb_rating DECIMAL(3,1),
    user_rating_avg DECIMAL(3,1),
    user_rating_count INTEGER DEFAULT 0,

    -- Search optimization
    search_vector tsvector,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for content search
CREATE INDEX idx_content_search_vector ON content USING GIN(search_vector);
CREATE INDEX idx_content_type ON content(content_type);
CREATE INDEX idx_content_case_tags ON content USING GIN(case_tags);
CREATE INDEX idx_content_release_date ON content(release_date DESC);

-- User content tracking
CREATE TABLE user_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('want_to_watch', 'watching', 'completed', 'abandoned')),

    -- User ratings and notes
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    tags TEXT[], -- Personal tags

    -- Tracking metadata
    platform VARCHAR(50), -- Platform where user is watching
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_started TIMESTAMP WITH TIME ZONE,
    date_completed TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent duplicate tracking
    UNIQUE(user_id, content_id)
);

-- Episode progress tracking for TV series
CREATE TABLE episode_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched BOOLEAN DEFAULT FALSE,
    watched_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, content_id, season_number, episode_number)
);

-- Custom user lists
CREATE TABLE custom_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    privacy VARCHAR(20) CHECK (privacy IN ('private', 'friends', 'public')) DEFAULT 'private',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- List items (many-to-many between lists and content)
CREATE TABLE list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    list_id UUID REFERENCES custom_lists(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    notes TEXT, -- Item-specific notes

    UNIQUE(list_id, content_id),
    UNIQUE(list_id, order_index)
);

-- Friend relationships
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    addressee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(requester_id, addressee_id),
    CHECK (requester_id != addressee_id)
);

-- Social activity feed
CREATE TABLE social_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    list_id UUID REFERENCES custom_lists(id) ON DELETE SET NULL,
    activity_data JSONB, -- Additional activity context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- new_content, friend_activity, system
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- External API synchronization tracking
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_type VARCHAR(50) NOT NULL,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP WITH TIME ZONE
);

-- Content cases (criminal cases metadata)
CREATE TABLE content_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_name VARCHAR(255) NOT NULL UNIQUE,
    case_slug VARCHAR(255) NOT NULL UNIQUE, -- URL-friendly identifier
    description TEXT,
    perpetrators TEXT[], -- Names of perpetrators
    victims TEXT[], -- Names of victims
    locations TEXT[], -- Geographic locations
    time_period VARCHAR(50), -- e.g., "1970s-1980s"
    case_status VARCHAR(20) CHECK (case_status IN ('solved', 'unsolved', 'cold')),
    wikipedia_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-many relationship between content and cases
CREATE TABLE content_case_links (
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    case_id UUID REFERENCES content_cases(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, case_id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User content: Users can only access their own content
CREATE POLICY "Users can manage own content" ON user_content
    FOR ALL USING (auth.uid() = user_id);

-- Episode progress: Users can only access their own progress
CREATE POLICY "Users can manage own progress" ON episode_progress
    FOR ALL USING (auth.uid() = user_id);

-- Custom lists: Users can manage own lists + view shared lists
CREATE POLICY "Users can manage own lists" ON custom_lists
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared lists" ON custom_lists
    FOR SELECT USING (
        privacy = 'public' OR
        (privacy = 'friends' AND auth.uid() IN (
            SELECT CASE
                WHEN requester_id = user_id THEN addressee_id
                ELSE requester_id
            END
            FROM friendships
            WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
            AND status = 'accepted'
        ))
    );

-- List items: Based on list permissions
CREATE POLICY "Users can manage own list items" ON list_items
    FOR ALL USING (
        list_id IN (
            SELECT id FROM custom_lists WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view shared list items" ON list_items
    FOR SELECT USING (
        list_id IN (
            SELECT id FROM custom_lists
            WHERE privacy = 'public' OR
            (privacy = 'friends' AND auth.uid() IN (
                SELECT CASE
                    WHEN requester_id = user_id THEN addressee_id
                    ELSE requester_id
                END
                FROM friendships
                WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
                AND status = 'accepted'
            ))
        )
    );

-- Friendships: Users can manage their own friend relationships
CREATE POLICY "Users can manage own friendships" ON friendships
    FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Social activities: Users can view activities from friends
CREATE POLICY "Users can view friend activities" ON social_activities
    FOR SELECT USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT CASE
                WHEN requester_id = auth.uid() THEN addressee_id
                ELSE requester_id
            END
            FROM friendships
            WHERE (requester_id = auth.uid() OR addressee_id = auth.uid())
            AND status = 'accepted'
        )
    );

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Content and cases: Read-only for all authenticated users
CREATE POLICY "Authenticated users can read content" ON content
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read cases" ON content_cases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read case links" ON content_case_links
    FOR SELECT USING (auth.role() = 'authenticated');
```

### Database Triggers and Functions

```sql
-- Update search vector when content is modified
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.title, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.case_tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_search_vector_trigger
    BEFORE INSERT OR UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_content_search_vector();

-- Update user_content updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_content_updated_at
    BEFORE UPDATE ON user_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's friend IDs for activity feed
CREATE OR REPLACE FUNCTION get_user_friend_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT CASE
            WHEN requester_id = user_uuid THEN addressee_id
            ELSE requester_id
        END
        FROM friendships
        WHERE (requester_id = user_uuid OR addressee_id = user_uuid)
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Indexing Strategy

```sql
-- Performance indexes for common queries
CREATE INDEX idx_user_content_user_status ON user_content(user_id, status);
CREATE INDEX idx_user_content_updated_at ON user_content(updated_at DESC);
CREATE INDEX idx_episode_progress_user_content ON episode_progress(user_id, content_id);
CREATE INDEX idx_custom_lists_user_privacy ON custom_lists(user_id, privacy);
CREATE INDEX idx_social_activities_user_created ON social_activities(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read, sent_at DESC);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_sync_jobs_status_type ON sync_jobs(status, job_type);

-- Composite indexes for complex queries
CREATE INDEX idx_content_type_case_tags ON content(content_type, case_tags);
CREATE INDEX idx_content_platforms_release ON content USING GIN(platforms);
```

---

## 5. Docker Architecture

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API Gateway / Load Balancer
  nginx:
    image: nginx:alpine
    container_name: tcwatch-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - trpc-server
      - content-service
      - social-service
    networks:
      - tcwatch-network

  # Main tRPC API Server
  trpc-server:
    build:
      context: ./services/trpc-server
      dockerfile: Dockerfile
    container_name: tcwatch-trpc
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_URL=http://meilisearch:7700
      - MEILISEARCH_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
      - meilisearch
    networks:
      - tcwatch-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Content Management Service
  content-service:
    build:
      context: ./services/content-service
      dockerfile: Dockerfile
    container_name: tcwatch-content
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_URL=http://meilisearch:7700
      - WATCHMODE_API_KEY=${WATCHMODE_API_KEY}
      - TMDB_API_KEY=${TMDB_API_KEY}
      - TVDB_API_KEY=${TVDB_API_KEY}
    depends_on:
      - redis
      - meilisearch
    networks:
      - tcwatch-network

  # Social Features Service
  social-service:
    build:
      context: ./services/social-service
      dockerfile: Dockerfile
    container_name: tcwatch-social
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    depends_on:
      - redis
    networks:
      - tcwatch-network

  # Notification Service
  notification-service:
    build:
      context: ./services/notification-service
      dockerfile: Dockerfile
    container_name: tcwatch-notifications
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - EXPO_ACCESS_TOKEN=${EXPO_ACCESS_TOKEN}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - WEB_PUSH_VAPID_PUBLIC_KEY=${WEB_PUSH_VAPID_PUBLIC_KEY}
      - WEB_PUSH_VAPID_PRIVATE_KEY=${WEB_PUSH_VAPID_PRIVATE_KEY}
    depends_on:
      - redis
    networks:
      - tcwatch-network

  # Temporal Workflow Service
  temporal-worker:
    build:
      context: ./services/temporal-worker
      dockerfile: Dockerfile
    container_name: tcwatch-temporal
    environment:
      - NODE_ENV=production
      - TEMPORAL_SERVER_URL=${TEMPORAL_CLOUD_URL}
      - TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE}
      - TEMPORAL_TLS_CERT_PATH=/etc/temporal/client.pem
      - TEMPORAL_TLS_KEY_PATH=/etc/temporal/client.key
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - WATCHMODE_API_KEY=${WATCHMODE_API_KEY}
      - TMDB_API_KEY=${TMDB_API_KEY}
    volumes:
      - ./temporal/certs:/etc/temporal
    networks:
      - tcwatch-network

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: tcwatch-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    networks:
      - tcwatch-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Meilisearch Search Engine
  meilisearch:
    image: getmeili/meilisearch:v1.5
    container_name: tcwatch-meilisearch
    environment:
      - MEILI_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
      - MEILI_ENV=production
    volumes:
      - meilisearch-data:/meili_data
    networks:
      - tcwatch-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:7700/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # External API Workers
  watchmode-worker:
    build:
      context: ./workers/watchmode-worker
      dockerfile: Dockerfile
    container_name: tcwatch-watchmode-worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - WATCHMODE_API_KEY=${WATCHMODE_API_KEY}
      - MEILISEARCH_URL=http://meilisearch:7700
    depends_on:
      - redis
      - meilisearch
    networks:
      - tcwatch-network

  tmdb-worker:
    build:
      context: ./workers/tmdb-worker
      dockerfile: Dockerfile
    container_name: tcwatch-tmdb-worker
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - TMDB_API_KEY=${TMDB_API_KEY}
      - MEILISEARCH_URL=http://meilisearch:7700
    depends_on:
      - redis
      - meilisearch
    networks:
      - tcwatch-network

  # Monitoring Services
  prometheus:
    image: prom/prometheus:latest
    container_name: tcwatch-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - tcwatch-network

  grafana:
    image: grafana/grafana:latest
    container_name: tcwatch-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - tcwatch-network

volumes:
  redis-data:
  meilisearch-data:
  prometheus-data:
  grafana-data:

networks:
  tcwatch-network:
    driver: bridge
```

### Individual Dockerfile Specifications

#### tRPC Server Dockerfile

```dockerfile
# services/trpc-server/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/server.js"]
```

#### Content Service Dockerfile

```dockerfile
# services/content-service/Dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 contentservice

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER contentservice

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "dist/server.js"]
```

### Container Networking Strategy

```yaml
# Container network configuration
networks:
  tcwatch-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
          gateway: 172.20.0.1

# Service discovery configuration
services:
  trpc-server:
    networks:
      tcwatch-network:
        aliases:
          - api.tcwatch.internal

  redis:
    networks:
      tcwatch-network:
        aliases:
          - cache.tcwatch.internal

  meilisearch:
    networks:
      tcwatch-network:
        aliases:
          - search.tcwatch.internal
```

### Volume Management

```yaml
# Data persistence strategy
volumes:
  # Redis persistent data
  redis-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/redis

  # Meilisearch data
  meilisearch-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data/meilisearch

  # Application logs
  app-logs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./logs

  # SSL certificates
  ssl-certs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./certs
```

---

## 6. Integration Architecture

### External API Integration Patterns

#### Watchmode API Integration

```typescript
// services/content-service/src/integrations/watchmode.ts
import { Client } from '@temporal/client';
import { Redis } from 'ioredis';

export class WatchmodeIntegration {
  private redis: Redis;
  private temporalClient: Client;
  private apiKey: string;
  private baseUrl = 'https://api.watchmode.com/v1';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.temporalClient = new Client();
    this.apiKey = process.env.WATCHMODE_API_KEY!;
  }

  async syncPlatformAvailability(contentId: string): Promise<void> {
    // Start Temporal workflow for reliable sync
    await this.temporalClient.workflow.start(SyncContentAvailabilityWorkflow, {
      args: [{ contentId, source: 'watchmode' }],
      taskQueue: 'content-sync',
      workflowId: `watchmode-sync-${contentId}`,
      retry: {
        maximumAttempts: 5,
        backoffCoefficient: 2,
        initialInterval: '1s',
        maximumInterval: '60s',
      },
    });
  }

  async fetchContentDetails(tmdbId: string): Promise<WatchmodeContent> {
    const cacheKey = `watchmode:content:${tmdbId}`;

    // Check cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/title/${tmdbId}/details/?apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new ApiError(`Watchmode API error: ${response.status}`, response.status);
      }

      const data = await response.json();

      // Cache for 24 hours
      await this.redis.setex(cacheKey, 86400, JSON.stringify(data));

      return data;
    } catch (error) {
      // Log error for monitoring
      console.error('Watchmode API fetch error:', error);
      throw error;
    }
  }

  async batchFetchPlatformAvailability(tmdbIds: string[]): Promise<PlatformAvailability[]> {
    const batchSize = 10; // Respect rate limits
    const results: PlatformAvailability[] = [];

    for (let i = 0; i < tmdbIds.length; i += batchSize) {
      const batch = tmdbIds.slice(i, i + batchSize);
      const batchPromises = batch.map(id => this.fetchPlatformAvailability(id));

      try {
        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Failed to fetch availability for ${batch[index]}:`, result.reason);
          }
        });

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Batch fetch error:', error);
      }
    }

    return results;
  }

  private async fetchPlatformAvailability(tmdbId: string): Promise<PlatformAvailability> {
    const response = await fetch(
      `${this.baseUrl}/title/${tmdbId}/sources/?apiKey=${this.apiKey}`
    );

    if (!response.ok) {
      throw new ApiError(`Watchmode sources API error: ${response.status}`, response.status);
    }

    return response.json();
  }
}
```

#### TMDb API Integration

```typescript
// services/content-service/src/integrations/tmdb.ts
export class TMDbIntegration {
  private apiKey: string;
  private baseUrl = 'https://api.themoviedb.org/3';
  private redis: Redis;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async searchTrueCrimeContent(query: string, page = 1): Promise<TMDbSearchResult> {
    const params = new URLSearchParams({
      api_key: this.apiKey,
      query: query,
      page: page.toString(),
      with_genres: '99', // Documentary genre
      with_keywords: '12718|213005|161176', // True crime related keywords
    });

    const response = await fetch(`${this.baseUrl}/search/multi?${params}`);

    if (!response.ok) {
      throw new ApiError(`TMDb API error: ${response.status}`, response.status);
    }

    const data = await response.json();

    // Filter results to focus on true crime content
    const trueCrimeResults = data.results.filter((item: any) =>
      this.isTrueCrimeContent(item)
    );

    return {
      ...data,
      results: trueCrimeResults
    };
  }

  async getContentDetails(tmdbId: string, mediaType: 'movie' | 'tv'): Promise<TMDbContentDetails> {
    const cacheKey = `tmdb:${mediaType}:${tmdbId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch(
      `${this.baseUrl}/${mediaType}/${tmdbId}?api_key=${this.apiKey}&append_to_response=keywords,credits,external_ids`
    );

    if (!response.ok) {
      throw new ApiError(`TMDb details API error: ${response.status}`, response.status);
    }

    const data = await response.json();

    // Cache for 7 days (content details don't change often)
    await this.redis.setex(cacheKey, 604800, JSON.stringify(data));

    return data;
  }

  private isTrueCrimeContent(item: any): boolean {
    // Keywords that indicate true crime content
    const trueCrimeKeywords = [
      'serial killer', 'murder', 'crime', 'investigation', 'detective',
      'police', 'criminal', 'forensic', 'cold case', 'disappearance',
      'kidnapping', 'homicide', 'mystery', 'unsolved', 'documentary'
    ];

    const text = `${item.title || item.name} ${item.overview}`.toLowerCase();

    return trueCrimeKeywords.some(keyword => text.includes(keyword)) ||
           (item.genre_ids && item.genre_ids.includes(99)); // Documentary genre
  }

  async getSeasonDetails(tvId: string, seasonNumber: number): Promise<TMDbSeasonDetails> {
    const cacheKey = `tmdb:season:${tvId}:${seasonNumber}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await fetch(
      `${this.baseUrl}/tv/${tvId}/season/${seasonNumber}?api_key=${this.apiKey}`
    );

    if (!response.ok) {
      throw new ApiError(`TMDb season API error: ${response.status}`, response.status);
    }

    const data = await response.json();

    // Cache season details for 30 days
    await this.redis.setex(cacheKey, 2592000, JSON.stringify(data));

    return data;
  }
}
```

### Temporal Workflow Implementation

```typescript
// services/temporal-worker/src/workflows/content-sync.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from '../activities';

const {
  fetchWatchmodeData,
  fetchTMDbData,
  updateContentDatabase,
  updateSearchIndex,
  notifyContentUpdate
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5m',
  retry: {
    maximumAttempts: 5,
    backoffCoefficient: 2,
    initialInterval: '1s',
    maximumInterval: '60s',
  },
});

export async function SyncContentAvailabilityWorkflow(
  params: { contentId: string; source: string }
): Promise<void> {
  const { contentId, source } = params;

  try {
    // Step 1: Fetch updated data from external APIs
    const [watchmodeData, tmdbData] = await Promise.all([
      fetchWatchmodeData(contentId),
      fetchTMDbData(contentId),
    ]);

    // Step 2: Update database with new information
    const updatedContent = await updateContentDatabase(contentId, {
      platforms: watchmodeData.sources,
      metadata: tmdbData,
      lastSynced: new Date().toISOString(),
    });

    // Step 3: Update search index
    await updateSearchIndex(updatedContent);

    // Step 4: Notify users following this content
    if (watchmodeData.sources.length > 0) {
      await notifyContentUpdate(contentId, 'availability_changed');
    }

  } catch (error) {
    console.error(`Content sync workflow failed for ${contentId}:`, error);
    throw error;
  }
}

export async function DailyContentSyncWorkflow(): Promise<void> {
  const pageSize = 100;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // Fetch batch of content that needs sync
    const contentBatch = await getContentForSync({ limit: pageSize, offset });

    if (contentBatch.length === 0) {
      hasMore = false;
      break;
    }

    // Process batch with concurrency control
    const batchPromises = contentBatch.map(content =>
      SyncContentAvailabilityWorkflow({
        contentId: content.id,
        source: 'scheduled'
      })
    );

    // Wait for batch to complete before moving to next
    await Promise.allSettled(batchPromises);

    // Rate limiting between batches
    await sleep('5s');

    offset += pageSize;
  }
}
```

### Error Handling and Circuit Breaker Pattern

```typescript
// services/content-service/src/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private nextAttempt = Date.now();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold = 5,
    private readonly timeout = 60000,
    private readonly resetTimeout = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState(): string {
    return this.state;
  }
}

// Usage in API integrations
export class ResilientWatchmodeClient {
  private circuitBreaker = new CircuitBreaker(5, 60000, 30000);

  async fetchWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.execute(operation);
  }

  async getContentAvailability(contentId: string): Promise<PlatformAvailability> {
    return this.fetchWithCircuitBreaker(async () => {
      const response = await fetch(
        `https://api.watchmode.com/v1/title/${contentId}/sources/?apiKey=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Watchmode API error: ${response.status}`);
      }

      return response.json();
    });
  }
}
```

---

## 7. Supabase Integration

### Authentication Flows

```typescript
// services/auth-service/src/supabase-auth.ts
import { createClient } from '@supabase/supabase-js';

export class SupabaseAuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async registerUser(email: string, password: string, metadata?: any): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        throw new AuthError(error.message, error.status || 400);
      }

      // Create user profile
      if (data.user) {
        await this.createUserProfile(data.user.id, {
          display_name: metadata?.display_name,
          interests: metadata?.interests || [],
        });
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async authenticateWithSocial(provider: 'google' | 'facebook' | 'apple'): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.APP_URL}/auth/callback`,
        scopes: 'email profile',
      },
    });

    if (error) {
      throw new AuthError(error.message, error.status || 400);
    }

    return data;
  }

  async refreshSession(refreshToken: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new AuthError('Session refresh failed', 401);
    }

    return { user: data.user, session: data.session };
  }

  async validateJWT(token: string): Promise<User> {
    const { data: { user }, error } = await this.supabase.auth.getUser(token);

    if (error || !user) {
      throw new AuthError('Invalid token', 401);
    }

    // Get full user profile
    const { data: profile } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { ...user, ...profile };
  }

  private async createUserProfile(userId: string, profileData: any): Promise<void> {
    const { error } = await this.supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        ...profileData,
      });

    if (error) {
      console.error('Profile creation error:', error);
      throw new Error('Failed to create user profile');
    }
  }
}
```

### Realtime Subscriptions

```typescript
// services/social-service/src/realtime-manager.ts
export class RealtimeManager {
  private supabase: SupabaseClient;
  private subscriptions = new Map<string, RealtimeSubscription>();

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  async subscribeToFriendActivity(userId: string, callback: (payload: any) => void): Promise<string> {
    const subscriptionId = `friend-activity-${userId}`;

    // Get user's friend IDs first
    const { data: friendships } = await this.supabase
      .from('friendships')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = friendships?.map(f =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    ) || [];

    if (friendIds.length === 0) {
      return subscriptionId;
    }

    const subscription = this.supabase
      .channel(`friend_activity_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_activities',
          filter: `user_id=in.(${friendIds.join(',')})`,
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  async subscribeToNotifications(userId: string, callback: (payload: any) => void): Promise<string> {
    const subscriptionId = `notifications-${userId}`;

    const subscription = this.supabase
      .channel(`user_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionId);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, id) => {
      this.supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }
}
```

### Row Level Security Implementation

```sql
-- Advanced RLS policies for complex scenarios

-- Allow users to see public profiles
CREATE POLICY "Public profiles visible" ON user_profiles
    FOR SELECT USING (
        privacy_settings->>'profile_public' = 'true' OR
        user_id = auth.uid()
    );

-- Friend-based content visibility
CREATE POLICY "Friend content access" ON user_content
    FOR SELECT USING (
        user_id = auth.uid() OR
        (
            -- Check if requester is a friend and content owner allows friend visibility
            EXISTS (
                SELECT 1 FROM friendships f
                JOIN user_profiles up ON up.user_id = user_content.user_id
                WHERE (f.requester_id = auth.uid() AND f.addressee_id = user_content.user_id)
                   OR (f.addressee_id = auth.uid() AND f.requester_id = user_content.user_id)
                AND f.status = 'accepted'
                AND up.privacy_settings->>'activity_visible' = 'true'
            )
        )
    );

-- Dynamic list sharing based on privacy settings
CREATE POLICY "Dynamic list sharing" ON custom_lists
    FOR SELECT USING (
        user_id = auth.uid() OR
        privacy = 'public' OR
        (
            privacy = 'friends' AND
            EXISTS (
                SELECT 1 FROM friendships
                WHERE (requester_id = auth.uid() AND addressee_id = user_id)
                   OR (addressee_id = auth.uid() AND requester_id = user_id)
                AND status = 'accepted'
            )
        )
    );
```

### Supabase Edge Functions

```typescript
// supabase/functions/process-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, userId, data } = await req.json();

    switch (type) {
      case 'new_content_alert':
        await processNewContentAlert(supabaseClient, userId, data);
        break;
      case 'friend_activity':
        await processFriendActivity(supabaseClient, userId, data);
        break;
      case 'weekly_digest':
        await processWeeklyDigest(supabaseClient, userId, data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function processNewContentAlert(
  supabase: any,
  userId: string,
  data: { contentId: string; title: string; platforms: string[] }
): Promise<void> {
  // Check user's notification preferences
  const { data: user } = await supabase
    .from('user_profiles')
    .select('notification_preferences')
    .eq('user_id', userId)
    .single();

  if (!user?.notification_preferences?.new_content_alerts) {
    return; // User has disabled these notifications
  }

  // Create notification record
  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'new_content',
    title: 'New True Crime Content Available',
    message: `${data.title} is now available on ${data.platforms.join(', ')}`,
    data: { content_id: data.contentId, platforms: data.platforms },
  });

  // Send push notification (handled by notification service)
  await fetch(`${Deno.env.get('NOTIFICATION_SERVICE_URL')}/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      title: 'New True Crime Content Available',
      body: `${data.title} is now available on ${data.platforms.join(', ')}`,
      data: { contentId: data.contentId },
    }),
  });
}
```

---

## 8. Performance Architecture

### Multi-Layer Caching Strategy

```typescript
// services/cache-manager/src/cache-strategy.ts
export class CacheStrategy {
  private redis: Redis;
  private localCache: NodeCache;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.localCache = new NodeCache({
      stdTTL: 300, // 5 minutes
      checkperiod: 60
    });
  }

  async get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null> {
    // Level 1: Local memory cache (fastest)
    const localResult = this.localCache.get<T>(key);
    if (localResult !== undefined) {
      return localResult;
    }

    // Level 2: Redis cache (fast)
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      this.localCache.set(key, parsed, 300); // Cache locally for 5 minutes
      return parsed;
    }

    // Level 3: Database/API call (slowest)
    if (fallback) {
      const result = await fallback();

      // Store in both caches
      await this.set(key, result, ttl);
      return result;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl = 3600): Promise<void> {
    // Store in local cache (5 minutes max)
    this.localCache.set(key, value, Math.min(ttl, 300));

    // Store in Redis with specified TTL
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear local cache
    this.localCache.flushAll();

    // Clear Redis using pattern
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Content-specific caching methods
  async cacheContentDetails(contentId: string, data: any): Promise<void> {
    await this.set(`content:${contentId}`, data, 24 * 3600); // 24 hours
  }

  async cacheSearchResults(query: string, results: any): Promise<void> {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.set(key, results, 1800); // 30 minutes
  }

  async cacheUserContent(userId: string, data: any): Promise<void> {
    await this.set(`user_content:${userId}`, data, 300); // 5 minutes
  }

  async cachePlatformAvailability(contentId: string, data: any): Promise<void> {
    await this.set(`platforms:${contentId}`, data, 3600); // 1 hour
  }
}
```

### Database Query Optimization

```typescript
// services/content-service/src/repositories/content-repository.ts
export class ContentRepository {
  private supabase: SupabaseClient;
  private cache: CacheStrategy;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.cache = new CacheStrategy();
  }

  async searchContent(params: SearchParams): Promise<SearchResult> {
    const cacheKey = `search:${JSON.stringify(params)}`;

    return this.cache.get(cacheKey, async () => {
      let query = this.supabase
        .from('content')
        .select(`
          id,
          title,
          description,
          content_type,
          poster_url,
          platforms,
          case_tags,
          user_rating_avg,
          user_rating_count
        `);

      // Apply filters with proper indexing
      if (params.query) {
        query = query.textSearch('search_vector', params.query);
      }

      if (params.contentTypes?.length) {
        query = query.in('content_type', params.contentTypes);
      }

      if (params.caseTags?.length) {
        query = query.contains('case_tags', params.caseTags);
      }

      // Optimize pagination
      query = query
        .order('user_rating_avg', { ascending: false, nullsFirst: false })
        .range(params.offset, params.offset + params.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new DatabaseError(error.message);
      }

      return {
        results: data || [],
        totalCount: count || 0,
        offset: params.offset,
        limit: params.limit,
      };
    }, 1800); // Cache for 30 minutes
  }

  async getUserContentOptimized(userId: string, status?: ContentStatus): Promise<UserContent[]> {
    const cacheKey = `user_content:${userId}:${status || 'all'}`;

    return this.cache.get(cacheKey, async () => {
      let query = this.supabase
        .from('user_content')
        .select(`
          *,
          content!inner (
            id,
            title,
            description,
            content_type,
            poster_url,
            platforms,
            total_seasons,
            total_episodes
          )
        `)
        .eq('user_id', userId);

      if (status) {
        query = query.eq('status', status);
      }

      // Use index on (user_id, status, updated_at)
      query = query.order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(error.message);
      }

      return data || [];
    }, 300); // Cache for 5 minutes
  }

  async getContentWithProgress(contentId: string, userId: string): Promise<ContentWithProgress> {
    const cacheKey = `content_progress:${userId}:${contentId}`;

    return this.cache.get(cacheKey, async () => {
      // Single query to get content + user's progress
      const { data, error } = await this.supabase
        .rpc('get_content_with_user_progress', {
          p_content_id: contentId,
          p_user_id: userId
        });

      if (error) {
        throw new DatabaseError(error.message);
      }

      return data;
    }, 600); // Cache for 10 minutes
  }
}
```

### Meilisearch Performance Configuration

```typescript
// services/search-service/src/meilisearch-config.ts
export class MeilisearchManager {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_URL!,
      apiKey: process.env.MEILISEARCH_MASTER_KEY!,
    });
  }

  async setupIndexes(): Promise<void> {
    // Main content index
    const contentIndex = this.client.index('content');

    await contentIndex.updateSettings({
      // Searchable attributes (ordered by importance)
      searchableAttributes: [
        'title',
        'case_tags',
        'description',
        'perpetrators',
        'victims'
      ],

      // Filterable attributes for faceted search
      filterableAttributes: [
        'content_type',
        'case_tags',
        'platforms',
        'release_year',
        'user_rating_avg'
      ],

      // Sortable attributes
      sortableAttributes: [
        'release_date',
        'user_rating_avg',
        'user_rating_count'
      ],

      // Synonyms for better search
      synonyms: {
        'serial killer': ['sk', 'murderer'],
        'cold case': ['unsolved', 'mystery'],
        'investigation': ['detective', 'police'],
        'documentary': ['doc', 'docuseries']
      },

      // Stop words
      stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],

      // Ranking rules for relevance
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'user_rating_avg:desc'
      ],

      // Typo tolerance
      typoTolerance: {
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 5,
          twoTypos: 9
        }
      }
    });

    // Cases index for case-based search
    const casesIndex = this.client.index('cases');

    await casesIndex.updateSettings({
      searchableAttributes: [
        'case_name',
        'perpetrators',
        'victims',
        'locations',
        'description'
      ],

      filterableAttributes: [
        'case_status',
        'time_period',
        'locations'
      ],

      sortableAttributes: [
        'case_name'
      ]
    });
  }

  async search(params: SearchParams): Promise<SearchResults> {
    const index = this.client.index('content');

    const searchParams: SearchRequest = {
      q: params.query,
      limit: params.limit || 20,
      offset: params.offset || 0,

      // Filters
      filter: this.buildFilters(params),

      // Facets for filter options
      facets: ['content_type', 'case_tags', 'platforms'],

      // Highlighting for search results
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',

      // Sort
      sort: params.sortBy ? [params.sortBy] : undefined,
    };

    const results = await index.search(params.query, searchParams);

    return {
      hits: results.hits,
      totalHits: results.estimatedTotalHits,
      processingTimeMs: results.processingTimeMs,
      facetDistribution: results.facetDistribution,
      query: params.query
    };
  }

  private buildFilters(params: SearchParams): string[] {
    const filters: string[] = [];

    if (params.contentTypes?.length) {
      filters.push(`content_type IN [${params.contentTypes.map(t => `"${t}"`).join(', ')}]`);
    }

    if (params.platforms?.length) {
      filters.push(`platforms IN [${params.platforms.map(p => `"${p}"`).join(', ')}]`);
    }

    if (params.caseTags?.length) {
      filters.push(`case_tags IN [${params.caseTags.map(c => `"${c}"`).join(', ')}]`);
    }

    if (params.minRating) {
      filters.push(`user_rating_avg >= ${params.minRating}`);
    }

    return filters;
  }

  async indexContent(content: Content[]): Promise<void> {
    const index = this.client.index('content');

    // Transform content for search index
    const searchDocuments = content.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      content_type: item.content_type,
      case_tags: item.case_tags,
      platforms: Object.keys(item.platforms || {}),
      release_year: item.release_date ? new Date(item.release_date).getFullYear() : null,
      user_rating_avg: item.user_rating_avg,
      user_rating_count: item.user_rating_count,
      perpetrators: item.case_links?.map(c => c.case.perpetrators).flat() || [],
      victims: item.case_links?.map(c => c.case.victims).flat() || [],
    }));

    // Batch index for performance
    const batchSize = 1000;
    for (let i = 0; i < searchDocuments.length; i += batchSize) {
      const batch = searchDocuments.slice(i, i + batchSize);
      await index.addDocuments(batch, { primaryKey: 'id' });
    }
  }
}
```

---

## 9. Deployment Architecture

### Production Docker Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - nginx-cache:/var/cache/nginx
    depends_on:
      - trpc-server
      - content-service
      - social-service
    networks:
      - tcwatch-prod
    restart: unless-stopped

  trpc-server:
    build:
      context: ./services/trpc-server
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_URL=http://meilisearch:7700
      - MEILISEARCH_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    networks:
      - tcwatch-prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  content-service:
    build:
      context: ./services/content-service
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${SUPABASE_DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_URL=http://meilisearch:7700
      - WATCHMODE_API_KEY=${WATCHMODE_API_KEY}
      - TMDB_API_KEY=${TMDB_API_KEY}
      - SENTRY_DSN=${SENTRY_DSN}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    networks:
      - tcwatch-prod
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-prod-data:/data
    networks:
      - tcwatch-prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  meilisearch:
    image: getmeili/meilisearch:v1.5
    environment:
      - MEILI_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
      - MEILI_ENV=production
      - MEILI_DB_PATH=/meili_data
      - MEILI_HTTP_PAYLOAD_SIZE_LIMIT=100MB
    volumes:
      - meilisearch-prod-data:/meili_data
    networks:
      - tcwatch-prod
    restart: unless-stopped

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.prod.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - tcwatch-prod
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    ports:
      - "3001:3000"
    networks:
      - tcwatch-prod
    restart: unless-stopped

volumes:
  redis-prod-data:
  meilisearch-prod-data:
  prometheus-data:
  grafana-data:
  nginx-cache:

networks:
  tcwatch-prod:
    driver: overlay
    attachable: true
```

### CI/CD Pipeline Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run TypeScript check
      run: npm run typecheck

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm run test:ci
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
        REDIS_URL: redis://localhost:6379

    - name: Run E2E tests
      run: npm run test:e2e
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        service: [trpc-server, content-service, social-service, notification-service]

    steps:
    - uses: actions/checkout@v4

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: ./services/${{ matrix.service }}
        file: ./services/${{ matrix.service }}/Dockerfile.prod
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Deploy to staging
      if: github.ref == 'refs/heads/main'
      run: |
        # Deploy to staging environment first
        echo "Deploying to staging..."
        # Add your staging deployment commands here

    - name: Run staging tests
      run: |
        # Run integration tests against staging
        echo "Running staging integration tests..."
        # Add staging test commands here

    - name: Deploy to production
      if: success() && github.ref == 'refs/heads/main'
      run: |
        # Deploy to production after staging tests pass
        echo "Deploying to production..."
        # Add your production deployment commands here
```

### Infrastructure as Code (Terraform)

```hcl
# infrastructure/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "tcwatch-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "tcwatch_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "tcwatch-vpc"
  }
}

# Subnets
resource "aws_subnet" "public_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.tcwatch_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = var.availability_zones[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "tcwatch-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private_subnets" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.tcwatch_vpc.id
  cidr_block        = "10.0.${count.index + 11}.0/24"
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "tcwatch-private-subnet-${count.index + 1}"
  }
}

# ECS Cluster for Docker containers
resource "aws_ecs_cluster" "tcwatch_cluster" {
  name = "tcwatch-prod"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = "production"
  }
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "trpc_server" {
  family                   = "tcwatch-trpc-server"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "trpc-server"
      image = "${var.docker_registry}/tcwatch-trpc-server:latest"

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "3000"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "SUPABASE_SERVICE_ROLE_KEY"
          valueFrom = aws_ssm_parameter.supabase_service_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.tcwatch_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "trpc-server"
        }
      }

      healthCheck = {
        command = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval = 30
        timeout = 5
        retries = 3
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "trpc_server" {
  name            = "tcwatch-trpc-server"
  cluster         = aws_ecs_cluster.tcwatch_cluster.id
  task_definition = aws_ecs_task_definition.trpc_server.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private_subnets[*].id
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.trpc_server.arn
    container_name   = "trpc-server"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.front_end]
}

# Application Load Balancer
resource "aws_lb" "tcwatch_alb" {
  name               = "tcwatch-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public_subnets[*].id

  enable_deletion_protection = true

  tags = {
    Environment = "production"
  }
}

# RDS for Redis Alternative (ElastiCache)
resource "aws_elasticache_subnet_group" "tcwatch_cache_subnet" {
  name       = "tcwatch-cache-subnet"
  subnet_ids = aws_subnet.private_subnets[*].id
}

resource "aws_elasticache_replication_group" "tcwatch_redis" {
  description          = "TCWatch Redis cluster"
  replication_group_id = "tcwatch-redis"
  port                 = 6379
  parameter_group_name = "default.redis7"
  node_type            = "cache.r6g.large"
  num_cache_clusters   = 2

  subnet_group_name = aws_elasticache_subnet_group.tcwatch_cache_subnet.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Environment = "production"
  }
}

# CloudWatch Monitoring
resource "aws_cloudwatch_log_group" "tcwatch_logs" {
  name              = "/ecs/tcwatch"
  retention_in_days = 30

  tags = {
    Environment = "production"
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "trpc_server" {
  max_capacity       = 10
  min_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.tcwatch_cluster.name}/${aws_ecs_service.trpc_server.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "trpc_server_up" {
  name               = "tcwatch-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.trpc_server.resource_id
  scalable_dimension = aws_appautoscaling_target.trpc_server.scalable_dimension
  service_namespace  = aws_appautoscaling_target.trpc_server.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### Environment Management

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "Deploying TCWatch to $ENVIRONMENT environment..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "Error: Environment must be 'staging' or 'production'"
    exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
    staging)
        COMPOSE_FILE="docker-compose.staging.yml"
        DOMAIN="staging.tcwatch.app"
        ;;
    production)
        COMPOSE_FILE="docker-compose.prod.yml"
        DOMAIN="tcwatch.app"
        ;;
esac

# Pull latest images
echo "Pulling Docker images..."
docker-compose -f $COMPOSE_FILE pull

# Run database migrations
echo "Running database migrations..."
docker-compose -f $COMPOSE_FILE run --rm trpc-server npm run db:migrate

# Update search indexes
echo "Updating search indexes..."
docker-compose -f $COMPOSE_FILE run --rm content-service npm run search:reindex

# Deploy with zero-downtime rolling update
echo "Deploying services..."
docker-compose -f $COMPOSE_FILE up -d --no-deps --scale trpc-server=3

# Health check
echo "Performing health checks..."
sleep 30

for service in trpc-server content-service social-service; do
    if ! docker-compose -f $COMPOSE_FILE exec $service curl -f http://localhost:3000/health; then
        echo "Health check failed for $service"
        echo "Rolling back..."
        docker-compose -f $COMPOSE_FILE rollback
        exit 1
    fi
done

echo "Deployment successful!"
echo "Application is available at https://$DOMAIN"

# Clean up old images
docker image prune -f
```

---

## For Backend Engineers

### Implementation Priority

1. **Database Setup**: Implement Supabase PostgreSQL schema with RLS policies
2. **tRPC Server**: Build core API endpoints for authentication, content, and social features
3. **External API Integration**: Implement Watchmode, TMDb, and other API clients with circuit breaker patterns
4. **Temporal Workflows**: Set up content synchronization workflows
5. **Caching Layer**: Implement Redis caching strategy across all services
6. **Search Integration**: Configure Meilisearch indexes and search endpoints

### Key Implementation Notes

- Use Prisma for type-safe database operations with Supabase
- Implement comprehensive error handling and logging with Sentry
- Follow tRPC patterns for end-to-end type safety
- Use Temporal for reliable external API synchronization
- Implement circuit breakers for external service resilience

## For Frontend Engineers

### Implementation Priority

1. **Mobile App Setup**: Initialize Expo React Native project with TypeScript
2. **Web App Setup**: Create Remix application with SSR configuration
3. **Shared tRPC Client**: Implement type-safe API client for both platforms
4. **Authentication Flow**: Build Supabase Auth integration
5. **Core UI Components**: Develop design system components with NativeWind/Tailwind
6. **Content Discovery**: Implement search and browsing interfaces

### Key Implementation Notes

- Share TypeScript types between mobile and web via tRPC
- Use TanStack Query for API state management
- Implement offline-first patterns for mobile
- Focus on performance with lazy loading and code splitting
- Use Supabase realtime subscriptions for social features

## For QA Engineers

### Testing Strategy

1. **API Testing**: Use tRPC's type safety for comprehensive API contract testing
2. **Integration Testing**: Test external API integrations with mock services
3. **Performance Testing**: Validate <2s app launch and <100ms search response targets
4. **Security Testing**: Test Row Level Security policies and authentication flows
5. **Mobile Testing**: Cross-platform testing on iOS and Android devices

### Critical Test Scenarios

- Content sync reliability under network failures
- Search performance with large datasets
- Social feature privacy controls
- Real-time subscription accuracy
- External API rate limiting and fallbacks

## For Security Analysts

### Security Implementation Focus

1. **Supabase RLS Policies**: Review and validate all Row Level Security implementations
2. **API Security**: Implement rate limiting, request validation, and CORS policies
3. **Authentication Security**: Configure secure JWT handling and session management
4. **Data Encryption**: Ensure TLS 1.3 for transit and AES-256 for rest
5. **External API Security**: Secure API key management and rotation

### Security Considerations

- Privacy-first social features with granular controls
- Secure external API credential management
- Input validation and sanitization across all endpoints
- Regular security audits of dependencies
- GDPR/CCPA compliance for user data handling

This architecture blueprint provides implementation-ready specifications that enable parallel development across all engineering disciplines while ensuring the system meets performance targets and success metrics outlined in the product requirements.