import { test, expect } from '@playwright/test';
import { AuthHelpers, NavigationHelpers, WaitHelpers } from '../utils/test-helpers';
import { testUsers, routes, errorScenarios } from '../fixtures/test-data';

test.describe('Authentication', () => {
  let auth: AuthHelpers;
  let nav: NavigationHelpers;
  let wait: WaitHelpers;

  test.beforeEach(async ({ page }) => {
    auth = new AuthHelpers(page);
    nav = new NavigationHelpers(page);
    wait = new WaitHelpers(page);
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto(routes.login);

      await page.fill('[data-testid="email-input"]', testUsers.validUser.email);
      await page.fill('[data-testid="password-input"]', testUsers.validUser.password);
      await page.click('[data-testid="login-button"]');

      await page.waitForURL(routes.dashboard);
      await expect(page).toHaveTitle(/Dashboard/);
      await expect(page.locator('[data-testid="user-welcome"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto(routes.login);

      await page.fill('[data-testid="email-input"]', errorScenarios.invalidCredentials.email);
      await page.fill('[data-testid="password-input"]', errorScenarios.invalidCredentials.password);
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
      await expect(page).toHaveURL(routes.login);
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(routes.login);

      await page.fill('[data-testid="email-input"]', errorScenarios.invalidEmail.email);
      await page.fill('[data-testid="password-input"]', errorScenarios.invalidEmail.password);
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    });

    test('should require password', async ({ page }) => {
      await page.goto(routes.login);

      await page.fill('[data-testid="email-input"]', testUsers.validUser.email);
      await page.click('[data-testid="login-button"]');

      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required');
    });

    test('should remember login state', async ({ page, context }) => {
      // Login
      await auth.login();

      // Close page and create new one
      await page.close();
      const newPage = await context.newPage();

      // Should still be logged in
      await newPage.goto(routes.dashboard);
      await expect(newPage.locator('[data-testid="user-welcome"]')).toBeVisible();
    });
  });

  test.describe('Registration', () => {
    test('should register new user', async ({ page }) => {
      await page.goto(routes.register);

      await page.fill('[data-testid="email-input"]', testUsers.newUser.email);
      await page.fill('[data-testid="display-name-input"]', testUsers.newUser.displayName);
      await page.fill('[data-testid="full-name-input"]', testUsers.newUser.fullName);
      await page.fill('[data-testid="password-input"]', testUsers.newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', testUsers.newUser.password);
      await page.click('[data-testid="register-button"]');

      await page.waitForURL(routes.dashboard);
      await expect(page.locator('[data-testid="user-welcome"]')).toContainText(testUsers.newUser.displayName);
    });

    test('should validate password confirmation', async ({ page }) => {
      await page.goto(routes.register);

      await page.fill('[data-testid="email-input"]', testUsers.newUser.email);
      await page.fill('[data-testid="display-name-input"]', testUsers.newUser.displayName);
      await page.fill('[data-testid="full-name-input"]', testUsers.newUser.fullName);
      await page.fill('[data-testid="password-input"]', testUsers.newUser.password);
      await page.fill('[data-testid="confirm-password-input"]', 'differentpassword');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="confirm-password-error"]')).toContainText('Passwords do not match');
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto(routes.register);

      await page.fill('[data-testid="email-input"]', testUsers.newUser.email);
      await page.fill('[data-testid="display-name-input"]', testUsers.newUser.displayName);
      await page.fill('[data-testid="full-name-input"]', testUsers.newUser.fullName);
      await page.fill('[data-testid="password-input"]', errorScenarios.shortPassword.password);
      await page.fill('[data-testid="confirm-password-input"]', errorScenarios.shortPassword.password);
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 8 characters');
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      await page.goto(routes.register);

      await page.fill('[data-testid="email-input"]', testUsers.validUser.email); // Existing user
      await page.fill('[data-testid="display-name-input"]', 'Another User');
      await page.fill('[data-testid="full-name-input"]', 'Another User');
      await page.fill('[data-testid="password-input"]', 'anotherpassword123');
      await page.fill('[data-testid="confirm-password-input"]', 'anotherpassword123');
      await page.click('[data-testid="register-button"]');

      await expect(page.locator('[data-testid="error-message"]')).toContainText('Email already exists');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await auth.login();

      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');

      await page.waitForURL(routes.login);
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test('should redirect to login when accessing protected route after logout', async ({ page }) => {
      // Login first
      await auth.login();

      // Logout
      await auth.logout();

      // Try to access protected route
      await page.goto(routes.myLists);
      await page.waitForURL(routes.login);
    });
  });

  test.describe('Password Reset', () => {
    test('should send password reset email', async ({ page }) => {
      await page.goto(routes.login);
      await page.click('[data-testid="forgot-password-link"]');

      await page.fill('[data-testid="reset-email-input"]', testUsers.validUser.email);
      await page.click('[data-testid="send-reset-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
    });

    test('should validate email for password reset', async ({ page }) => {
      await page.goto(routes.login);
      await page.click('[data-testid="forgot-password-link"]');

      await page.fill('[data-testid="reset-email-input"]', 'invalid-email');
      await page.click('[data-testid="send-reset-button"]');

      await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email format');
    });
  });

  test.describe('Session Management', () => {
    test('should handle session expiration', async ({ page }) => {
      // Login
      await auth.login();

      // Simulate session expiration by making an API call that returns 401
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      });

      // Try to access a protected resource
      await page.reload();

      // Should be redirected to login
      await page.waitForURL(routes.login);
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Session expired');
    });

    test('should refresh token automatically', async ({ page }) => {
      // This test would verify automatic token refresh
      // Implementation depends on your auth strategy
      await auth.login();

      // Navigate to different pages and verify auth state is maintained
      await nav.goToSearch();
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

      await nav.goToMyLists();
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });
});