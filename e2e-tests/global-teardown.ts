import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...');

  try {
    // Clean up authentication state file
    const authStatePath = path.join(__dirname, 'auth-state.json');
    try {
      await fs.unlink(authStatePath);
      console.log('✅ Authentication state file cleaned up');
    } catch (error) {
      // File might not exist, which is fine
    }

    // Clean up test artifacts
    const testResultsPath = path.join(__dirname, 'test-results');
    try {
      await fs.rmdir(testResultsPath, { recursive: true });
      console.log('✅ Test results directory cleaned up');
    } catch (error) {
      // Directory might not exist, which is fine
    }

    // Database cleanup for test environment
    if (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
      console.log('🗄️ Cleaning up test database...');

      // Import and use Prisma for cleanup
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: process.env.TEST_DATABASE_URL
            }
          }
        });

        // Clean up test data
        await prisma.$transaction([
          prisma.episodeProgress.deleteMany(),
          prisma.userContent.deleteMany(),
          prisma.customListItem.deleteMany(),
          prisma.customList.deleteMany(),
          prisma.content.deleteMany(),
          prisma.user.deleteMany()
        ]);

        await prisma.$disconnect();
        console.log('✅ Test database cleaned up');
      } catch (error) {
        console.warn('⚠️ Could not clean up test database:', error);
      }
    }

    console.log('✅ E2E test teardown completed');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
  }
}

export default globalTeardown;