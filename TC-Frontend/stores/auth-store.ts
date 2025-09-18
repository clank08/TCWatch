import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications_enabled: boolean;
  biometric_enabled: boolean;
  content_warnings: boolean;
  privacy_level: 'private' | 'friends' | 'public';
  digest_frequency: 'daily' | 'weekly' | 'never';
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface AuthActions {
  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;

  // Session management
  refreshSession: () => Promise<void>;
  restoreSession: () => Promise<void>;

  // User management
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;

  // Password management
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // State management
  setUser: (user: User | null) => void;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
}

type AuthStore = AuthState & AuthActions;

// Secure storage keys
const STORAGE_KEYS = {
  SESSION: 'tcwatch_session',
  USER: 'tcwatch_user',
  BIOMETRIC_ENABLED: 'tcwatch_biometric_enabled',
} as const;

// Helper functions for secure storage
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // For web, use localStorage (less secure but functional)
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const useAuthStore = create<AuthStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    session: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
    isInitialized: false,

    // Authentication actions
    signIn: async (email: string, password: string) => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Replace with actual Supabase auth call
        const mockResponse = {
          user: {
            id: '1',
            email,
            name: 'Test User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          session: {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expires_at: Date.now() + 3600000, // 1 hour
          },
        };

        // Store session securely
        await secureStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify(mockResponse.session)
        );
        await secureStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(mockResponse.user)
        );

        set({
          user: mockResponse.user,
          session: mockResponse.session,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Sign in failed',
          isLoading: false,
        });
      }
    },

    signUp: async (email: string, password: string, name?: string) => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Replace with actual Supabase auth call
        const mockResponse = {
          user: {
            id: '1',
            email,
            name: name || 'New User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            preferences: {
              notifications_enabled: true,
              biometric_enabled: false,
              content_warnings: true,
              privacy_level: 'private' as const,
              digest_frequency: 'weekly' as const,
            },
          },
          session: {
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expires_at: Date.now() + 3600000,
          },
        };

        await secureStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify(mockResponse.session)
        );
        await secureStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(mockResponse.user)
        );

        set({
          user: mockResponse.user,
          session: mockResponse.session,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Sign up failed',
          isLoading: false,
        });
      }
    },

    signOut: async () => {
      set({ isLoading: true });

      try {
        // TODO: Call Supabase sign out

        // Clear secure storage
        await secureStorage.removeItem(STORAGE_KEYS.SESSION);
        await secureStorage.removeItem(STORAGE_KEYS.USER);

        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Sign out failed',
          isLoading: false,
        });
      }
    },

    signInWithGoogle: async () => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Implement Google OAuth with expo-auth-session
        throw new Error('Google sign-in not implemented yet');
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Google sign-in failed',
          isLoading: false,
        });
      }
    },

    signInWithApple: async () => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Implement Apple OAuth with expo-apple-authentication
        throw new Error('Apple sign-in not implemented yet');
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Apple sign-in failed',
          isLoading: false,
        });
      }
    },

    refreshSession: async () => {
      const { session } = get();
      if (!session?.refresh_token) return;

      try {
        // TODO: Call Supabase refresh session
        // For now, extend the mock session
        const newSession = {
          ...session,
          expires_at: Date.now() + 3600000,
        };

        await secureStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify(newSession)
        );

        set({ session: newSession });
      } catch (error) {
        // If refresh fails, sign out
        get().signOut();
      }
    },

    restoreSession: async () => {
      set({ isLoading: true });

      try {
        const [sessionData, userData] = await Promise.all([
          secureStorage.getItem(STORAGE_KEYS.SESSION),
          secureStorage.getItem(STORAGE_KEYS.USER),
        ]);

        if (sessionData && userData) {
          const session = JSON.parse(sessionData) as AuthSession;
          const user = JSON.parse(userData) as User;

          // Check if session is still valid
          if (session.expires_at > Date.now()) {
            set({
              user,
              session,
              isAuthenticated: true,
            });
          } else {
            // Session expired, try to refresh
            set({ session });
            await get().refreshSession();
          }
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear corrupted data
        await secureStorage.removeItem(STORAGE_KEYS.SESSION);
        await secureStorage.removeItem(STORAGE_KEYS.USER);
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    },

    updateUser: async (updates: Partial<User>) => {
      const { user } = get();
      if (!user) return;

      set({ isLoading: true });

      try {
        // TODO: Call API to update user
        const updatedUser = { ...user, ...updates, updated_at: new Date().toISOString() };

        await secureStorage.setItem(
          STORAGE_KEYS.USER,
          JSON.stringify(updatedUser)
        );

        set({ user: updatedUser, isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Update failed',
          isLoading: false,
        });
      }
    },

    updatePreferences: async (preferences: Partial<UserPreferences>) => {
      const { user } = get();
      if (!user) return;

      const updatedPreferences = { ...user.preferences, ...preferences };
      await get().updateUser({ preferences: updatedPreferences });
    },

    requestPasswordReset: async (email: string) => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Call Supabase password reset
        console.log('Password reset requested for:', email);
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Password reset failed',
          isLoading: false,
        });
      }
    },

    resetPassword: async (token: string, newPassword: string) => {
      set({ isLoading: true, error: null });

      try {
        // TODO: Call Supabase password update
        console.log('Password reset with token:', token);
        set({ isLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Password reset failed',
          isLoading: false,
        });
      }
    },

    // State management helpers
    setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
    setSession: (session: AuthSession | null) => set({ session }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
    setInitialized: (isInitialized: boolean) => set({ isInitialized }),
  }))
);

// Auto-refresh session when it's about to expire
useAuthStore.subscribe(
  (state) => state.session,
  (session) => {
    if (session && session.expires_at) {
      const timeUntilExpiry = session.expires_at - Date.now();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes

      if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThreshold) {
        useAuthStore.getState().refreshSession();
      }
    }
  }
);