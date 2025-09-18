// Frontend-specific test utilities
import { ReactElement } from 'react';

// Mock navigation utilities
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

// Mock async storage utilities
export const createMockAsyncStorage = () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
});

// Component testing utilities
export const findByTestId = (testID: string) => (element: any) => {
  return element.findByProps({ testID });
};

export const findAllByTestId = (testID: string) => (element: any) => {
  return element.findAllByProps({ testID });
};

// Form testing utilities
export const fillForm = async (form: any, data: Record<string, any>) => {
  for (const [field, value] of Object.entries(data)) {
    const input = form.getByTestId(`${field}-input`);
    // Simulate text input
    input.props.onChangeText?.(value);
  }
};

export const submitForm = async (form: any) => {
  const submitButton = form.getByTestId('submit-button');
  submitButton.props.onPress?.();
};

// Gesture testing utilities
export const simulatePress = (element: any) => {
  element.props.onPress?.();
};

export const simulateLongPress = (element: any) => {
  element.props.onLongPress?.();
};

export const simulateSwipe = (element: any, direction: 'left' | 'right' | 'up' | 'down') => {
  const gestureHandler = element.props.onGestureEvent || element.props.onHandlerStateChange;
  if (gestureHandler) {
    // Mock swipe gesture
    gestureHandler({
      nativeEvent: {
        translationX: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
        translationY: direction === 'up' ? -100 : direction === 'down' ? 100 : 0,
        state: 5, // END state
      },
    });
  }
};

// Screen testing utilities
export const waitForScreen = async (testInstance: any, screenName: string) => {
  // Wait for navigation to complete
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(testInstance.getByTestId(`${screenName}-screen`)).toBeTruthy();
};

export const expectScreenToBeVisible = (testInstance: any, screenName: string) => {
  expect(testInstance.getByTestId(`${screenName}-screen`)).toBeTruthy();
};

// List testing utilities
export const scrollToEnd = (list: any) => {
  list.props.onEndReached?.();
};

export const refreshList = (list: any) => {
  list.props.onRefresh?.();
};

export const simulateListItemPress = (list: any, index: number) => {
  const items = list.findAllByProps({ testID: /list-item-/ });
  if (items[index]) {
    items[index].props.onPress?.();
  }
};

// Image testing utilities
export const expectImageToLoad = (image: any, expectedSource: string) => {
  expect(image.props.source).toEqual(expect.objectContaining({ uri: expectedSource }));
  // Simulate successful image load
  image.props.onLoad?.();
};

export const simulateImageError = (image: any) => {
  image.props.onError?.({ nativeEvent: { error: 'Failed to load image' } });
};

// Modal testing utilities
export const expectModalToBeVisible = (modal: any) => {
  expect(modal.props.visible).toBe(true);
};

export const expectModalToBeHidden = (modal: any) => {
  expect(modal.props.visible).toBe(false);
};

export const closeModal = (modal: any) => {
  modal.props.onRequestClose?.();
};

// Animation testing utilities
export const expectAnimationToStart = (animatedView: any) => {
  // Check if animation props are set
  expect(animatedView.props.style).toBeDefined();
};

export const completeAnimation = (animatedView: any) => {
  // Simulate animation completion
  const onAnimationEnd = animatedView.props.onAnimationEnd;
  if (onAnimationEnd) {
    onAnimationEnd();
  }
};

// Accessibility testing utilities
export const expectAccessibilityLabel = (element: any, label: string) => {
  expect(element.props.accessibilityLabel).toBe(label);
};

export const expectAccessibilityRole = (element: any, role: string) => {
  expect(element.props.accessibilityRole).toBe(role);
};

export const expectAccessibilityHint = (element: any, hint: string) => {
  expect(element.props.accessibilityHint).toBe(hint);
};

export const simulateAccessibilityAction = (element: any, action: string) => {
  const actions = element.props.accessibilityActions || [];
  const targetAction = actions.find((a: any) => a.name === action);
  if (targetAction && element.props.onAccessibilityAction) {
    element.props.onAccessibilityAction({ nativeEvent: { actionName: action } });
  }
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => ReactElement) => {
  const start = performance.now();
  renderFn();
  const end = performance.now();
  return end - start;
};

// Network testing utilities
export const simulateNetworkError = () => {
  // Mock network connectivity
  jest.mock('@react-native-community/netinfo', () => ({
    fetch: () => Promise.resolve({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    }),
    addEventListener: jest.fn(),
  }));
};

export const simulateSlowNetwork = () => {
  // Mock slow network
  jest.mock('@react-native-community/netinfo', () => ({
    fetch: () => Promise.resolve({
      type: 'cellular',
      isConnected: true,
      isInternetReachable: true,
      details: {
        cellularGeneration: '2g',
      },
    }),
    addEventListener: jest.fn(),
  }));
};

// State management testing utilities
export const createMockStore = (initialState: any = {}) => {
  let state = { ...initialState };

  return {
    getState: () => state,
    setState: (newState: any) => {
      state = { ...state, ...newState };
    },
    subscribe: jest.fn(),
    dispatch: jest.fn(),
  };
};