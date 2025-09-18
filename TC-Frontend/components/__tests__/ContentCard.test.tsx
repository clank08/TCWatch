import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  render,
  fireEvent,
  waitFor,
  testUtils
} from '../../__tests__/utils/react-native-test-helpers';
import { ContentCard } from '../ContentCard';

/**
 * ContentCard Component Test Suite
 * Demonstrates comprehensive React Native component testing practices
 *
 * Test Categories:
 * - Rendering Tests: Component renders correctly with different props
 * - Interaction Tests: User interactions (tap, long press, swipe)
 * - Accessibility Tests: Screen reader and keyboard navigation support
 * - State Management Tests: Component state changes
 * - Performance Tests: Render performance and memory usage
 * - Visual Tests: Layout and styling verification
 */

describe('ContentCard', () => {
  const mockContent = testUtils.mockData.createMockContent({
    title: 'The Disappearance of Madeleine McCann',
    type: 'DOCUMENTARY',
    trueCrimeType: 'DOCUMENTARY',
    releaseYear: 2019,
    duration: 480, // 8 hours total
    description: 'A comprehensive look at the disappearance of Madeleine McCann',
    posterUrl: 'https://example.com/poster.jpg'
  });

  const mockUserContent = {
    id: 'user-content-1',
    userId: 'user-1',
    contentId: mockContent.id,
    trackingState: 'WANT_TO_WATCH' as const,
    progress: 0,
    rating: null,
    isComplete: false
  };

  const defaultProps = {
    content: mockContent,
    userContent: mockUserContent,
    onPress: jest.fn(),
    onTrackingStateChange: jest.fn(),
    onLongPress: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render content information correctly', () => {
      // Act
      const { getByText, getByTestId } = render(<ContentCard {...defaultProps} />);

      // Assert
      expect(getByText('The Disappearance of Madeleine McCann')).toBeTruthy();
      expect(getByText('2019')).toBeTruthy();
      expect(getByText('8h 0m')).toBeTruthy(); // Duration formatted
      expect(getByTestId('content-card')).toBeTruthy();
      expect(getByTestId('content-poster')).toBeTruthy();
    });

    it('should display tracking state correctly', () => {
      // Act
      const { getByTestId } = render(<ContentCard {...defaultProps} />);

      // Assert
      const trackingIndicator = getByTestId('tracking-indicator');
      expect(trackingIndicator).toHaveTextContent('Want to Watch');
    });

    it('should handle missing poster image gracefully', () => {
      // Arrange
      const contentWithoutPoster = {
        ...mockContent,
        posterUrl: null
      };

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} content={contentWithoutPoster} />
      );

      // Assert
      const placeholder = getByTestId('poster-placeholder');
      expect(placeholder).toBeTruthy();
    });

    it('should show progress indicator for partially watched content', () => {
      // Arrange
      const inProgressUserContent = {
        ...mockUserContent,
        trackingState: 'WATCHING' as const,
        progress: 150 // 2.5 hours watched
      };

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} userContent={inProgressUserContent} />
      );

      // Assert
      const progressBar = getByTestId('progress-bar');
      expect(progressBar).toBeTruthy();
      expect(progressBar).toHaveStyle({ width: '31.25%' }); // 150/480 = 31.25%
    });

    it('should display completion checkmark for completed content', () => {
      // Arrange
      const completedUserContent = {
        ...mockUserContent,
        trackingState: 'COMPLETED' as const,
        isComplete: true,
        rating: 4
      };

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} userContent={completedUserContent} />
      );

      // Assert
      expect(getByTestId('completion-checkmark')).toBeTruthy();
      expect(getByTestId('user-rating')).toHaveTextContent('4');
    });
  });

  describe('User Interactions', () => {
    it('should call onPress when card is tapped', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Act
      fireEvent.press(card);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onPress).toHaveBeenCalledWith(mockContent);
      });
    });

    it('should call onLongPress when card is long pressed', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Act
      await testUtils.interaction.longPress(card);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onLongPress).toHaveBeenCalledWith(mockContent);
      });
    });

    it('should change tracking state when quick action button is pressed', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const quickActionButton = getByTestId('quick-action-button');

      // Act
      fireEvent.press(quickActionButton);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onTrackingStateChange).toHaveBeenCalledWith(
          mockContent.id,
          'WATCHING'
        );
      });
    });

    it('should handle swipe gestures for quick actions', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Act
      testUtils.interaction.swipeRight(card);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onTrackingStateChange).toHaveBeenCalledWith(
          mockContent.id,
          'COMPLETED'
        );
      });
    });

    it('should prevent double-tap spam', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Act
      fireEvent.press(card);
      fireEvent.press(card); // Second tap immediately

      // Assert
      await waitFor(() => {
        expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      // Act
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Assert
      testUtils.accessibility.testAccessibility(card, {
        label: 'Content card for The Disappearance of Madeleine McCann',
        role: 'button',
        hint: 'Double tap to view details'
      });
    });

    it('should announce tracking state changes to screen readers', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const quickActionButton = getByTestId('quick-action-button');

      // Act
      fireEvent.press(quickActionButton);

      // Assert
      await waitFor(() => {
        const announcement = getByTestId('sr-announcement');
        testUtils.accessibility.testScreenReaderAnnouncement(
          announcement,
          'Added to watching list'
        );
      });
    });

    it('should support keyboard navigation', async () => {
      // Act
      const component = render(<ContentCard {...defaultProps} />);

      // Assert
      await testUtils.accessibility.testKeyboardNavigation(component);
    });

    it('should have proper contrast ratios', () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);

      // Assert
      const title = getByTestId('content-title');
      const titleStyle = title.props.style;
      expect(titleStyle.color).toBe('#FFFFFF'); // High contrast on dark background
    });
  });

  describe('State Management', () => {
    it('should update UI when tracking state prop changes', async () => {
      // Arrange
      const { getByTestId, rerender } = render(<ContentCard {...defaultProps} />);

      // Act
      const updatedUserContent = {
        ...mockUserContent,
        trackingState: 'WATCHING' as const
      };
      rerender(<ContentCard {...defaultProps} userContent={updatedUserContent} />);

      // Assert
      await waitFor(() => {
        const trackingIndicator = getByTestId('tracking-indicator');
        expect(trackingIndicator).toHaveTextContent('Watching');
      });
    });

    it('should handle loading states gracefully', () => {
      // Arrange
      const loadingProps = {
        ...defaultProps,
        content: null,
        isLoading: true
      };

      // Act
      const { getByTestId } = render(<ContentCard {...loadingProps} />);

      // Assert
      expect(getByTestId('loading-skeleton')).toBeTruthy();
    });

    it('should handle error states', () => {
      // Arrange
      const errorProps = {
        ...defaultProps,
        error: 'Failed to load content'
      };

      // Act
      const { getByTestId, getByText } = render(<ContentCard {...errorProps} />);

      // Assert
      expect(getByTestId('error-state')).toBeTruthy();
      expect(getByText('Failed to load content')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render within acceptable time limits', async () => {
      // Act & Assert
      const { renderTime } = await testUtils.performance.measureRenderTime(() =>
        render(<ContentCard {...defaultProps} />)
      );

      expect(renderTime).toBeLessThan(16); // 60fps = 16.67ms per frame
    });

    it('should not cause memory leaks on repeated renders', async () => {
      // Act & Assert
      await testUtils.performance.testMemoryLeak(() =>
        render(<ContentCard {...defaultProps} />)
      );
    });

    it('should efficiently handle image loading', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const poster = getByTestId('content-poster');

      // Act
      fireEvent(poster, 'onLoadStart');
      const loadStart = performance.now();

      fireEvent(poster, 'onLoadEnd');
      const loadEnd = performance.now();

      // Assert
      expect(loadEnd - loadStart).toBeLessThan(100); // Mock load time
    });
  });

  describe('Visual Layout', () => {
    it('should maintain aspect ratio on different screen sizes', () => {
      // Arrange
      const mockDimensions = [
        { width: 375, height: 812 }, // iPhone X
        { width: 414, height: 896 }, // iPhone 11 Pro Max
        { width: 768, height: 1024 } // iPad
      ];

      mockDimensions.forEach(dimensions => {
        // Mock screen dimensions
        require('react-native').Dimensions.get = jest.fn(() => dimensions);

        // Act
        const { getByTestId } = render(<ContentCard {...defaultProps} />);
        const card = getByTestId('content-card');

        // Assert
        const cardStyle = card.props.style;
        expect(cardStyle.aspectRatio).toBe(2 / 3); // Poster aspect ratio
      });
    });

    it('should handle text overflow gracefully', () => {
      // Arrange
      const longTitleContent = {
        ...mockContent,
        title: 'This is an extremely long title that should be truncated properly to prevent layout issues'
      };

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} content={longTitleContent} />
      );

      // Assert
      const title = getByTestId('content-title');
      expect(title.props.numberOfLines).toBe(2);
      expect(title.props.ellipsizeMode).toBe('tail');
    });

    it('should apply proper spacing and margins', () => {
      // Act
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const card = getByTestId('content-card');

      // Assert
      const style = card.props.style;
      expect(style.margin).toBe(8);
      expect(style.borderRadius).toBe(12);
    });
  });

  describe('Integration with Data Layer', () => {
    it('should handle real-time tracking state updates', async () => {
      // Arrange
      const mockQueryClient = testUtils.mockData.createMockQueryClient();
      mockQueryClient.getQueryData.mockReturnValue(mockUserContent);

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} />,
        { queryClient: mockQueryClient }
      );

      // Simulate real-time update
      fireEvent(getByTestId('quick-action-button'), 'onPress');

      // Assert
      await waitFor(() => {
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith([
          'userContent',
          mockContent.id
        ]);
      });
    });

    it('should handle offline scenarios', () => {
      // Arrange
      const offlineProps = {
        ...defaultProps,
        isOffline: true
      };

      // Act
      const { getByTestId } = render(<ContentCard {...offlineProps} />);

      // Assert
      expect(getByTestId('offline-indicator')).toBeTruthy();

      // Quick actions should be disabled
      const quickActionButton = getByTestId('quick-action-button');
      expect(quickActionButton.props.disabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined content gracefully', () => {
      // Act & Assert
      expect(() => {
        render(<ContentCard {...defaultProps} content={null} />);
      }).not.toThrow();
    });

    it('should handle malformed duration data', () => {
      // Arrange
      const malformedContent = {
        ...mockContent,
        duration: -1 // Invalid duration
      };

      // Act
      const { getByTestId } = render(
        <ContentCard {...defaultProps} content={malformedContent} />
      );

      // Assert
      const durationText = getByTestId('duration-text');
      expect(durationText).toHaveTextContent('Duration unavailable');
    });

    it('should handle network request failures', async () => {
      // Arrange
      const { getByTestId } = render(<ContentCard {...defaultProps} />);
      const poster = getByTestId('content-poster');

      // Act
      fireEvent(poster, 'onError');

      // Assert
      await waitFor(() => {
        expect(getByTestId('poster-error-placeholder')).toBeTruthy();
      });
    });
  });
});