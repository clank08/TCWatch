import { http, HttpResponse } from 'msw';

// External API mock handlers
export const externalAPIHandlers = [
  // Watchmode API
  http.get('https://api.watchmode.com/v1/search/', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search_value');

    return HttpResponse.json({
      title_results: [
        {
          id: 123456,
          title: search || 'Test True Crime Documentary',
          type: 'movie',
          year: 2023,
          genre_names: ['Documentary', 'Crime'],
          source_ids: {
            imdb: 'tt1234567',
            tmdb: 654321,
          },
        },
      ],
    });
  }),

  http.get('https://api.watchmode.com/v1/title/:id/sources/', ({ params }) => {
    return HttpResponse.json([
      {
        source_id: 203,
        name: 'Netflix',
        type: 'sub',
        region: 'US',
        ios_url: 'https://netflix.com',
        android_url: 'https://netflix.com',
        web_url: 'https://netflix.com',
      },
    ]);
  }),

  // TMDb API
  http.get('https://api.themoviedb.org/3/search/movie', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    return HttpResponse.json({
      results: [
        {
          id: 654321,
          title: query || 'Test True Crime Documentary',
          overview: 'A gripping documentary about a true crime case',
          release_date: '2023-01-15',
          runtime: 120,
          genre_ids: [99, 80],
          poster_path: '/test-poster.jpg',
          backdrop_path: '/test-backdrop.jpg',
          vote_average: 8.5,
          vote_count: 1250,
        },
      ],
    });
  }),

  http.get('https://api.themoviedb.org/3/movie/:id', ({ params }) => {
    return HttpResponse.json({
      id: parseInt(params.id as string),
      title: 'Test True Crime Documentary',
      overview: 'A gripping documentary about a true crime case',
      release_date: '2023-01-15',
      runtime: 120,
      genres: [
        { id: 99, name: 'Documentary' },
        { id: 80, name: 'Crime' },
      ],
      poster_path: '/test-poster.jpg',
      backdrop_path: '/test-backdrop.jpg',
      vote_average: 8.5,
      vote_count: 1250,
    });
  }),

  // TheTVDB API
  http.get('https://api4.thetvdb.com/v4/search', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');

    return HttpResponse.json({
      data: [
        {
          id: '789012',
          name: query || 'Test True Crime Series',
          overview: 'A true crime series exploring multiple cases',
          first_air_date: '2023-01-01',
          genres: [{ id: 1, name: 'Documentary' }],
          network: 'Test Network',
          status: 'Continuing',
        },
      ],
    });
  }),

  http.get('https://api4.thetvdb.com/v4/series/:id', ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        name: 'Test True Crime Series',
        overview: 'A true crime series exploring multiple cases',
        first_air_date: '2023-01-01',
        genres: [{ id: 1, name: 'Documentary' }],
        network: 'Test Network',
        status: 'Continuing',
      },
    });
  }),

  // TVMaze API
  http.get('https://api.tvmaze.com/search/shows', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    return HttpResponse.json([
      {
        score: 1.0,
        show: {
          id: 345678,
          name: q || 'Test True Crime Show',
          type: 'Documentary',
          language: 'English',
          genres: ['Drama', 'Crime'],
          status: 'Running',
          premiered: '2023-01-01',
          officialSite: 'https://example.com',
          schedule: {
            time: '21:00',
            days: ['Sunday'],
          },
          network: {
            id: 1,
            name: 'Test Network',
            country: {
              name: 'United States',
              code: 'US',
            },
          },
          summary: '<p>A test true crime documentary series</p>',
        },
      },
    ]);
  }),

  // Wikidata API
  http.get('https://query.wikidata.org/sparql', ({ request }) => {
    return HttpResponse.json({
      results: {
        bindings: [
          {
            case: { value: 'Q123456' },
            caseLabel: { value: 'Test Criminal Case' },
            description: { value: 'A notable criminal case' },
            date: { value: '2020-01-01' },
            location: { value: 'Test City, Test State' },
          },
        ],
      },
    });
  }),

  // Error scenarios for testing
  http.get('https://api.watchmode.com/v1/error', () => {
    return HttpResponse.json({ error: 'API Error' }, { status: 500 });
  }),

  http.get('https://api.themoviedb.org/3/error', () => {
    return HttpResponse.json({ status_message: 'Invalid API key' }, { status: 401 });
  }),

  http.get('https://api.timeout.com/*', () => {
    return HttpResponse.json({ error: 'Request Timeout' }, { status: 408 });
  }),
];

// Internal API mock handlers for integration testing
export const internalAPIHandlers = [
  // tRPC endpoints
  http.post('/api/trpc/:procedure', async ({ params, request }) => {
    const procedure = params.procedure as string;
    const body = await request.json();

    switch (procedure) {
      case 'auth.register':
        return HttpResponse.json({
          result: {
            data: {
              user: {
                id: 'test-user-id',
                email: body.email,
                displayName: body.displayName,
              },
              session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
              },
            },
          },
        });

      case 'auth.login':
        return HttpResponse.json({
          result: {
            data: {
              user: {
                id: 'test-user-id',
                email: body.email,
                displayName: 'Test User',
              },
              session: {
                access_token: 'mock-access-token',
                refresh_token: 'mock-refresh-token',
              },
            },
          },
        });

      case 'content.search':
        return HttpResponse.json({
          result: {
            data: {
              hits: [
                {
                  id: 'test-content-1',
                  title: 'Test True Crime Documentary',
                  type: 'documentary',
                  releaseYear: 2023,
                },
              ],
              query: body.query,
              totalHits: 1,
            },
          },
        });

      case 'userContent.track':
        return HttpResponse.json({
          result: {
            data: {
              id: 'test-user-content-id',
              userId: 'test-user-id',
              contentId: body.contentId,
              trackingState: body.trackingState,
              progress: 0,
              isComplete: false,
            },
          },
        });

      default:
        return HttpResponse.json({
          error: {
            json: {
              message: 'Procedure not found',
              code: -32601,
            },
          },
        }, { status: 404 });
    }
  }),

  // Health check
  http.get('/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),

  // Metrics
  http.get('/metrics', () => {
    return HttpResponse.text('# HELP http_requests_total Total HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total 100');
  }),
];