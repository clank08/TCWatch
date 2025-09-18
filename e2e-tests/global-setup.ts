import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Setup test database and environment
  if (process.env.CI) {
    console.log('Running in CI environment');
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  }

  // Create a browser instance for authentication setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Setup authentication state for tests
    console.log('Setting up authentication state...');

    // Navigate to the login page
    await page.goto('/login');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Perform login with test credentials
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // Wait for successful login
    await page.waitForURL('/dashboard');

    // Save authenticated state
    await context.storageState({ path: 'auth-state.json' });

    console.log('✅ Authentication state saved');
  } catch (error) {
    console.warn('⚠️ Could not setup authentication state:', error);
    // Continue without authentication for tests that don't require it
  } finally {
    await browser.close();
  }

  console.log('✅ E2E test setup completed');
}

export default globalSetup;