import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Mock providers wrapper for tests
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SafeAreaProvider initialMetrics={{ insets: { top: 0, left: 0, right: 0, bottom: 0 }, frame: { x: 0, y: 0, width: 0, height: 0 } }}>
      <NavigationContainer>
        {children}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { customRender as render };

// Custom queries and utilities
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  getId: jest.fn(() => 'test-id'),
  getParent: jest.fn(),
  getState: jest.fn(() => ({
    key: 'test-key',
    index: 0,
    routeNames: ['TestScreen'],
    routes: [{ key: 'test-route', name: 'TestScreen' }],
  })),
  reset: jest.fn(),
  setParams: jest.fn(),
});

export const createMockRoute = (params: any = {}) => ({
  key: 'test-route',
  name: 'TestScreen',
  path: '/test',
  params,
});

// Mock data factories
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  fullName: 'Test User',
  privacyLevel: 'PRIVATE' as const,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockContent = {
  id: 'test-content-id',
  title: 'Test True Crime Documentary',
  type: 'DOCUMENTARY' as const,
  trueCrimeType: 'DOCUMENTARY' as const,
  releaseYear: 2023,
  duration: 120,
  description: 'A test documentary about true crime',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockUserContent = {
  id: 'test-user-content-id',
  userId: 'test-user-id',
  contentId: 'test-content-id',
  trackingState: 'WANT_TO_WATCH' as const,
  rating: null,
  notes: null,
  progress: 0,
  isComplete: false,
  watchedOn: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Test helpers
export const waitForElementToBeRemoved = async (
  callback: () => any,
  options?: { timeout?: number; interval?: number }
) => {
  const { timeout = 1000, interval = 50 } = options || {};
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      callback();
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      return; // Element was removed
    }
  }

  throw new Error('Element was not removed within timeout');
};

export const createTestQueryClient = () => {
  // Mock TanStack Query client for testing
  return {
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
    mount: jest.fn(),
    unmount: jest.fn(),
  };
};

// Accessibility testing helpers
export const testAccessibility = {
  hasAccessibilityLabel: (element: any, label: string) => {
    expect(element).toHaveProp('accessibilityLabel', label);
  },
  hasAccessibilityRole: (element: any, role: string) => {
    expect(element).toHaveProp('accessibilityRole', role);
  },
  hasAccessibilityHint: (element: any, hint: string) => {
    expect(element).toHaveProp('accessibilityHint', hint);
  },
  isAccessible: (element: any) => {
    expect(element).toHaveProp('accessible', true);
  },
};