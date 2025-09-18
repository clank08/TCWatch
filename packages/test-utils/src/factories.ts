import type {
  TestUser,
  TestContent,
  TestUserContent,
  TestEpisodeProgress,
  TestCustomList,
} from './types';

// Base factory function
function createFactory<T>(defaultData: T) {
  return (overrides?: Partial<T>): T => ({
    ...defaultData,
    ...overrides,
  });
}

// Generate unique IDs for testing
export const generateId = (prefix = 'test') =>
  `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

// User factory
export const createTestUser = createFactory<TestUser>({
  id: generateId('user'),
  email: 'test@example.com',
  displayName: 'Test User',
  fullName: 'Test User',
  privacyLevel: 'PRIVATE',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Content factory
export const createTestContent = createFactory<TestContent>({
  id: generateId('content'),
  title: 'Test True Crime Documentary',
  type: 'DOCUMENTARY',
  trueCrimeType: 'DOCUMENTARY',
  releaseYear: 2023,
  duration: 120,
  description: 'A test documentary about true crime',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// User content factory
export const createTestUserContent = createFactory<TestUserContent>({
  id: generateId('user-content'),
  userId: generateId('user'),
  contentId: generateId('content'),
  trackingState: 'WANT_TO_WATCH',
  rating: null,
  notes: null,
  progress: 0,
  isComplete: false,
  watchedOn: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Episode progress factory
export const createTestEpisodeProgress = createFactory<TestEpisodeProgress>({
  id: generateId('episode-progress'),
  userContentId: generateId('user-content'),
  seasonNumber: 1,
  episodeNumber: 1,
  isWatched: false,
  watchedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Custom list factory
export const createTestCustomList = createFactory<TestCustomList>({
  id: generateId('list'),
  userId: generateId('user'),
  name: 'Test Custom List',
  description: 'A test custom list',
  isPublic: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Complex test scenarios
export const createCompleteUserScenario = () => {
  const user = createTestUser();
  const content = createTestContent();
  const userContent = createTestUserContent({
    userId: user.id,
    contentId: content.id,
    trackingState: 'WATCHING',
    progress: 50,
  });
  const customList = createTestCustomList({
    userId: user.id,
  });

  return {
    user,
    content,
    userContent,
    customList,
  };
};

export const createTVSeriesScenario = () => {
  const user = createTestUser();
  const tvSeries = createTestContent({
    type: 'TV_SERIES',
    trueCrimeType: 'TV_SERIES',
    title: 'Test True Crime Series',
  });
  const userContent = createTestUserContent({
    userId: user.id,
    contentId: tvSeries.id,
    trackingState: 'WATCHING',
  });

  // Create episode progress for multiple episodes
  const episodes = [
    createTestEpisodeProgress({
      userContentId: userContent.id,
      seasonNumber: 1,
      episodeNumber: 1,
      isWatched: true,
      watchedAt: new Date().toISOString(),
    }),
    createTestEpisodeProgress({
      userContentId: userContent.id,
      seasonNumber: 1,
      episodeNumber: 2,
      isWatched: false,
    }),
  ];

  return {
    user,
    tvSeries,
    userContent,
    episodes,
  };
};

// Bulk data generators
export const createTestUsers = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createTestUser({
      email: `user${i}@example.com`,
      displayName: `Test User ${i}`,
      fullName: `Test User ${i}`,
    })
  );

export const createTestContents = (count: number) =>
  Array.from({ length: count }, (_, i) =>
    createTestContent({
      title: `Test Content ${i}`,
      releaseYear: 2020 + (i % 4),
    })
  );