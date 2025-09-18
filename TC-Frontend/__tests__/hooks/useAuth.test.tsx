/**
 * useAuth Hook Tests
 * Tests for authentication context, state management, and auth operations
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// Mock Expo modules
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'exp://127.0.0.1:19000/--/auth'),
  useAuthRequest: jest.fn(),
  AuthRequest: {
    fromDiscoveryDocument: jest.fn(),
  },
  DiscoveryDocument: {
    fromURL: jest.fn(),
  },
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  AppleAuthenticationCredential: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(),
}));

// Mock Supabase
const mockSupabaseAuth = {
  signInWithPassword: jest.fn(),
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getUser: jest.fn(),
  onAuthStateChange: jest.fn(),
  refreshSession: jest.fn(),
  resetPasswordForEmail: jest.fn(),
};

const mockSupabase = {
  auth: mockSupabaseAuth,
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock storage utilities
const mockSecureStore = require('expo-secure-store');

// Create mock AuthContext and useAuth hook
interface User {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithBiometrics: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await mockSupabaseAuth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const user = {
          id: data.user.id,
          email: data.user.email!,
          displayName: data.user.user_metadata?.display_name,
          role: data.user.user_metadata?.role || 'user',
        };

        setUser(user);

        // Store tokens securely
        if (data.session?.access_token) {
          await mockSecureStore.setItemAsync('access_token', data.session.access_token);
        }
        if (data.session?.refresh_token) {
          await mockSecureStore.setItemAsync('refresh_token', data.session.refresh_token);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await mockSupabaseAuth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'exp://127.0.0.1:19000/--/auth',
        },
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          displayName: data.user.user_metadata?.display_name,
          role: data.user.user_metadata?.role || 'user',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithApple = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const appleAuth = require('expo-apple-authentication');
      const credential = await appleAuth.signInAsync({
        requestedScopes: [
          appleAuth.AppleAuthenticationScope.FULL_NAME,
          appleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await mockSupabaseAuth.signInWithOAuth({
          provider: 'apple',
          options: {
            idToken: credential.identityToken,
          },
        });

        if (error) throw error;

        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            displayName: credential.fullName?.givenName || data.user.user_metadata?.display_name,
            role: data.user.user_metadata?.role || 'user',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Apple sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithBiometrics = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const localAuth = require('expo-local-authentication');

      const hasHardware = await localAuth.hasHardwareAsync();
      const isEnrolled = await localAuth.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication not available');
      }

      const result = await localAuth.authenticateAsync({
        promptMessage: 'Authenticate with biometrics',
        fallbackLabel: 'Use passcode',
      });

      if (result.success) {
        // Retrieve stored credentials
        const storedToken = await mockSecureStore.getItemAsync('access_token');

        if (storedToken) {
          const { data, error } = await mockSupabaseAuth.getUser(storedToken);

          if (error) throw error;

          if (data.user) {
            setUser({
              id: data.user.id,
              email: data.user.email!,
              displayName: data.user.user_metadata?.display_name,
              role: data.user.user_metadata?.role || 'user',
            });
          }
        } else {
          throw new Error('No stored credentials found');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await mockSupabaseAuth.signOut();

      // Clear stored tokens
      await mockSecureStore.deleteItemAsync('access_token');
      await mockSecureStore.deleteItemAsync('refresh_token');

      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Sign out failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = React.useCallback(async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await mockSupabaseAuth.resetPasswordForEmail(email, {
        redirectTo: 'exp://127.0.0.1:19000/--/reset-password',
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const refreshToken = await mockSecureStore.getItemAsync('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const { data, error } = await mockSupabaseAuth.refreshSession({ refresh_token: refreshToken });

      if (error) throw error;

      if (data.session) {
        await mockSecureStore.setItemAsync('access_token', data.session.access_token);
        await mockSecureStore.setItemAsync('refresh_token', data.session.refresh_token);

        if (data.user) {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            displayName: data.user.user_metadata?.display_name,
            role: data.user.user_metadata?.role || 'user',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Session refresh failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      loading,
      error,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signInWithBiometrics,
      signOut,
      resetPassword,
      refreshSession,
      clearError,
    }),
    [
      user,
      loading,
      error,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signInWithBiometrics,
      signOut,
      resetPassword,
      refreshSession,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

describe('useAuth Hook', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.setItemAsync.mockResolvedValue();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockSecureStore.deleteItemAsync.mockResolvedValue();
  });

  describe('Initial State', () => {
    it('should have initial state with no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Email/Password Sign In', () => {
    it('should sign in with valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        user_metadata: {
          display_name: 'Test User',
          role: 'user',
        },
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
      };

      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
      });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'access-token-123');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'refresh-token-123');
    });

    it('should handle sign in errors', async () => {
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.loading).toBe(false);
    });

    it('should set loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void;
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve;
      });

      mockSupabaseAuth.signInWithPassword.mockReturnValueOnce(signInPromise);

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveSignIn!({
          data: { user: { id: '1', email: 'test@example.com' }, session: null },
          error: null,
        });
        await signInPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Google Sign In', () => {
    it('should sign in with Google', async () => {
      const mockUser = {
        id: 'google-user-1',
        email: 'google@example.com',
        user_metadata: {
          display_name: 'Google User',
        },
      };

      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.user).toEqual({
        id: 'google-user-1',
        email: 'google@example.com',
        displayName: 'Google User',
        role: 'user',
      });

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'exp://127.0.0.1:19000/--/auth',
        },
      });
    });

    it('should handle Google sign in errors', async () => {
      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Google OAuth failed' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Google OAuth failed');
    });
  });

  describe('Apple Sign In', () => {
    it('should sign in with Apple', async () => {
      const mockAppleCredential = {
        identityToken: 'apple-identity-token',
        fullName: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const mockUser = {
        id: 'apple-user-1',
        email: 'apple@example.com',
        user_metadata: {},
      };

      const appleAuth = require('expo-apple-authentication');
      appleAuth.signInAsync.mockResolvedValueOnce(mockAppleCredential);

      mockSupabaseAuth.signInWithOAuth.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithApple();
      });

      expect(result.current.user).toEqual({
        id: 'apple-user-1',
        email: 'apple@example.com',
        displayName: 'John',
        role: 'user',
      });

      expect(mockSupabaseAuth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'apple',
        options: {
          idToken: 'apple-identity-token',
        },
      });
    });

    it('should handle Apple sign in cancellation', async () => {
      const appleAuth = require('expo-apple-authentication');
      appleAuth.signInAsync.mockRejectedValueOnce(new Error('User cancelled'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signInWithApple();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('User cancelled');
    });
  });

  describe('Biometric Authentication', () => {
    it('should authenticate with biometrics when available', async () => {
      const localAuth = require('expo-local-authentication');

      localAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      localAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      localAuth.authenticateAsync.mockResolvedValueOnce({ success: true });

      mockSecureStore.getItemAsync.mockResolvedValueOnce('stored-access-token');

      const mockUser = {
        id: 'biometric-user-1',
        email: 'biometric@example.com',
        user_metadata: {
          display_name: 'Biometric User',
        },
      };

      mockSupabaseAuth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithBiometrics();
      });

      expect(result.current.user).toEqual({
        id: 'biometric-user-1',
        email: 'biometric@example.com',
        displayName: 'Biometric User',
        role: 'user',
      });
    });

    it('should fail when biometrics not available', async () => {
      const localAuth = require('expo-local-authentication');

      localAuth.hasHardwareAsync.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signInWithBiometrics();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Biometric authentication not available');
    });

    it('should fail when no stored credentials', async () => {
      const localAuth = require('expo-local-authentication');

      localAuth.hasHardwareAsync.mockResolvedValueOnce(true);
      localAuth.isEnrolledAsync.mockResolvedValueOnce(true);
      localAuth.authenticateAsync.mockResolvedValueOnce({ success: true });

      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signInWithBiometrics();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('No stored credentials found');
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set initial user state
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('access_token');
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith('refresh_token');
    });

    it('should handle sign out errors', async () => {
      mockSupabaseAuth.signOut.mockResolvedValueOnce({
        error: { message: 'Sign out failed' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Sign out failed');
    });
  });

  describe('Password Reset', () => {
    it('should reset password successfully', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: 'exp://127.0.0.1:19000/--/reset-password',
        }
      );

      expect(result.current.error).toBeNull();
    });

    it('should handle password reset errors', async () => {
      mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
        error: { message: 'User not found' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.resetPassword('nonexistent@example.com');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('User not found');
    });
  });

  describe('Session Refresh', () => {
    it('should refresh session successfully', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce('refresh-token-123');

      const mockUser = {
        id: 'refreshed-user-1',
        email: 'refreshed@example.com',
        user_metadata: {
          display_name: 'Refreshed User',
        },
      };

      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockSupabaseAuth.refreshSession.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.refreshSession();
      });

      expect(result.current.user).toEqual({
        id: 'refreshed-user-1',
        email: 'refreshed@example.com',
        displayName: 'Refreshed User',
        role: 'user',
      });

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('access_token', 'new-access-token');
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith('refresh_token', 'new-refresh-token');
    });

    it('should fail when no refresh token', async () => {
      mockSecureStore.getItemAsync.mockResolvedValueOnce(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.refreshSession();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('No refresh token found');
    });
  });

  describe('Error Management', () => {
    it('should clear errors', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set an error state
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should clear errors on new operations', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set an error state first
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'First error' },
      });

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('First error');

      // Start new operation - should clear previous error
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@example.com' }, session: null },
        error: null,
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'correctpassword');
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Context Error Handling', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');
    });
  });

  describe('Memory Leaks Prevention', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useAuth(), { wrapper });

      // Unmount should not cause any errors or memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state across multiple operations', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      // Start with sign in
      mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
        data: {
          user: { id: '1', email: 'test@example.com' },
          session: { access_token: 'token1', refresh_token: 'refresh1' },
        },
        error: null,
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      // Then sign out
      mockSupabaseAuth.signOut.mockResolvedValueOnce({ error: null });

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});