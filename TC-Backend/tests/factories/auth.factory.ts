/**
 * Authentication Test Factory
 * Provides test data factories for authentication-related tests
 */

import { PrismaClient } from '@prisma/client';
import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';

export interface TestUser {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export interface TestUserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  interests: string[];
  privacySettings: Record<string, any>;
  notificationSettings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockJWTPayload {
  sub: string;
  email: string;
  role?: string;
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  user_metadata?: Record<string, any>;
}

export interface AuthTestSession {
  accessToken: string;
  refreshToken: string;
  user: TestUser;
  userProfile: TestUserProfile;
  expiresAt: Date;
}

/**
 * Factory for creating test users with consistent data
 */
export class AuthTestFactory {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a test user with optional overrides
   */
  async createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      displayName: faker.person.fullName(),
      role: 'user',
      isActive: true,
      ...overrides,
    };

    // Create user in database
    await this.prisma.user.create({
      data: {
        id: defaultUser.id,
        email: defaultUser.email,
        displayName: defaultUser.displayName,
        fullName: defaultUser.displayName,
        privacyLevel: 'PRIVATE',
        isActive: defaultUser.isActive,
      },
    });

    return defaultUser;
  }

  /**
   * Create a test user profile
   */
  async createTestUserProfile(
    userId: string,
    overrides: Partial<Omit<TestUserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {}
  ): Promise<TestUserProfile> {
    const defaultProfile = {
      displayName: faker.person.fullName(),
      avatarUrl: faker.image.avatar(),
      interests: faker.helpers.arrayElements(['murder', 'conspiracy', 'cold-case', 'serial-killer'], { min: 1, max: 3 }),
      privacySettings: {
        profile_visible: true,
        activity_visible: true,
        allow_friend_requests: true,
      },
      notificationSettings: {
        push_enabled: true,
        email_enabled: true,
        new_content_alerts: true,
        friend_activity: true,
        weekly_digest: true,
        cable_reminders: true,
      },
      ...overrides,
    };

    const userProfile = await this.prisma.userProfile.create({
      data: {
        userId,
        ...defaultProfile,
      },
    });

    return userProfile;
  }

  /**
   * Create a test admin user
   */
  async createTestAdminUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return this.createTestUser({
      role: 'admin',
      email: 'admin@tcwatch.test',
      displayName: 'Test Admin',
      ...overrides,
    });
  }

  /**
   * Create multiple test users
   */
  async createTestUsers(count: number, overrides: Partial<TestUser> = {}): Promise<TestUser[]> {
    const users: TestUser[] = [];

    for (let i = 0; i < count; i++) {
      const user = await this.createTestUser({
        email: `user${i}@tcwatch.test`,
        displayName: `Test User ${i}`,
        ...overrides,
      });
      users.push(user);
    }

    return users;
  }

  /**
   * Create a complete auth session (user + profile)
   */
  async createCompleteAuthSession(overrides: Partial<TestUser> = {}): Promise<AuthTestSession> {
    const user = await this.createTestUser(overrides);
    const userProfile = await this.createTestUserProfile(user.id);

    const accessToken = this.generateMockJWT(user);
    const refreshToken = this.generateMockRefreshToken(user);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return {
      accessToken,
      refreshToken,
      user,
      userProfile,
      expiresAt,
    };
  }

  /**
   * Generate a mock JWT token for testing
   */
  generateMockJWT(user: TestUser, expiresIn: string = '1h'): string {
    const payload: MockJWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (expiresIn === '1h' ? 3600 : 300),
      iat: Math.floor(Date.now() / 1000),
      iss: 'https://test.supabase.co/auth/v1',
      user_metadata: {
        role: user.role,
        display_name: user.displayName,
      },
    };

    return jwt.sign(payload, 'test-secret-key', { algorithm: 'HS256' });
  }

  /**
   * Generate a mock refresh token
   */
  generateMockRefreshToken(user: TestUser): string {
    return `refresh_token_${user.id}_${Date.now()}`;
  }

  /**
   * Generate an expired JWT token for testing
   */
  generateExpiredJWT(user: TestUser): string {
    const payload: MockJWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      iat: Math.floor(Date.now() / 1000) - 7200, // Issued 2 hours ago
      iss: 'https://test.supabase.co/auth/v1',
    };

    return jwt.sign(payload, 'test-secret-key', { algorithm: 'HS256' });
  }

  /**
   * Generate a malformed JWT token for testing
   */
  generateMalformedJWT(): string {
    return 'invalid.jwt.token';
  }

  /**
   * Create mock Supabase user response
   */
  createMockSupabaseUser(user: TestUser): SupabaseUser {
    return {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: new Date().toISOString(),
      phone: null,
      confirmed_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        role: user.role,
        display_name: user.displayName,
      },
      identities: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Create authorization header for requests
   */
  createAuthHeader(token: string): { authorization: string } {
    return {
      authorization: `Bearer ${token}`,
    };
  }

  /**
   * Create invalid authorization headers for testing
   */
  createInvalidAuthHeaders(): Array<{ authorization?: string }> {
    return [
      { authorization: 'Bearer invalid-token' },
      { authorization: 'InvalidFormat token' },
      { authorization: 'Bearer ' },
      { authorization: '' },
      {}, // No authorization header
    ];
  }

  /**
   * Clean up test data
   */
  async cleanup(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userContent.deleteMany(),
      this.prisma.episodeProgress.deleteMany(),
      this.prisma.customList.deleteMany(),
      this.prisma.userProfile.deleteMany(),
      this.prisma.user.deleteMany(),
    ]);
  }
}

