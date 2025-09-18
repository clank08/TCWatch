// Test user data
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    displayName: 'Test User',
    fullName: 'Test User',
    password: 'testpassword123',
  },
  adminUser: {
    email: 'admin@example.com',
    displayName: 'Admin User',
    fullName: 'Admin User',
    password: 'adminpassword123',
  },
  newUser: {
    email: 'newuser@example.com',
    displayName: 'New User',
    fullName: 'New Test User',
    password: 'newpassword123',
  },
};

// Test content data
export const testContent = {
  documentary: {
    id: 'test-doc-1',
    title: 'Test True Crime Documentary',
    type: 'DOCUMENTARY',
    trueCrimeType: 'DOCUMENTARY',
    releaseYear: 2023,
    duration: 120,
    description: 'A gripping documentary about a true crime case',
  },
  series: {
    id: 'test-series-1',
    title: 'Test True Crime Series',
    type: 'TV_SERIES',
    trueCrimeType: 'TV_SERIES',
    releaseYear: 2022,
    description: 'A multi-part series exploring criminal cases',
  },
  movie: {
    id: 'test-movie-1',
    title: 'Test Crime Movie',
    type: 'MOVIE',
    trueCrimeType: 'MOVIE',
    releaseYear: 2021,
    duration: 95,
    description: 'A dramatic retelling of a true crime story',
  },
};

// Test search queries
export const searchQueries = {
  validQuery: 'true crime',
  popularQuery: 'serial killer',
  specificQuery: 'Ted Bundy',
  noResultsQuery: 'xyzabc123',
  emptyQuery: '',
  longQuery: 'this is a very long search query that contains many words and should test the search functionality with extended input',
};

// Test list data
export const testLists = {
  privateList: {
    name: 'My Private True Crime List',
    description: 'A collection of my favorite true crime content',
    isPublic: false,
  },
  publicList: {
    name: 'Best True Crime Documentaries',
    description: 'The best true crime documentaries ever made',
    isPublic: true,
  },
  watchLater: {
    name: 'Watch Later',
    description: 'Content I want to watch later',
    isPublic: false,
  },
};

// Test tracking states
export const trackingStates = {
  wantToWatch: 'WANT_TO_WATCH',
  watching: 'WATCHING',
  watched: 'WATCHED',
  onHold: 'ON_HOLD',
} as const;

// Test ratings
export const ratings = {
  poor: 1,
  fair: 2,
  good: 3,
  veryGood: 4,
  excellent: 5,
};

// Test navigation routes
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  search: '/search',
  myLists: '/my-lists',
  profile: '/profile',
  settings: '/settings',
  content: (id: string) => `/content/${id}`,
  list: (id: string) => `/list/${id}`,
};

// Test error scenarios
export const errorScenarios = {
  invalidCredentials: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  invalidEmail: {
    email: 'invalid-email',
    password: 'validpassword123',
  },
  shortPassword: {
    email: 'test@example.com',
    password: '123',
  },
  emptyFields: {
    email: '',
    password: '',
  },
  networkError: {
    simulate: true,
    type: 'network',
  },
  serverError: {
    simulate: true,
    type: 'server',
    status: 500,
  },
  validationError: {
    simulate: true,
    type: 'validation',
    fields: ['email', 'password'],
  },
};

// Test performance benchmarks
export const performanceBenchmarks = {
  pageLoad: {
    good: 2000, // 2 seconds
    acceptable: 5000, // 5 seconds
  },
  searchResponse: {
    good: 500, // 0.5 seconds
    acceptable: 2000, // 2 seconds
  },
  contentLoad: {
    good: 1000, // 1 second
    acceptable: 3000, // 3 seconds
  },
};

// Test accessibility requirements
export const accessibilityRequirements = {
  contrastRatio: 4.5, // WCAG AA standard
  focusIndicators: true,
  keyboardNavigation: true,
  screenReaderSupport: true,
  alternativeText: true,
};

// Test browser configurations
export const browserConfigs = {
  desktop: {
    chrome: { width: 1920, height: 1080 },
    firefox: { width: 1920, height: 1080 },
    safari: { width: 1920, height: 1080 },
  },
  mobile: {
    iphone: { width: 375, height: 812 },
    android: { width: 360, height: 640 },
  },
  tablet: {
    ipad: { width: 768, height: 1024 },
    androidTablet: { width: 800, height: 1280 },
  },
};

// Test environment configurations
export const testEnvironments = {
  development: {
    baseURL: 'http://localhost:3000',
    apiURL: 'http://localhost:3001',
  },
  staging: {
    baseURL: 'https://staging.tcwatch.app',
    apiURL: 'https://api-staging.tcwatch.app',
  },
  production: {
    baseURL: 'https://tcwatch.app',
    apiURL: 'https://api.tcwatch.app',
  },
};