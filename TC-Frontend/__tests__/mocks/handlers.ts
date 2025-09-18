import { http, HttpResponse } from 'msw';

// Backend API mock handlers for frontend testing
export const backendAPIHandlers = [
  // Authentication endpoints
  http.post('/api/trpc/auth.register', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      result: {
        data: {
          user: {
            id: 'test-user-id',
            email: body.email,
            displayName: body.displayName,
            fullName: body.fullName,
            privacyLevel: 'PRIVATE',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
          },
        },
      },
    });
  }),

  http.post('/api/trpc/auth.login', async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      result: {
        data: {
          user: {
            id: 'test-user-id',
            email: body.email,
            displayName: 'Test User',
            fullName: 'Test User',
            privacyLevel: 'PRIVATE',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          session: {
            access_token: 'mock-access-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
          },
        },
      },
    });
  }),

  http.post('/api/trpc/auth.logout', () => {
    return HttpResponse.json({
      result: {
        data: { success: true },
      },
    });
  }),

  http.get('/api/trpc/auth.me', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
          fullName: 'Test User',
          privacyLevel: 'PRIVATE',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Content endpoints
  http.post('/api/trpc/content.search', async ({ request }) => {
    const body = await request.json();
    const query = body.query || '';

    return HttpResponse.json({
      result: {
        data: {
          hits: [
            {
              id: 'test-content-1',
              title: `${query} - Test Documentary`,
              type: 'DOCUMENTARY',
              trueCrimeType: 'DOCUMENTARY',
              releaseYear: 2023,
              duration: 120,
              description: 'A test true crime documentary',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          query,
          totalHits: 1,
          processingTimeMs: 5,
        },
      },
    });
  }),

  http.get('/api/trpc/content.getById', ({ request }) => {
    const url = new URL(request.url);
    const contentId = url.searchParams.get('input');

    return HttpResponse.json({
      result: {
        data: {
          id: contentId || 'test-content-1',
          title: 'Test True Crime Documentary',
          type: 'DOCUMENTARY',
          trueCrimeType: 'DOCUMENTARY',
          releaseYear: 2023,
          duration: 120,
          description: 'A gripping documentary about a true crime case',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          platforms: [
            {
              id: 'netflix',
              name: 'Netflix',
              url: 'https://netflix.com',
              type: 'subscription',
            },
          ],
        },
      },
    });
  }),

  http.get('/api/trpc/content.getRecommendations', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: [
          {
            id: 'rec-content-1',
            title: 'Recommended True Crime Doc',
            type: 'DOCUMENTARY',
            trueCrimeType: 'DOCUMENTARY',
            releaseYear: 2023,
            duration: 90,
            isActive: true,
          },
          {
            id: 'rec-content-2',
            title: 'Another Recommended Series',
            type: 'TV_SERIES',
            trueCrimeType: 'TV_SERIES',
            releaseYear: 2022,
            isActive: true,
          },
        ],
      },
    });
  }),

  // User content endpoints
  http.post('/api/trpc/userContent.track', async ({ request }) => {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: {
          id: 'test-user-content-id',
          userId: 'test-user-id',
          contentId: body.contentId,
          trackingState: body.trackingState,
          rating: null,
          notes: null,
          progress: 0,
          isComplete: false,
          watchedOn: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  http.get('/api/trpc/userContent.getMyList', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: [
          {
            id: 'test-user-content-1',
            userId: 'test-user-id',
            contentId: 'test-content-1',
            trackingState: 'WATCHING',
            progress: 50,
            isComplete: false,
            content: {
              id: 'test-content-1',
              title: 'Test Documentary in Progress',
              type: 'DOCUMENTARY',
              releaseYear: 2023,
            },
          },
          {
            id: 'test-user-content-2',
            userId: 'test-user-id',
            contentId: 'test-content-2',
            trackingState: 'WANT_TO_WATCH',
            progress: 0,
            isComplete: false,
            content: {
              id: 'test-content-2',
              title: 'Test Series to Watch',
              type: 'TV_SERIES',
              releaseYear: 2022,
            },
          },
        ],
      },
    });
  }),

  // Custom lists endpoints
  http.post('/api/trpc/lists.create', async ({ request }) => {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: {
          id: 'test-list-id',
          userId: 'test-user-id',
          name: body.name,
          description: body.description,
          isPublic: body.isPublic || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }),

  http.get('/api/trpc/lists.getMyLists', ({ request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return HttpResponse.json({
        error: {
          json: {
            message: 'Unauthorized',
            code: -32001,
            data: { code: 'UNAUTHORIZED', httpStatus: 401 },
          },
        },
      }, { status: 401 });
    }

    return HttpResponse.json({
      result: {
        data: [
          {
            id: 'test-list-1',
            userId: 'test-user-id',
            name: 'My Favorite True Crime',
            description: 'A collection of my favorite true crime content',
            isPublic: false,
            itemCount: 5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    });
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Error scenarios
  http.get('/api/trpc/error.test', () => {
    return HttpResponse.json({
      error: {
        json: {
          message: 'Test error',
          code: -32603,
          data: { code: 'INTERNAL_SERVER_ERROR', httpStatus: 500 },
        },
      },
    }, { status: 500 });
  }),
];