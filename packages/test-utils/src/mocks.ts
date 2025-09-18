import type { MockApiResponse } from './types';

// Mock external API responses
export const mockWatchmodeResponse = {
  title_results: [
    {
      id: 123456,
      title: 'Test True Crime Documentary',
      type: 'movie',
      year: 2023,
      genre_names: ['Documentary', 'Crime'],
      source_ids: {
        imdb: 'tt1234567',
        tmdb: 654321,
      },
    },
  ],
};

export const mockTMDbResponse = {
  id: 654321,
  title: 'Test True Crime Documentary',
  overview: 'A gripping documentary about a true crime case',
  release_date: '2023-01-15',
  runtime: 120,
  genre_ids: [99, 80], // Documentary, Crime
  poster_path: '/test-poster.jpg',
  backdrop_path: '/test-backdrop.jpg',
  vote_average: 8.5,
  vote_count: 1250,
};

export const mockTheTVDBResponse = {
  data: {
    id: 789012,
    seriesName: 'Test True Crime Series',
    overview: 'A true crime series exploring multiple cases',
    firstAired: '2023-01-01',
    genre: ['Documentary', 'Crime'],
    network: 'Test Network',
    status: 'Continuing',
    episodes: [
      {
        id: 1,
        airedSeason: 1,
        airedEpisodeNumber: 1,
        episodeName: 'The First Case',
        overview: 'Introduction to the first case',
        firstAired: '2023-01-01',
      },
    ],
  },
};

export const mockTVMazeResponse = {
  id: 345678,
  name: 'Test True Crime Show',
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
};

export const mockWikidataResponse = {
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
};

// Mock API error responses
export const mockApiError = (status: number, message: string): MockApiResponse => ({
  error: message,
  status,
  headers: { 'content-type': 'application/json' },
});

export const mockNetworkError = (): MockApiResponse => ({
  error: 'Network Error',
  status: 0,
});

export const mockTimeoutError = (): MockApiResponse => ({
  error: 'Request Timeout',
  status: 408,
});

// Mock authentication responses
export const mockSupabaseAuth = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      display_name: 'Test User',
      full_name: 'Test User',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
  },
  session: {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'mock-refresh-token',
    user: null as any, // Will be filled with user object
  },
};

// Mock tRPC responses
export const mockTRPCResponse = <T>(data: T): { result: { data: T } } => ({
  result: { data },
});

export const mockTRPCError = (code: string, message: string) => ({
  error: {
    json: {
      message,
      code: -32600,
      data: {
        code,
        httpStatus: 400,
      },
    },
  },
});

// Mock Redis responses
export const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flushall: jest.fn(),
  quit: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

// Mock Meilisearch responses
export const mockMeilisearchClient = {
  index: jest.fn().mockReturnValue({
    search: jest.fn().mockResolvedValue({
      hits: [
        {
          id: 'test-content-1',
          title: 'Test True Crime Documentary',
          type: 'documentary',
          releaseYear: 2023,
        },
      ],
      query: 'true crime',
      processingTimeMs: 5,
      limit: 20,
      offset: 0,
      estimatedTotalHits: 1,
    }),
    addDocuments: jest.fn(),
    updateDocuments: jest.fn(),
    deleteDocument: jest.fn(),
    deleteAllDocuments: jest.fn(),
  }),
};

// Mock Temporal client
export const mockTemporalClient = {
  workflow: {
    start: jest.fn().mockResolvedValue({
      workflowId: 'test-workflow-id',
      runId: 'test-run-id',
    }),
    result: jest.fn().mockResolvedValue({}),
    query: jest.fn(),
    signal: jest.fn(),
    terminate: jest.fn(),
    cancel: jest.fn(),
  },
  schedule: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    trigger: jest.fn(),
  },
};