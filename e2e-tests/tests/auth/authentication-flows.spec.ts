/**
 * E2E Authentication Flow Tests
 * Complete end-to-end tests for authentication journeys
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_EMAIL = 'test@tcwatch.test';
const TEST_PASSWORD = 'TestPassword123!';
const INVALID_EMAIL = 'invalid@tcwatch.test';
const INVALID_PASSWORD = 'wrongpassword';

// Page Object Model for Auth Pages
class AuthPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() { return this.page.getByTestId('email-input'); }
  get passwordInput() { return this.page.getByTestId('password-input'); }
  get confirmPasswordInput() { return this.page.getByTestId('confirm-password-input'); }
  get displayNameInput() { return this.page.getByTestId('display-name-input'); }
  get loginButton() { return this.page.getByTestId('login-button'); }
  get registerButton() { return this.page.getByTestId('register-button'); }
  get googleButton() { return this.page.getByTestId('google-button'); }
  get appleButton() { return this.page.getByTestId('apple-button'); }
  get forgotPasswordButton() { return this.page.getByTestId('forgot-password-button'); }
  get biometricButton() { return this.page.getByTestId('biometric-button'); }
  get signOutButton() { return this.page.getByTestId('sign-out-button'); }

  // Error elements
  get emailError() { return this.page.getByTestId('email-error'); }
  get passwordError() { return this.page.getByTestId('password-error'); }
  get formError() { return this.page.getByTestId('form-error'); }

  // Success elements
  get successMessage() { return this.page.getByTestId('success-message'); }
  get userProfile() { return this.page.getByTestId('user-profile'); }

  // Navigation methods
  async navigateToLogin() {
    await this.page.goto('/auth/login');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToRegister() {
    await this.page.goto('/auth/register');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToForgotPassword() {
    await this.page.goto('/auth/forgot-password');
    await this.page.waitForLoadState('networkidle');
  }

  // Authentication actions
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async register(email: string, password: string, displayName: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.displayNameInput.fill(displayName);
    await this.registerButton.click();
  }

  async loginWithGoogle() {
    await this.googleButton.click();
  }

  async loginWithApple() {
    await this.appleButton.click();
  }

  async loginWithBiometrics() {
    await this.biometricButton.click();
  }

  async signOut() {
    await this.signOutButton.click();
  }

  async resetPassword(email: string) {
    await this.emailInput.fill(email);
    await this.page.getByTestId('reset-password-button').click();
  }

  // Validation helpers
  async waitForLoginSuccess() {
    await expect(this.page).toHaveURL(/\/dashboard|\/home/);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForError() {
    await expect(this.formError).toBeVisible();
  }

  async expectValidationError(field: 'email' | 'password') {
    if (field === 'email') {
      await expect(this.emailError).toBeVisible();
    } else {
      await expect(this.passwordError).toBeVisible();
    }
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  get welcomeMessage() { return this.page.getByTestId('welcome-message'); }
  get userEmail() { return this.page.getByTestId('user-email'); }
  get profileMenu() { return this.page.getByTestId('profile-menu'); }
  get protectedContent() { return this.page.getByTestId('protected-content'); }

  async expectUserLoggedIn(email: string) {
    await expect(this.welcomeMessage).toBeVisible();
    await expect(this.userEmail).toContainText(email);
  }

  async expectProtectedContentVisible() {
    await expect(this.protectedContent).toBeVisible();
  }
}

test.describe('Authentication Flows', () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test.describe('Email/Password Login Flow', () => {
    test('should successfully log in with valid credentials', async ({ page }) => {
      await authPage.navigateToLogin();

      await authPage.login(TEST_EMAIL, TEST_PASSWORD);

      await authPage.waitForLoginSuccess();
      await dashboardPage.expectUserLoggedIn(TEST_EMAIL);
    });

    test('should show error for invalid email', async ({ page }) => {
      await authPage.navigateToLogin();

      await authPage.login('invalid-email', TEST_PASSWORD);

      await authPage.expectValidationError('email');
      expect(await authPage.emailError.textContent()).toContain('invalid');
    });

    test('should show error for empty password', async ({ page }) => {
      await authPage.navigateToLogin();

      await authPage.login(TEST_EMAIL, '');

      await authPage.expectValidationError('password');
      expect(await authPage.passwordError.textContent()).toContain('required');
    });

    test('should show error for incorrect credentials', async ({ page }) => {
      await authPage.navigateToLogin();

      await authPage.login(INVALID_EMAIL, INVALID_PASSWORD);

      await authPage.waitForError();
      expect(await authPage.formError.textContent()).toContain('Invalid');
    });

    test('should remember user session after page refresh', async ({ page }) => {
      // First login
      await authPage.navigateToLogin();
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be logged in
      await dashboardPage.expectUserLoggedIn(TEST_EMAIL);
    });

    test('should handle session timeout gracefully', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      // Simulate session expiration by clearing tokens
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Navigate to protected page
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  test.describe('User Registration Flow', () => {
    test('should successfully register new user', async ({ page }) => {
      const newUserEmail = `newuser-${Date.now()}@tcwatch.test`;

      await authPage.navigateToRegister();

      await authPage.register(newUserEmail, TEST_PASSWORD, 'New User');

      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/\/onboarding|\/dashboard/);

      // Verify email verification message or successful login
      await expect(authPage.successMessage.or(dashboardPage.welcomeMessage)).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await authPage.navigateToRegister();

      // Test weak password
      await authPage.register('test@example.com', '123', 'Test User');

      await authPage.expectValidationError('password');
      expect(await authPage.passwordError.textContent()).toContain('8 characters');
    });

    test('should validate password confirmation match', async ({ page }) => {
      await authPage.navigateToRegister();

      await authPage.emailInput.fill('test@example.com');
      await authPage.passwordInput.fill(TEST_PASSWORD);
      await authPage.confirmPasswordInput.fill('different-password');
      await authPage.displayNameInput.fill('Test User');
      await authPage.registerButton.click();

      await expect(authPage.page.getByTestId('confirm-password-error')).toBeVisible();
      expect(await authPage.page.getByTestId('confirm-password-error').textContent()).toContain('match');
    });

    test('should prevent registration with existing email', async ({ page }) => {
      await authPage.navigateToRegister();

      await authPage.register(TEST_EMAIL, TEST_PASSWORD, 'Duplicate User');

      await authPage.waitForError();
      expect(await authPage.formError.textContent()).toContain('already exists');
    });

    test('should validate display name requirements', async ({ page }) => {
      await authPage.navigateToRegister();

      await authPage.emailInput.fill('test@example.com');
      await authPage.passwordInput.fill(TEST_PASSWORD);
      await authPage.confirmPasswordInput.fill(TEST_PASSWORD);
      await authPage.displayNameInput.fill(''); // Empty display name
      await authPage.registerButton.click();

      await expect(authPage.page.getByTestId('display-name-error')).toBeVisible();
    });
  });

  test.describe('Social Authentication Flows', () => {
    test('should initiate Google OAuth flow', async ({ page, context }) => {
      await authPage.navigateToLogin();

      // Setup popup handler for OAuth
      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        authPage.loginWithGoogle()
      ]);

      // Verify OAuth redirect
      await expect(popup).toHaveURL(/accounts\.google\.com|supabase\.co/);

      // In a real test, you would complete the OAuth flow
      // For now, verify the popup opened
      await popup.close();
    });

    test('should initiate Apple OAuth flow', async ({ page, context }) => {
      // Skip on non-supported platforms
      const isMac = process.platform === 'darwin';
      test.skip(!isMac, 'Apple Sign In only available on macOS/iOS');

      await authPage.navigateToLogin();

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        authPage.loginWithApple()
      ]);

      await expect(popup).toHaveURL(/appleid\.apple\.com|supabase\.co/);
      await popup.close();
    });

    test('should handle OAuth cancellation', async ({ page, context }) => {
      await authPage.navigateToLogin();

      const [popup] = await Promise.all([
        context.waitForEvent('page'),
        authPage.loginWithGoogle()
      ]);

      // Simulate user cancelling OAuth
      await popup.close();

      // Should remain on login page
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should handle OAuth errors', async ({ page }) => {
      await authPage.navigateToLogin();

      // Mock OAuth error response
      await page.route('**/auth/v1/authorize*', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'OAuth provider error' })
        });
      });

      await authPage.loginWithGoogle();

      await authPage.waitForError();
      expect(await authPage.formError.textContent()).toContain('OAuth');
    });
  });

  test.describe('Password Reset Flow', () => {
    test('should send password reset email', async ({ page }) => {
      await authPage.navigateToForgotPassword();

      await authPage.resetPassword(TEST_EMAIL);

      await expect(authPage.successMessage).toBeVisible();
      expect(await authPage.successMessage.textContent()).toContain('email sent');
    });

    test('should validate email before sending reset', async ({ page }) => {
      await authPage.navigateToForgotPassword();

      await authPage.resetPassword('invalid-email');

      await authPage.expectValidationError('email');
    });

    test('should handle reset for non-existent email', async ({ page }) => {
      await authPage.navigateToForgotPassword();

      await authPage.resetPassword('nonexistent@tcwatch.test');

      // Should still show success for security reasons
      await expect(authPage.successMessage).toBeVisible();
    });

    test('should complete password reset with valid token', async ({ page }) => {
      // Navigate to reset password page with token
      const resetToken = 'mock-reset-token-123';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      const newPassword = 'NewPassword123!';
      await page.getByTestId('new-password-input').fill(newPassword);
      await page.getByTestId('confirm-new-password-input').fill(newPassword);
      await page.getByTestId('reset-password-submit').click();

      await expect(authPage.successMessage).toBeVisible();
      expect(await authPage.successMessage.textContent()).toContain('password updated');
    });
  });

  test.describe('Biometric Authentication Flow', () => {
    test('should prompt for biometric authentication when available', async ({ page, browserName }) => {
      // Skip on browsers that don't support WebAuthn
      test.skip(browserName === 'webkit', 'WebAuthn not supported in WebKit');

      await authPage.navigateToLogin();

      // First login to enable biometrics
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      // Sign out
      await authPage.signOut();

      // Try biometric login
      await authPage.navigateToLogin();
      await authPage.loginWithBiometrics();

      // Should prompt for biometric authentication
      // In real implementation, this would trigger browser's biometric prompt
      await expect(page.getByText(/biometric|fingerprint|face/i)).toBeVisible();
    });

    test('should fallback to password when biometrics fail', async ({ page }) => {
      await authPage.navigateToLogin();

      // Mock biometric failure
      await page.addInitScript(() => {
        (window as any).mockBiometricFailure = true;
      });

      await authPage.loginWithBiometrics();

      // Should show fallback options
      await expect(authPage.passwordInput).toBeVisible();
      await expect(page.getByText(/fallback|password/i)).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should sign out successfully', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      await authPage.signOut();

      // Should redirect to login page
      await expect(page).toHaveURL(/\/auth\/login/);

      // Should not be able to access protected content
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('should handle concurrent sessions', async ({ context }) => {
      // Create two browser tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      const authPage1 = new AuthPage(page1);
      const authPage2 = new AuthPage(page2);

      // Login in first tab
      await authPage1.navigateToLogin();
      await authPage1.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage1.waitForLoginSuccess();

      // Check if second tab also gets authenticated
      await page2.goto('/dashboard');
      await page2.waitForLoadState('networkidle');

      // Both tabs should be authenticated
      const dashboardPage1 = new DashboardPage(page1);
      const dashboardPage2 = new DashboardPage(page2);

      await dashboardPage1.expectUserLoggedIn(TEST_EMAIL);
      await dashboardPage2.expectUserLoggedIn(TEST_EMAIL);

      await page1.close();
      await page2.close();
    });

    test('should refresh session automatically', async ({ page }) => {
      await authPage.navigateToLogin();
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      // Mock token near expiration
      await page.addInitScript(() => {
        const originalFetch = window.fetch;
        window.fetch = async (url, options) => {
          const response = await originalFetch(url, options);

          // Mock 401 response for expired token
          if (response.status === 401) {
            // Trigger token refresh
            return originalFetch('/auth/refresh', { method: 'POST' });
          }

          return response;
        };
      });

      // Make an authenticated request
      await page.goto('/dashboard');

      // Should remain authenticated after refresh
      await dashboardPage.expectUserLoggedIn(TEST_EMAIL);
    });
  });

  test.describe('Deep Linking with Authentication', () => {
    test('should redirect to intended page after login', async ({ page }) => {
      // Try to access protected page directly
      await page.goto('/dashboard/profile');

      // Should redirect to login with return URL
      await expect(page).toHaveURL(/\/auth\/login.*returnTo/);

      // Login
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();

      // Should redirect to originally requested page
      await expect(page).toHaveURL(/\/dashboard\/profile/);
    });

    test('should handle authentication deep links', async ({ page }) => {
      // Simulate email verification link
      const verificationToken = 'mock-verification-token';
      await page.goto(`/auth/verify?token=${verificationToken}`);

      await expect(authPage.successMessage.or(page.getByText(/verified/i))).toBeVisible();
    });

    test('should handle password reset deep links', async ({ page }) => {
      const resetToken = 'mock-reset-token';
      await page.goto(`/auth/reset-password?token=${resetToken}`);

      // Should show password reset form
      await expect(page.getByTestId('new-password-input')).toBeVisible();
      await expect(page.getByTestId('reset-password-submit')).toBeVisible();
    });
  });

  test.describe('Multi-Device Authentication', () => {
    test('should sync authentication state across devices', async ({ context }) => {
      // Simulate different devices with different user agents
      const mobileContext = await context.browser()?.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      });

      const desktopPage = await context.newPage();
      const mobilePage = await mobileContext?.newPage();

      if (!mobilePage) return;

      const desktopAuth = new AuthPage(desktopPage);
      const mobileAuth = new AuthPage(mobilePage);

      // Login on desktop
      await desktopAuth.navigateToLogin();
      await desktopAuth.login(TEST_EMAIL, TEST_PASSWORD);
      await desktopAuth.waitForLoginSuccess();

      // Check mobile device authentication
      await mobilePage.goto('/dashboard');

      // Should require separate authentication on different device
      await expect(mobilePage).toHaveURL(/\/auth\/login/);

      await mobileContext?.close();
    });
  });

  test.describe('Error Recovery', () => {
    test('should recover from network errors during authentication', async ({ page }) => {
      await authPage.navigateToLogin();

      // Simulate network error
      await page.route('**/auth/**', route => {
        route.abort('failed');
      });

      await authPage.login(TEST_EMAIL, TEST_PASSWORD);

      // Should show network error
      await authPage.waitForError();

      // Remove network error simulation
      await page.unroute('**/auth/**');

      // Retry login
      await authPage.login(TEST_EMAIL, TEST_PASSWORD);
      await authPage.waitForLoginSuccess();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await authPage.navigateToLogin();

      // Mock server error
      await page.route('**/auth/signin', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      await authPage.login(TEST_EMAIL, TEST_PASSWORD);

      await authPage.waitForError();
      expect(await authPage.formError.textContent()).toContain('server error');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await authPage.navigateToLogin();

      // Tab through form elements
      await page.keyboard.press('Tab');
      await expect(authPage.emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(authPage.passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(authPage.loginButton).toBeFocused();

      // Submit with Enter
      await authPage.emailInput.fill(TEST_EMAIL);
      await authPage.passwordInput.fill(TEST_PASSWORD);
      await page.keyboard.press('Enter');

      await authPage.waitForLoginSuccess();
    });

    test('should announce errors to screen readers', async ({ page }) => {
      await authPage.navigateToLogin();

      await authPage.login('invalid-email', '');

      // Check for aria-live regions
      const errorRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
      await expect(errorRegion).toContainText(/error|invalid|required/i);
    });

    test('should have proper heading structure', async ({ page }) => {
      await authPage.navigateToLogin();

      // Check for proper heading hierarchy
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(/sign in|login/i);
    });
  });
});