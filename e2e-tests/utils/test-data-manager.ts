import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

/**
 * Test Data Manager for E2E Tests
 * Handles creation, management, and cleanup of test data for end-to-end tests
 */

export class TestDataManager {
  private prisma: PrismaClient;
  private supabase: ReturnType<typeof createClient>;
  private createdUsers: string[] = [];
  private createdContent: string[] = [];
  private createdLists: string[] = [];

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
        }
      }
    });

    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY! // Use service key for admin operations
    );
  }

  /**
   * Create a test user with random data
   */
  createTestUser(overrides: any = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    return {
      id: `test-user-${timestamp}-${random}`,
      email: `test-${timestamp}-${random}@example.com`,
      password: 'TestPassword123!',
      displayName: `Test User ${random}`,
      fullName: `Test User ${random}`,
      privacyLevel: 'PRIVATE' as const,
      isActive: true,
      ...overrides
    };
  }

  /**
   * Create and persist a test user in the database
   */
  async createDatabaseUser(overrides: any = {}) {
    const userData = this.createTestUser(overrides);

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        display_name: userData.displayName,
        full_name: userData.fullName
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    // Create user profile in database
    const dbUser = await this.prisma.user.create({
      data: {
        id: authUser.user.id,
        email: userData.email,
        displayName: userData.displayName,
        fullName: userData.fullName,
        privacyLevel: userData.privacyLevel,
        isActive: userData.isActive
      }
    });

    this.createdUsers.push(dbUser.id);
    return { ...userData, id: dbUser.id, authUser: authUser.user };
  }

  /**
   * Create test content
   */
  async createTestContent(overrides: any = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    const contentData = {
      id: `test-content-${timestamp}-${random}`,
      title: `Test True Crime Documentary ${random}`,
      type: 'DOCUMENTARY' as const,
      trueCrimeType: 'DOCUMENTARY' as const,
      releaseYear: 2023,
      duration: 120,
      description: `A test documentary about true crime case ${random}`,
      posterUrl: `https://example.com/poster-${random}.jpg`,
      isActive: true,
      ...overrides
    };

    const content = await this.prisma.content.create({ data: contentData });
    this.createdContent.push(content.id);

    return content;
  }

  /**
   * Create test user content relationship
   */
  async createUserContent(userId: string, contentId: string, overrides: any = {}) {
    const userContentData = {
      userId,
      contentId,
      trackingState: 'WANT_TO_WATCH' as const,
      progress: 0,
      isComplete: false,
      ...overrides
    };

    return await this.prisma.userContent.create({ data: userContentData });
  }

  /**
   * Create test custom list
   */
  async createCustomList(userId: string, overrides: any = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    const listData = {
      id: `test-list-${timestamp}-${random}`,
      userId,
      title: `Test List ${random}`,
      description: `A test list created for E2E testing`,
      isPublic: false,
      ...overrides
    };

    const list = await this.prisma.customList.create({ data: listData });
    this.createdLists.push(list.id);

    return list;
  }

  /**
   * Setup authenticated user with session
   */
  async setupAuthenticatedUser(userData: any = {}) {
    const user = await this.createDatabaseUser(userData);

    // Create session for the user
    const { data: session, error } = await this.supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email
    });

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return {
      ...user,
      session: session.properties?.action_link
    };
  }

  /**
   * Setup user with viewing history
   */
  async setupUserWithViewingHistory() {
    const user = await this.setupAuthenticatedUser();

    // Create content and viewing history
    const documentaryContent = await this.createTestContent({
      type: 'DOCUMENTARY',
      trueCrimeType: 'DOCUMENTARY'
    });

    const seriesContent = await this.createTestContent({
      type: 'SERIES',
      trueCrimeType: 'SERIES'
    });

    const podcastContent = await this.createTestContent({
      type: 'PODCAST',
      trueCrimeType: 'PODCAST'
    });

    // Create user content relationships
    await this.createUserContent(user.id, documentaryContent.id, {
      trackingState: 'COMPLETED',
      isComplete: true,
      rating: 5
    });

    await this.createUserContent(user.id, seriesContent.id, {
      trackingState: 'WATCHING',
      progress: 240 // 4 hours watched
    });

    await this.createUserContent(user.id, podcastContent.id, {
      trackingState: 'WANT_TO_WATCH'
    });

    return user;
  }

  /**
   * Create test streaming availability data
   */
  async createStreamingAvailability(contentId: string, platforms: string[] = ['Netflix', 'Amazon Prime']) {
    const availabilityPromises = platforms.map(platform =>
      this.prisma.streamingAvailability.create({
        data: {
          contentId,
          platform,
          region: 'US',
          availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          streamingUrl: `https://${platform.toLowerCase().replace(' ', '')}.com/watch/${contentId}`
        }
      })
    );

    return await Promise.all(availabilityPromises);
  }

  /**
   * Create test criminal case data
   */
  async createTestCase(overrides: any = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);

    const caseData = {
      id: `test-case-${timestamp}-${random}`,
      title: `Test Criminal Case ${random}`,
      description: `A test criminal case for E2E testing`,
      location: 'Test City, Test State',
      year: 2020,
      status: 'SOLVED' as const,
      ...overrides
    };

    return await this.prisma.criminalCase.create({ data: caseData });
  }

  /**
   * Seed comprehensive test data
   */
  async seedTestData() {
    // Create test users
    const user1 = await this.setupUserWithViewingHistory();
    const user2 = await this.setupAuthenticatedUser({
      displayName: 'Jane Doe',
      email: 'jane@example.com'
    });

    // Create additional content
    const contents = await Promise.all([
      this.createTestContent({
        title: 'Making a Murderer',
        type: 'SERIES',
        trueCrimeType: 'SERIES'
      }),
      this.createTestContent({
        title: 'Serial Podcast',
        type: 'PODCAST',
        trueCrimeType: 'PODCAST'
      }),
      this.createTestContent({
        title: 'The Staircase',
        type: 'DOCUMENTARY',
        trueCrimeType: 'DOCUMENTARY'
      })
    ]);

    // Create streaming availability
    for (const content of contents) {
      await this.createStreamingAvailability(content.id);
    }

    // Create test cases and link to content
    const testCase = await this.createTestCase({
      title: 'Steven Avery Case'
    });

    await this.prisma.contentCase.create({
      data: {
        contentId: contents[0].id,
        caseId: testCase.id
      }
    });

    // Create custom lists
    const publicList = await this.createCustomList(user1.id, {
      title: 'Best True Crime Documentaries',
      isPublic: true
    });

    // Add items to list
    await this.prisma.customListItem.createMany({
      data: contents.slice(0, 2).map((content, index) => ({
        listId: publicList.id,
        contentId: content.id,
        order: index + 1
      }))
    });

    return {
      users: [user1, user2],
      contents,
      case: testCase,
      list: publicList
    };
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData() {
    try {
      // Clean database records in correct order
      await this.prisma.$transaction([
        this.prisma.customListItem.deleteMany({
          where: { listId: { in: this.createdLists } }
        }),
        this.prisma.customList.deleteMany({
          where: { id: { in: this.createdLists } }
        }),
        this.prisma.episodeProgress.deleteMany({
          where: { userContent: { userId: { in: this.createdUsers } } }
        }),
        this.prisma.userContent.deleteMany({
          where: { userId: { in: this.createdUsers } }
        }),
        this.prisma.streamingAvailability.deleteMany({
          where: { contentId: { in: this.createdContent } }
        }),
        this.prisma.contentCase.deleteMany({
          where: { contentId: { in: this.createdContent } }
        }),
        this.prisma.content.deleteMany({
          where: { id: { in: this.createdContent } }
        }),
        this.prisma.notification.deleteMany({
          where: { userId: { in: this.createdUsers } }
        }),
        this.prisma.socialActivity.deleteMany({
          where: { userId: { in: this.createdUsers } }
        }),
        this.prisma.friendship.deleteMany({
          where: {
            OR: [
              { userId: { in: this.createdUsers } },
              { friendId: { in: this.createdUsers } }
            ]
          }
        }),
        this.prisma.user.deleteMany({
          where: { id: { in: this.createdUsers } }
        })
      ]);

      // Clean up Supabase Auth users
      for (const userId of this.createdUsers) {
        try {
          await this.supabase.auth.admin.deleteUser(userId);
        } catch (error) {
          console.warn(`Failed to delete auth user ${userId}:`, error);
        }
      }

      // Reset tracking arrays
      this.createdUsers = [];
      this.createdContent = [];
      this.createdLists = [];

    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  }

  /**
   * Get test user credentials for login
   */
  getTestCredentials(userType: 'basic' | 'premium' | 'admin' = 'basic') {
    const credentials = {
      basic: {
        email: 'test.user@example.com',
        password: 'TestPassword123!'
      },
      premium: {
        email: 'premium.user@example.com',
        password: 'PremiumPassword123!'
      },
      admin: {
        email: 'admin.user@example.com',
        password: 'AdminPassword123!'
      }
    };

    return credentials[userType];
  }

  /**
   * Wait for data consistency (useful after mutations)
   */
  async waitForDataConsistency(timeout: number = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        // Simple query to check database connectivity
        await this.prisma.user.findFirst();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error('Database not ready within timeout');
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}