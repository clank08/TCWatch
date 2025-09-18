// Supabase Auth Providers Configuration Service
import { createClient, SupabaseClient, Provider } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';

export interface AuthProvider {
  name: string;
  displayName: string;
  enabled: boolean;
  config?: Record<string, any>;
}

export interface SocialAuthResponse {
  provider: string;
  url?: string;
  user?: any;
  session?: any;
  error?: string;
}

export class AuthProvidersService {
  private supabase: SupabaseClient;
  private enabledProviders: Set<Provider>;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Configure enabled providers based on environment variables
    this.enabledProviders = new Set();

    // Email/password is always enabled
    this.enabledProviders.add('email' as Provider);

    // Add social providers if configured
    if (process.env.SUPABASE_GOOGLE_CLIENT_ID) {
      this.enabledProviders.add('google');
    }

    if (process.env.SUPABASE_APPLE_CLIENT_ID) {
      this.enabledProviders.add('apple');
    }

    // Add other providers as needed
    if (process.env.SUPABASE_GITHUB_CLIENT_ID) {
      this.enabledProviders.add('github');
    }

    if (process.env.SUPABASE_FACEBOOK_CLIENT_ID) {
      this.enabledProviders.add('facebook');
    }

    if (process.env.SUPABASE_TWITTER_CLIENT_ID) {
      this.enabledProviders.add('twitter');
    }
  }

  /**
   * Get list of available auth providers
   */
  getAvailableProviders(): AuthProvider[] {
    const providers: AuthProvider[] = [
      {
        name: 'email',
        displayName: 'Email',
        enabled: true,
      },
      {
        name: 'google',
        displayName: 'Google',
        enabled: this.enabledProviders.has('google'),
        config: {
          scopes: 'email profile',
        },
      },
      {
        name: 'apple',
        displayName: 'Apple',
        enabled: this.enabledProviders.has('apple'),
        config: {
          scopes: 'email name',
        },
      },
      {
        name: 'github',
        displayName: 'GitHub',
        enabled: this.enabledProviders.has('github'),
        config: {
          scopes: 'user:email',
        },
      },
      {
        name: 'facebook',
        displayName: 'Facebook',
        enabled: this.enabledProviders.has('facebook'),
        config: {
          scopes: 'email',
        },
      },
      {
        name: 'twitter',
        displayName: 'Twitter',
        enabled: this.enabledProviders.has('twitter'),
        config: {
          scopes: 'tweet.read users.read',
        },
      },
    ];

    return providers.filter(provider => provider.enabled);
  }

  /**
   * Initialize OAuth flow with social provider
   */
  async signInWithProvider(
    provider: Provider,
    redirectTo?: string,
    options?: {
      queryParams?: Record<string, string>;
      scopes?: string;
    }
  ): Promise<SocialAuthResponse> {
    try {
      if (!this.enabledProviders.has(provider)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Provider ${provider} is not enabled`,
        });
      }

      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectTo || `${process.env.EXPO_PUBLIC_API_URL}/auth/callback`,
          queryParams: options?.queryParams,
          scopes: options?.scopes,
        },
      });

      if (error) {
        return {
          provider,
          error: error.message,
        };
      }

      return {
        provider,
        url: data.url,
      };
    } catch (error) {
      return {
        provider,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Handle OAuth callback and exchange code for session
   */
  async handleOAuthCallback(
    code: string,
    codeVerifier?: string
  ): Promise<SocialAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return {
          provider: 'oauth',
          error: error.message,
        };
      }

      return {
        provider: 'oauth',
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        provider: 'oauth',
        error: error instanceof Error ? error.message : 'OAuth callback failed',
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmail(
    email: string,
    password: string,
    options?: {
      captchaToken?: string;
    }
  ): Promise<SocialAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: options?.captchaToken,
        },
      });

      if (error) {
        return {
          provider: 'email',
          error: error.message,
        };
      }

      return {
        provider: 'email',
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        provider: 'email',
        error: error instanceof Error ? error.message : 'Email sign in failed',
      };
    }
  }

  /**
   * Sign up with email and password
   */
  async signUpWithEmail(
    email: string,
    password: string,
    options?: {
      data?: Record<string, any>;
      captchaToken?: string;
      emailRedirectTo?: string;
    }
  ): Promise<SocialAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data,
          captchaToken: options?.captchaToken,
          emailRedirectTo: options?.emailRedirectTo,
        },
      });

      if (error) {
        return {
          provider: 'email',
          error: error.message,
        };
      }

      return {
        provider: 'email',
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        provider: 'email',
        error: error instanceof Error ? error.message : 'Email sign up failed',
      };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(
    email: string,
    redirectTo?: string,
    captchaToken?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || `${process.env.EXPO_PUBLIC_API_URL}/auth/reset-password`,
        captchaToken,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  /**
   * Update password (requires current session)
   */
  async updatePassword(
    newPassword: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Set the session first
      const { error: sessionError } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // We'll get this from the existing session
      });

      if (sessionError) {
        return {
          success: false,
          error: sessionError.message,
        };
      }

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password update failed',
      };
    }
  }

  /**
   * Send email confirmation
   */
  async resendConfirmation(
    email: string,
    type: 'signup' | 'email_change' = 'signup',
    redirectTo?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.auth.resend({
        type,
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email confirmation failed',
      };
    }
  }

  /**
   * Verify email confirmation token
   */
  async verifyOtp(
    email: string,
    token: string,
    type: 'signup' | 'email_change' | 'recovery' | 'invite' = 'signup'
  ): Promise<SocialAuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        email,
        token,
        type,
      });

      if (error) {
        return {
          provider: 'email',
          error: error.message,
        };
      }

      return {
        provider: 'email',
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        provider: 'email',
        error: error instanceof Error ? error.message : 'OTP verification failed',
      };
    }
  }

  /**
   * Check if provider is enabled
   */
  isProviderEnabled(provider: Provider): boolean {
    return this.enabledProviders.has(provider);
  }

  /**
   * Get provider configuration for frontend
   */
  getProviderConfig(provider: Provider): Record<string, any> | null {
    const providerConfigs = {
      google: {
        client_id: process.env.SUPABASE_GOOGLE_CLIENT_ID,
        scopes: 'email profile',
      },
      apple: {
        client_id: process.env.SUPABASE_APPLE_CLIENT_ID,
        scopes: 'email name',
      },
      github: {
        client_id: process.env.SUPABASE_GITHUB_CLIENT_ID,
        scopes: 'user:email',
      },
      facebook: {
        client_id: process.env.SUPABASE_FACEBOOK_CLIENT_ID,
        scopes: 'email',
      },
      twitter: {
        client_id: process.env.SUPABASE_TWITTER_CLIENT_ID,
        scopes: 'tweet.read users.read',
      },
    };

    return providerConfigs[provider] || null;
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!process.env.SUPABASE_URL) {
      issues.push('SUPABASE_URL is not configured');
    }

    if (!process.env.SUPABASE_ANON_KEY) {
      issues.push('SUPABASE_ANON_KEY is not configured');
    }

    // Check social provider configurations
    const socialProviders = [
      { name: 'Google', envVar: 'SUPABASE_GOOGLE_CLIENT_ID' },
      { name: 'Apple', envVar: 'SUPABASE_APPLE_CLIENT_ID' },
      { name: 'GitHub', envVar: 'SUPABASE_GITHUB_CLIENT_ID' },
      { name: 'Facebook', envVar: 'SUPABASE_FACEBOOK_CLIENT_ID' },
      { name: 'Twitter', envVar: 'SUPABASE_TWITTER_CLIENT_ID' },
    ];

    const enabledCount = socialProviders.filter(provider =>
      process.env[provider.envVar]
    ).length;

    if (enabledCount === 0) {
      issues.push('No social auth providers configured (optional but recommended)');
    }

    return {
      valid: issues.length === 0 || issues.length === 1, // Allow missing social providers
      issues,
    };
  }
}