/**
 * Rate limiting test helpers
 */
export class RateLimitTestHelper {
  /**
   * Generate multiple requests to test rate limiting
   */
  static async generateRapidRequests(
    requestFn: () => Promise<any>,
    count: number,
    delay: number = 0
  ): Promise<Array<{ success: boolean; error?: any; response?: any }>> {
    const requests: Promise<{ success: boolean; error?: any; response?: any }>[] = [];

    for (let i = 0; i < count; i++) {
      if (delay > 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const request = requestFn()
        .then(response => ({ success: true, response }))
        .catch(error => ({ success: false, error }));

      requests.push(request);
    }

    return Promise.all(requests);
  }

  /**
   * Test rate limiting with different IP addresses
   */
  static createRateLimitTestCases(): Array<{ ip: string; userAgent: string; expected: 'pass' | 'block' }> {
    return [
      { ip: '192.168.1.1', userAgent: 'TestAgent/1.0', expected: 'pass' },
      { ip: '192.168.1.2', userAgent: 'TestAgent/1.0', expected: 'pass' },
      { ip: '10.0.0.1', userAgent: 'BotAgent/2.0', expected: 'block' },
      { ip: '127.0.0.1', userAgent: 'LocalAgent/1.0', expected: 'pass' },
    ];
  }
}

/**
 * Security test helpers
 */
export class SecurityTestHelper {
  /**
   * Generate SQL injection test payloads
   */
  static getSQLInjectionPayloads(): string[] {
    return [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
      "') OR '1'='1--",
      "1' OR '1'='1",
    ];
  }

  /**
   * Generate XSS test payloads
   */
  static getXSSPayloads(): string[] {
    return [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'XSS\')" />',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')" />',
      '"><script>alert("XSS")</script>',
      "'><script>alert('XSS')</script>",
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    ];
  }

  /**
   * Generate JWT manipulation test cases
   */
  static getJWTManipulationTestCases(): Array<{ token: string; description: string }> {
    return [
      {
        token: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.',
        description: 'JWT with "none" algorithm'
      },
      {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.modified',
        description: 'JWT with modified signature'
      },
      {
        token: 'invalid.jwt.format',
        description: 'Malformed JWT'
      },
      {
        token: '',
        description: 'Empty token'
      },
    ];
  }

  /**
   * Generate session hijacking test scenarios
   */
  static getSessionHijackingTestCases(): Array<{ scenario: string; headers: Record<string, string> }> {
    return [
      {
        scenario: 'Different User-Agent',
        headers: {
          'User-Agent': 'AttackerBrowser/1.0',
          'X-Forwarded-For': '192.168.1.100',
        },
      },
      {
        scenario: 'Different IP Address',
        headers: {
          'X-Real-IP': '10.0.0.100',
          'X-Forwarded-For': '10.0.0.100',
        },
      },
      {
        scenario: 'Suspicious Headers',
        headers: {
          'X-Forwarded-For': '127.0.0.1, 192.168.1.100',
          'X-Originating-IP': '192.168.1.100',
        },
      },
    ];
  }
}

export default AuthTestFactory;