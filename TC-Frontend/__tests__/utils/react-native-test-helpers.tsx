import React, { ReactElement } from 'react';
import { render, RenderOptions, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * Comprehensive React Native testing utilities for TCWatch
 * Provides enhanced testing capabilities for mobile app components
 */

// Enhanced Test Wrapper with All Providers
interface TestWrapperProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
  navigationState?: any;
}

const TestWrapper: React.FC<TestWrapperProps> = ({
  children,
  queryClient,
  initialRoute = '/',
  navigationState
}) => {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0 },
      mutations: { retry: false }
    }
  });

  const client = queryClient || defaultQueryClient;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider
        initialMetrics={{
          insets: { top: 44, left: 0, right: 0, bottom: 34 },
          frame: { x: 0, y: 0, width: 375, height: 812 }
        }}
      >
        <QueryClientProvider client={client}>
          <NavigationContainer
            initialState={navigationState}
            documentTitle={{ enabled: false }}
          >
            {children}
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

// Custom render function with enhanced wrapper
const customRender = (
  ui: ReactElement,
  options?: RenderOptions & {
    queryClient?: QueryClient;
    initialRoute?: string;
    navigationState?: any;
  }
) => {
  const { queryClient, initialRoute, navigationState, ...renderOptions } = options || {};

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <TestWrapper
      queryClient={queryClient}
      initialRoute={initialRoute}
      navigationState={navigationState}
    >
      {children}
    </TestWrapper>
  );

  return render(ui, { wrapper, ...renderOptions });
};

// Re-export testing utilities
export * from '@testing-library/react-native';
export { customRender as render };

// Navigation Testing Helpers
export class NavigationTestHelper {
  /**
   * Create mock navigation object with full navigation API
   */
  static createMockNavigation(overrides: any = {}) {
    return {
      navigate: jest.fn(),
      goBack: jest.fn(),
      canGoBack: jest.fn(() => true),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
      setParams: jest.fn(),
      isFocused: jest.fn(() => true),
      addListener: jest.fn((event, callback) => {
        // Return unsubscribe function
        return () => {};
      }),
      removeListener: jest.fn(),
      getId: jest.fn(() => 'test-screen-id'),
      getParent: jest.fn(),
      getState: jest.fn(() => ({
        key: 'test-key',
        index: 0,
        routeNames: ['TestScreen'],
        routes: [{ key: 'test-route', name: 'TestScreen', params: {} }],
        history: []
      })),
      reset: jest.fn(),
      push: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
      replace: jest.fn(),
      ...overrides
    };
  }

  /**
   * Create mock route object
   */
  static createMockRoute(overrides: any = {}) {
    return {
      key: 'test-route-key',
      name: 'TestScreen',
      path: '/test',
      params: {},
      ...overrides
    };
  }

  /**
   * Test navigation behavior
   */
  static async testNavigation(
    component: any,
    triggerNavigation: () => void,
    expectedNavigation: { method: string; args: any[] }
  ) {
    const mockNavigation = this.createMockNavigation();

    // Trigger navigation action
    triggerNavigation();

    await waitFor(() => {
      expect(mockNavigation[expectedNavigation.method])
        .toHaveBeenCalledWith(...expectedNavigation.args);
    });
  }
}

