import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { app, prisma, createTestUser, createTestContent } from '../../../tests/setup';
import {
  apiHelper,
  dbHelper,
  MockDataFactory,
  PerformanceTestHelper,
  ValidationTestHelper
} from '../../../tests/utils/test-helpers';
import { ContentService } from '../content.service';

/**
 * Content Service Test Suite
 * Demonstrates comprehensive testing practices for TCWatch backend services
 *
 * Test Categories:
 * - Unit Tests: Service method testing with mocked dependencies
 * - Integration Tests: Database and external API integration
 * - Performance Tests: Response time and load testing
 * - Validation Tests: Input validation and error handling
 * - Security Tests: Authorization and access control
 */

describe('ContentService', () => {
  let contentService: ContentService;
  let testUser: any;
  let testContent: any;

  beforeEach(async () => {
    // Initialize service with mocked dependencies
    contentService = new ContentService(prisma);

    // Create test data
    testUser = await createTestUser();
    testContent = await createTestContent();
  });

  describe('Content Discovery', () => {
    describe('searchContent', () => {
      it('should return paginated search results', async () => {
        // Arrange
        const searchQuery = 'true crime';
        const page = 1;
        const limit = 10;

        // Act
        const result = await contentService.searchContent(searchQuery, { page, limit });

        // Assert
        expect(result).toHaveProperty('data');
        expect(result).toHaveProperty('pagination');
        expect(result.pagination.page).toBe(page);
        expect(result.pagination.limit).toBe(limit);
        expect(Array.isArray(result.data)).toBe(true);
      });

      it('should filter results by true crime type', async () => {
        // Arrange
        await dbHelper.createTestContent({
          title: 'Documentary Crime',
          trueCrimeType: 'DOCUMENTARY'
        });
        await dbHelper.createTestContent({
          title: 'Podcast Crime',
          trueCrimeType: 'PODCAST'
        });

        // Act
        const documentaryResults = await contentService.searchContent('crime', {
          trueCrimeType: 'DOCUMENTARY'
        });

        // Assert
        expect(documentaryResults.data.every((item: any) =>
          item.trueCrimeType === 'DOCUMENTARY'
        )).toBe(true);
      });

      it('should handle empty search results gracefully', async () => {
        // Act
        const result = await contentService.searchContent('nonexistent content');

        // Assert
        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });

      it('should maintain search response time under 100ms', async () => {
        // Arrange
        const searchQuery = 'crime';

        // Act & Assert
        const { duration } = await PerformanceTestHelper.measureResponseTime(() =>
          contentService.searchContent(searchQuery)
        );

        PerformanceTestHelper.assertResponseTime(duration, 100);
      });
    });

    describe('getContentById', () => {
      it('should return content with all related data', async () => {
        // Act
        const result = await contentService.getContentById(testContent.id);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe(testContent.id);
        expect(result.title).toBe(testContent.title);
        expect(result).toHaveProperty('streamingAvailability');
        expect(result).toHaveProperty('cases');
      });

      it('should return null for non-existent content', async () => {
        // Act
        const result = await contentService.getContentById('non-existent-id');

        // Assert
        expect(result).toBeNull();
      });

      it('should not return inactive content', async () => {
        // Arrange
        const inactiveContent = await dbHelper.createTestContent({ isActive: false });

        // Act
        const result = await contentService.getContentById(inactiveContent.id);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('getRecommendations', () => {
      it('should return personalized recommendations for user', async () => {
        // Arrange
        const userPreferences = {
          trueCrimeTypes: ['DOCUMENTARY', 'SERIES'],
          preferredGenres: ['MYSTERY', 'INVESTIGATION']
        };

        // Act
        const recommendations = await contentService.getRecommendations(
          testUser.id,
          userPreferences
        );

        // Assert
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThan(0);
        recommendations.forEach((content: any) => {
          expect(userPreferences.trueCrimeTypes).toContain(content.trueCrimeType);
        });
      });

      it('should handle users with no viewing history', async () => {
        // Arrange
        const newUser = await createTestUser({ displayName: 'New User' });

        // Act
        const recommendations = await contentService.getRecommendations(newUser.id);

        // Assert
        expect(Array.isArray(recommendations)).toBe(true);
        // Should return popular content for new users
      });
    });
  });

  describe('Content Management', () => {
    describe('createContent', () => {
      it('should create content with valid data', async () => {
        // Arrange
        const contentData = {
          title: 'New True Crime Documentary',
          type: 'DOCUMENTARY' as const,
          trueCrimeType: 'DOCUMENTARY' as const,
          releaseYear: 2023,
          duration: 90,
          description: 'A new documentary about true crime'
        };

        // Act
        const result = await contentService.createContent(contentData);

        // Assert
        expect(result).toBeDefined();
        expect(result.title).toBe(contentData.title);
        expect(result.type).toBe(contentData.type);
        await dbHelper.assertRecordExists('content', { id: result.id });
      });

      it('should validate required fields', async () => {
        // Arrange
        const invalidDataSets = [
          {
            data: { title: '', type: 'DOCUMENTARY' },
            expectedError: 'Title is required'
          },
          {
            data: { title: 'Test', type: 'INVALID_TYPE' },
            expectedError: 'Invalid content type'
          },
          {
            data: { title: 'Test', type: 'DOCUMENTARY', releaseYear: 1800 },
            expectedError: 'Invalid release year'
          }
        ];

        // Act & Assert
        await ValidationTestHelper.testInputValidation(
          (data) => contentService.createContent(data),
          {
            title: 'Valid Content',
            type: 'DOCUMENTARY',
            trueCrimeType: 'DOCUMENTARY',
            releaseYear: 2023,
            duration: 90
          },
          invalidDataSets
        );
      });
    });

    describe('updateContent', () => {
      it('should update content successfully', async () => {
        // Arrange
        const updateData = {
          title: 'Updated Title',
          description: 'Updated description'
        };

        // Act
        const result = await contentService.updateContent(testContent.id, updateData);

        // Assert
        expect(result.title).toBe(updateData.title);
        expect(result.description).toBe(updateData.description);

        // Verify in database
        const dbRecord = await dbHelper.assertRecordExists('content', {
          id: testContent.id,
          title: updateData.title
        });
        expect(dbRecord).toBeDefined();
      });

      it('should not update non-existent content', async () => {
        // Act & Assert
        await expect(
          contentService.updateContent('non-existent-id', { title: 'New Title' })
        ).rejects.toThrow('Content not found');
      });
    });
  });

  describe('External API Integration', () => {
    describe('syncContentFromExternalAPIs', () => {
      it('should sync content from Watchmode API', async () => {
        // Arrange
        const mockApiResponse = MockDataFactory.watchmodeResponse({
          title: 'Crime Documentary from API',
          id: 98765
        });

        // Mock external API call
        const mockAxios = require('axios');
        mockAxios.get.mockResolvedValueOnce({ data: mockApiResponse });

        // Act
        const result = await contentService.syncContentFromWatchmode();

        // Assert
        expect(result.synced).toBeGreaterThan(0);
        await dbHelper.assertRecordExists('content', {
          externalId: mockApiResponse.id.toString(),
          source: 'WATCHMODE'
        });
      });

      it('should handle API failures gracefully', async () => {
        // Arrange
        const mockAxios = require('axios');
        mockAxios.get.mockRejectedValueOnce(new Error('API Error'));

        // Act & Assert
        await expect(contentService.syncContentFromWatchmode())
          .not.toThrow(); // Should handle errors gracefully
      });

      it('should not create duplicate content', async () => {
        // Arrange
        const externalId = '12345';
        await dbHelper.createTestContent({
          externalId,
          source: 'WATCHMODE'
        });

        const mockApiResponse = MockDataFactory.watchmodeResponse({ id: externalId });
        const mockAxios = require('axios');
        mockAxios.get.mockResolvedValueOnce({ data: [mockApiResponse] });

        // Act
        await contentService.syncContentFromWatchmode();

        // Assert
        await dbHelper.assertRecordCount('content', 1, { externalId });
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent search requests', async () => {
      // Arrange
      const searchQuery = 'true crime';

      // Act
      const { successful, failed, successRate } = await PerformanceTestHelper.loadTest(
        () => contentService.searchContent(searchQuery),
        20 // 20 concurrent requests
      );

      // Assert
      expect(successRate).toBeGreaterThan(0.95); // 95% success rate
      expect(failed).toBeLessThan(2); // Less than 2 failures
    });

    it('should maintain database query performance', async () => {
      // Arrange - Create large dataset
      const contentPromises = Array(100).fill(null).map((_, index) =>
        dbHelper.createTestContent({ title: `Content ${index}` })
      );
      await Promise.all(contentPromises);

      // Act & Assert
      const { duration } = await PerformanceTestHelper.measureResponseTime(() =>
        contentService.searchContent('Content')
      );

      PerformanceTestHelper.assertResponseTime(duration, 200); // Under 200ms
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed search queries', async () => {
      // Arrange
      const malformedQueries = ['', '   ', null, undefined, '<script>alert("xss")</script>'];

      // Act & Assert
      for (const query of malformedQueries) {
        const result = await contentService.searchContent(query as any);
        expect(result.data).toEqual([]);
      }
    });

    it('should handle database connection failures', async () => {
      // Arrange
      const originalQuery = prisma.$queryRaw;
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Connection failed'));

      // Act & Assert
      await expect(contentService.searchContent('test'))
        .rejects.toThrow('Database connection failed');

      // Cleanup
      prisma.$queryRaw = originalQuery;
    });

    it('should validate pagination parameters', async () => {
      // Arrange
      const invalidPaginationTests = [
        { page: -1, limit: 10 },
        { page: 1, limit: -1 },
        { page: 1, limit: 1001 }, // Over maximum
        { page: 'invalid', limit: 10 }
      ];

      // Act & Assert
      for (const { page, limit } of invalidPaginationTests) {
        await expect(
          contentService.searchContent('test', { page: page as any, limit: limit as any })
        ).rejects.toThrow('Invalid pagination parameters');
      }
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in search', async () => {
      // Arrange
      const maliciousQuery = "'; DROP TABLE content; --";

      // Act
      const result = await contentService.searchContent(maliciousQuery);

      // Assert
      expect(result.data).toEqual([]); // Should not execute malicious SQL
      // Verify table still exists
      await dbHelper.assertRecordExists('content', { id: testContent.id });
    });

    it('should sanitize HTML content in descriptions', async () => {
      // Arrange
      const maliciousDescription = '<script>alert("xss")</script>Legitimate description';

      // Act
      const result = await contentService.createContent({
        title: 'Test Content',
        type: 'DOCUMENTARY',
        trueCrimeType: 'DOCUMENTARY',
        releaseYear: 2023,
        duration: 90,
        description: maliciousDescription
      });

      // Assert
      expect(result.description).not.toContain('<script>');
      expect(result.description).toContain('Legitimate description');
    });
  });
});