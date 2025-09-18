import { test, expect, Page } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { HomePage } from '../pages/home.page';
import { ContentDetailPage } from '../pages/content-detail.page';
import { SearchPage } from '../pages/search.page';
import { TestDataManager } from '../utils/test-data-manager';

/**
 * Critical User Flows E2E Tests
 * Tests the most important user journeys in TCWatch application
 *
 * Test Categories:
 * - Authentication Flow: Login, registration, logout
 * - Content Discovery: Search, browse, recommendations
 * - Content Tracking: Add to list, mark as watched, rate content
 * - Social Features: Share lists, follow friends
 * - Cross-Platform Sync: Data consistency across devices
 */

test.describe('Critical User Flows', () => {
  let authPage: AuthPage;
  let homePage: HomePage;
  let contentDetailPage: ContentDetailPage;
  let searchPage: SearchPage;
  let testDataManager: TestDataManager;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    homePage = new HomePage(page);
    contentDetailPage = new ContentDetailPage(page);
    searchPage = new SearchPage(page);
    testDataManager = new TestDataManager();

    // Clean up test data before each test
    await testDataManager.cleanupTestData();
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await testDataManager.cleanupTestData();
  });

  test.describe('Authentication Flow', () => {
    test('should allow user to register, login, and logout', async ({ page }) => {
      const testUser = testDataManager.createTestUser();

      // Registration
      await test.step('User can register successfully', async () => {
        await authPage.goto();
        await authPage.clickSignUp();
        await authPage.fillRegistrationForm({
          email: testUser.email,
          password: testUser.password,
          displayName: testUser.displayName
        });
        await authPage.submitRegistration();

        // Should redirect to onboarding
        await expect(page).toHaveURL(/.*onboarding/);
        await expect(page.locator('[data-testid="welcome-message"]'))
          .toContainText(`Welcome, ${testUser.displayName}`);
      });

      // Complete onboarding
      await test.step('User can complete onboarding', async () => {
        await page.locator('[data-testid="genre-documentary"]').click();
        await page.locator('[data-testid="genre-series"]').click();
        await page.locator('[data-testid="continue-button"]').click();

        // Should redirect to home
        await expect(page).toHaveURL(/.*home/);
      });

      // Logout
      await test.step('User can logout', async () => {
        await homePage.openUserMenu();
        await homePage.clickLogout();

        // Should redirect to auth page
        await expect(page).toHaveURL(/.*auth/);
      });

      // Login
      await test.step('User can login with existing credentials', async () => {
        await authPage.fillLoginForm({
          email: testUser.email,
          password: testUser.password
        });
        await authPage.submitLogin();

        // Should redirect to home
        await expect(page).toHaveURL(/.*home/);
        await expect(homePage.getUserDisplayName())
          .toContainText(testUser.displayName);
      });
    });

    test('should handle authentication errors gracefully', async ({ page }) => {
      await test.step('Show error for invalid credentials', async () => {
        await authPage.goto();
        await authPage.fillLoginForm({
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        await authPage.submitLogin();

        await expect(page.locator('[data-testid="error-message"]'))
          .toContainText('Invalid email or password');
      });

      await test.step('Show error for existing email during registration', async () => {
        const existingUser = await testDataManager.createDatabaseUser();

        await authPage.clickSignUp();
        await authPage.fillRegistrationForm({
          email: existingUser.email,
          password: 'newpassword123',
          displayName: 'New User'
        });
        await authPage.submitRegistration();

        await expect(page.locator('[data-testid="error-message"]'))
          .toContainText('Email already exists');
      });
    });
  });

  test.describe('Content Discovery Flow', () => {
    test('should allow user to discover and track content', async ({ page, context }) => {
      // Setup: Login user
      const testUser = await testDataManager.setupAuthenticatedUser();
      await authPage.loginAs(testUser);

      await test.step('User can search for content', async () => {
        await homePage.openSearch();
        await searchPage.searchFor('true crime documentary');

        // Should show search results
        await expect(searchPage.getSearchResults()).toHaveCount.greaterThan(0);

        // Verify search results are relevant
        const firstResult = searchPage.getFirstSearchResult();
        await expect(firstResult.locator('[data-testid="content-title"]'))
          .toContainText(/crime|documentary/i);
      });

      await test.step('User can view content details', async () => {
        await searchPage.clickFirstResult();

        // Should navigate to content detail page
        await expect(page).toHaveURL(/.*content\/.*$/);
        await expect(contentDetailPage.getTitle()).toBeVisible();
        await expect(contentDetailPage.getDescription()).toBeVisible();
        await expect(contentDetailPage.getStreamingAvailability()).toBeVisible();
      });

      await test.step('User can add content to want-to-watch list', async () => {
        await contentDetailPage.clickAddToWantToWatch();

        // Should show success feedback
        await expect(page.locator('[data-testid="tracking-success"]'))
          .toContainText('Added to Want to Watch');

        // Button should change state
        await expect(contentDetailPage.getTrackingButton())
          .toContainText('Want to Watch');
      });

      await test.step('User can mark content as watching', async () => {
        await contentDetailPage.changeTrackingState('watching');

        await expect(page.locator('[data-testid="tracking-success"]'))
          .toContainText('Moved to Watching');

        // Progress tracking should appear
        await expect(contentDetailPage.getProgressTracker()).toBeVisible();
      });

      await test.step('User can update progress', async () => {
        await contentDetailPage.updateProgress(50); // 50% progress

        await expect(contentDetailPage.getProgressBar())
          .toHaveAttribute('aria-valuenow', '50');
      });

      await test.step('User can complete content and rate it', async () => {
        await contentDetailPage.markAsCompleted();
        await contentDetailPage.rateContent(4); // 4 stars

        await expect(page.locator('[data-testid="completion-success"]'))
          .toContainText('Marked as completed');

        await expect(contentDetailPage.getUserRating())
          .toContainText('4');
      });
    });

    test('should provide personalized recommendations', async ({ page }) => {
      // Setup: User with viewing history
      const testUser = await testDataManager.setupUserWithViewingHistory();
      await authPage.loginAs(testUser);

      await test.step('User sees personalized recommendations on home page', async () => {
        await homePage.goto();

        const recommendationsSection = homePage.getRecommendationsSection();
        await expect(recommendationsSection).toBeVisible();

        // Should have multiple recommendation categories
        await expect(recommendationsSection.locator('[data-testid="category-title"]'))
          .toHaveCount.greaterThan(2);

        // Recommendations should be based on user preferences
        const firstRecommendation = recommendationsSection.locator('[data-testid="content-card"]').first();
        await expect(firstRecommendation).toHaveAttribute('data-crime-type', 'DOCUMENTARY');
      });

      await test.step('Recommendations update based on user interactions', async () => {
        // Interact with a different genre
        await homePage.searchFor('true crime podcast');
        const podcastContent = searchPage.getContentByType('PODCAST');
        await podcastContent.click();
        await contentDetailPage.clickAddToWantToWatch();

        // Return to home and check updated recommendations
        await homePage.goto();
        await page.waitForTimeout(2000); // Wait for recommendation update

        const updatedRecommendations = homePage.getRecommendationsSection();
        await expect(updatedRecommendations.locator('[data-crime-type="PODCAST"]'))
          .toHaveCount.greaterThan(0);
      });
    });
  });

  test.describe('Cross-Platform Data Sync', () => {
    test('should sync data across multiple browser sessions', async ({ browser }) => {
      const testUser = await testDataManager.setupAuthenticatedUser();
      const testContent = await testDataManager.createTestContent();

      // First browser session - mobile simulation
      const mobileContext = await browser.newContext({
        ...devices['iPhone 12']
      });
      const mobilePage = await mobileContext.newPage();
      const mobileHomePage = new HomePage(mobilePage);
      const mobileContentPage = new ContentDetailPage(mobilePage);

      // Second browser session - desktop
      const desktopContext = await browser.newContext({
        ...devices['Desktop Chrome']
      });
      const desktopPage = await desktopContext.newPage();
      const desktopHomePage = new HomePage(desktopPage);

      await test.step('User adds content on mobile device', async () => {
        await new AuthPage(mobilePage).loginAs(testUser);
        await mobilePage.goto(`/content/${testContent.id}`);
        await mobileContentPage.clickAddToWantToWatch();

        await expect(mobilePage.locator('[data-testid="tracking-success"]'))
          .toContainText('Added to Want to Watch');
      });

      await test.step('Content appears in lists on desktop', async () => {
        await new AuthPage(desktopPage).loginAs(testUser);
        await desktopHomePage.goto();
        await desktopHomePage.openMyLists();

        const wantToWatchList = desktopHomePage.getWantToWatchList();
        await expect(wantToWatchList.locator(`[data-content-id="${testContent.id}"]`))
          .toBeVisible();
      });

      await test.step('Progress updates sync between devices', async () => {
        // Update progress on mobile
        await mobilePage.goto(`/content/${testContent.id}`);
        await mobileContentPage.changeTrackingState('watching');
        await mobileContentPage.updateProgress(75);

        // Check progress on desktop
        await desktopPage.reload();
        await desktopPage.goto(`/content/${testContent.id}`);

        const desktopContentPage = new ContentDetailPage(desktopPage);
        await expect(desktopContentPage.getProgressBar())
          .toHaveAttribute('aria-valuenow', '75');
      });

      // Cleanup
      await mobileContext.close();
      await desktopContext.close();
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should maintain performance under normal usage', async ({ page }) => {
      const testUser = await testDataManager.setupAuthenticatedUser();
      await authPage.loginAs(testUser);

      await test.step('Home page loads within performance budget', async () => {
        const startTime = Date.now();
        await homePage.goto();
        await homePage.waitForContent();
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(2000); // Under 2 seconds
      });

      await test.step('Search responds quickly', async () => {
        await homePage.openSearch();

        const startTime = Date.now();
        await searchPage.searchFor('documentary');
        await searchPage.waitForResults();
        const searchTime = Date.now() - startTime;

        expect(searchTime).toBeLessThan(500); // Under 500ms
      });

      await test.step('Content details load efficiently', async () => {
        await searchPage.clickFirstResult();

        const startTime = Date.now();
        await contentDetailPage.waitForContent();
        const loadTime = Date.now() - startTime;

        expect(loadTime).toBeLessThan(1000); // Under 1 second
      });
    });

    test('should handle network failures gracefully', async ({ page, context }) => {
      const testUser = await testDataManager.setupAuthenticatedUser();
      await authPage.loginAs(testUser);

      await test.step('App works in offline mode', async () => {
        // Load initial content
        await homePage.goto();
        await homePage.waitForContent();

        // Go offline
        await context.setOffline(true);

        // Should show offline indicator
        await expect(page.locator('[data-testid="offline-indicator"]'))
          .toBeVisible();

        // Should still allow browsing cached content
        await homePage.openMyLists();
        await expect(homePage.getMyListsContent()).toBeVisible();
      });

      await test.step('App recovers when connection is restored', async () => {
        // Go back online
        await context.setOffline(false);

        // Should hide offline indicator
        await expect(page.locator('[data-testid="offline-indicator"]'))
          .not.toBeVisible();

        // Should sync any pending changes
        await expect(page.locator('[data-testid="sync-success"]'))
          .toContainText('Data synchronized');
      });
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should be fully accessible via keyboard navigation', async ({ page }) => {
      const testUser = await testDataManager.setupAuthenticatedUser();
      await authPage.loginAs(testUser);
      await homePage.goto();

      await test.step('User can navigate using only keyboard', async () => {
        // Tab through navigation elements
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'search-button');

        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'user-menu-button');

        // Navigate to content
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toHaveAttribute('data-testid', 'content-card');

        // Activate with Enter
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/.*content\/.*$/);
      });

      await test.step('Screen reader announcements work correctly', async () => {
        // Test live region announcements
        await contentDetailPage.clickAddToWantToWatch();

        const announcement = page.locator('[aria-live="assertive"]');
        await expect(announcement).toContainText('Added to Want to Watch list');
      });
    });
  });
});