// User Interaction Testing Helpers
export class InteractionTestHelper {
  /**
   * Simulate user typing with realistic delays
   */
  static async typeText(input: any, text: string, options: { delay?: number } = {}) {
    const { delay = 50 } = options;

    for (let i = 0; i < text.length; i++) {
      fireEvent.changeText(input, text.substring(0, i + 1));
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Simulate swipe gestures
   */
  static swipeLeft(element: any) {
    fireEvent(element, 'onSwipeLeft');
  }

  static swipeRight(element: any) {
    fireEvent(element, 'onSwipeRight');
  }

  static swipeUp(element: any) {
    fireEvent(element, 'onSwipeUp');
  }

  static swipeDown(element: any) {
    fireEvent(element, 'onSwipeDown');
  }

  /**
   * Simulate pull to refresh
   */
  static pullToRefresh(scrollView: any) {
    fireEvent(scrollView, 'onRefresh');
  }

  /**
   * Simulate long press with timing
   */
  static async longPress(element: any, duration: number = 500) {
    fireEvent(element, 'onPressIn');
    await new Promise(resolve => setTimeout(resolve, duration));
    fireEvent(element, 'onLongPress');
    fireEvent(element, 'onPressOut');
  }

  /**
   * Simulate scroll to element
   */
  static scrollToElement(scrollView: any, elementIndex: number) {
    fireEvent.scroll(scrollView, {
      nativeEvent: {
        contentOffset: { y: elementIndex * 100 },
        contentSize: { height: 1000, width: 375 },
        layoutMeasurement: { height: 812, width: 375 }
      }
    });
  }
}

// Form Testing Helpers
export class FormTestHelper {
  /**
   * Fill form with data
   */
  static async fillForm(formData: Record<string, any>, options: { submit?: boolean } = {}) {
    const results: Record<string, any> = {};

    for (const [fieldName, value] of Object.entries(formData)) {
      const field = await waitFor(() =>
        require('@testing-library/react-native').getByTestId(`input-${fieldName}`)
      );

      if (typeof value === 'string') {
        await InteractionTestHelper.typeText(field, value);
      } else if (typeof value === 'boolean') {
        fireEvent.press(field);
      }

      results[fieldName] = field;
    }

    if (options.submit) {
      const submitButton = await waitFor(() =>
        require('@testing-library/react-native').getByTestId('submit-button')
      );
      fireEvent.press(submitButton);
    }

    return results;
  }

  /**
   * Test form validation
   */
  static async testFormValidation(
    formComponent: any,
    invalidData: Record<string, any>,
    expectedErrors: Record<string, string>
  ) {
    await this.fillForm(invalidData, { submit: true });

    for (const [fieldName, expectedError] of Object.entries(expectedErrors)) {
      await waitFor(() => {
        const errorElement = require('@testing-library/react-native')
          .getByTestId(`error-${fieldName}`);
        expect(errorElement).toHaveTextContent(expectedError);
      });
    }
  }
}

// Mock Data Providers
export class MockDataProvider {
  /**
   * Create mock user data
   */
  static createMockUser(overrides: any = {}) {
    return {
      id: `user-${Date.now()}`,
      email: 'test@example.com',
      displayName: 'Test User',
      fullName: 'Test User',
      privacyLevel: 'PRIVATE',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock content data
   */
  static createMockContent(overrides: any = {}) {
    return {
      id: `content-${Date.now()}`,
      title: 'Test True Crime Documentary',
      type: 'DOCUMENTARY',
      trueCrimeType: 'DOCUMENTARY',
      releaseYear: 2023,
      duration: 120,
      description: 'A test documentary about true crime',
      posterUrl: 'https://example.com/poster.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  }

  /**
   * Create mock API responses
   */
  static createMockAPIResponse(data: any, overrides: any = {}) {
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      ...overrides
    };
  }

  /**
   * Create paginated response
   */
  static createPaginatedResponse(items: any[], page: number = 1, limit: number = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total: items.length,
        totalPages: Math.ceil(items.length / limit),
        hasNext: endIndex < items.length,
        hasPrev: page > 1
      }
    };
  }
}

// Accessibility Testing Helpers
export class AccessibilityTestHelper {
  /**
   * Test component accessibility
   */
  static testAccessibility(element: any, requirements: {
    label?: string;
    role?: string;
    hint?: string;
    state?: any;
  }) {
    if (requirements.label) {
      expect(element).toHaveProp('accessibilityLabel', requirements.label);
    }

    if (requirements.role) {
      expect(element).toHaveProp('accessibilityRole', requirements.role);
    }

    if (requirements.hint) {
      expect(element).toHaveProp('accessibilityHint', requirements.hint);
    }

    if (requirements.state) {
      expect(element).toHaveProp('accessibilityState', requirements.state);
    }
  }

  /**
   * Test keyboard navigation
   */
  static async testKeyboardNavigation(component: any) {
    // Test tab order
    const focusableElements = component.findAll(el =>
      el.props.accessibilityRole === 'button' ||
      el.props.accessibilityRole === 'textbox'
    );

    for (let i = 0; i < focusableElements.length; i++) {
      fireEvent(focusableElements[i], 'onFocus');
      expect(focusableElements[i]).toHaveProp('accessibilityState',
        expect.objectContaining({ focused: true })
      );
    }
  }

  /**
   * Test screen reader announcements
   */
  static testScreenReaderAnnouncement(element: any, expectedAnnouncement: string) {
    expect(element).toHaveProp('accessibilityLiveRegion', 'assertive');
    expect(element).toHaveTextContent(expectedAnnouncement);
  }
}

// Performance Testing Helpers
export class PerformanceTestHelper {
  /**
   * Measure component render time
   */
  static async measureRenderTime(renderFunction: () => any) {
    const start = performance.now();
    const result = renderFunction();
    const end = performance.now();

    return {
      result,
      renderTime: end - start
    };
  }

  /**
   * Test for memory leaks
   */
  static async testMemoryLeak(
    componentFactory: () => any,
    iterations: number = 100
  ) {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

    for (let i = 0; i < iterations; i++) {
      const component = componentFactory();
      component.unmount();
    }

    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc();
    }

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
  }
}

// Animation Testing Helpers
export class AnimationTestHelper {
  /**
   * Test animation completion
   */
  static async testAnimation(
    element: any,
    animationTrigger: () => void,
    expectedFinalState: any
  ) {
    animationTrigger();

    // Wait for animation to complete
    await waitFor(() => {
      expect(element).toHaveStyle(expectedFinalState);
    }, { timeout: 2000 });
  }

  /**
   * Mock animation timing
   */
  static mockAnimationTiming() {
    jest.useFakeTimers();

    return {
      runAllTimers: () => jest.runAllTimers(),
      advanceTimersByTime: (ms: number) => jest.advanceTimersByTime(ms),
      cleanup: () => jest.useRealTimers()
    };
  }
}

// Test Utilities Export
export const testUtils = {
  navigation: NavigationTestHelper,
  interaction: InteractionTestHelper,
  form: FormTestHelper,
  mockData: MockDataProvider,
  accessibility: AccessibilityTestHelper,
  performance: PerformanceTestHelper,
  animation: AnimationTestHelper
};

// Custom Jest Matchers for React Native
export const customMatchers = {
  toBeVisible: (received: any) => {
    const style = received.props.style || {};
    const isVisible = style.opacity !== 0 && style.display !== 'none';

    return {
      message: () => `expected element to ${isVisible ? 'not ' : ''}be visible`,
      pass: isVisible
    };
  },

  toHaveValidTestId: (received: any) => {
    const testID = received.props.testID;
    const hasTestId = typeof testID === 'string' && testID.length > 0;

    return {
      message: () => `expected element to have a valid testID`,
      pass: hasTestId
    };
  }
};

// Add custom matchers to Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeVisible(): R;
      toHaveValidTestId(): R;
    }
  }
}