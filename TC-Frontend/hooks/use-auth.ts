import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';
import type { User, UserPreferences } from '../stores/auth-store';

/**
 * Hook for authentication state and actions
 */
export const useAuth = () => {
  const store = useAuthStore();

  // Initialize auth on first use
  useEffect(() => {
    if (!store.isInitialized) {
      store.restoreSession();
    }
  }, [store.isInitialized, store.restoreSession]);

  return {
    // State
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    error: store.error,
    isInitialized: store.isInitialized,

    // Actions
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    signInWithGoogle: store.signInWithGoogle,
    signInWithApple: store.signInWithApple,
    refreshSession: store.refreshSession,
    updateUser: store.updateUser,
    updatePreferences: store.updatePreferences,
    requestPasswordReset: store.requestPasswordReset,
    resetPassword: store.resetPassword,
    clearError: store.clearError,
  };
};

/**
 * Hook for user profile data and updates
 */
export const useUser = () => {
  const { user, updateUser, isLoading } = useAuth();

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    await updateUser(updates);
  };

  return {
    user,
    updateProfile,
    isLoading,
    isLoggedIn: !!user,
  };
};

/**
 * Hook for user preferences management
 */
export const useUserPreferences = () => {
  const { user, updatePreferences, isLoading } = useAuth();

  const preferences = user?.preferences || {
    notifications_enabled: true,
    biometric_enabled: false,
    content_warnings: true,
    privacy_level: 'private' as const,
    digest_frequency: 'weekly' as const,
  };

  const updatePrefs = async (updates: Partial<UserPreferences>) => {
    if (!user) throw new Error('No user logged in');
    await updatePreferences(updates);
  };

  return {
    preferences,
    updatePreferences: updatePrefs,
    isLoading,
  };
};

/**
 * Hook for authentication guard - redirects if not authenticated
 */
export const useAuthGuard = (redirectTo?: string) => {
  const { isAuthenticated, isInitialized, isLoading } = useAuth();

  useEffect(() => {
    if (isInitialized && !isAuthenticated && !isLoading) {
      // TODO: Implement navigation redirect
      console.log('User not authenticated, should redirect to:', redirectTo || '/login');
    }
  }, [isAuthenticated, isInitialized, isLoading, redirectTo]);

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    canAccess: isAuthenticated && isInitialized,
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { session, refreshSession, signOut } = useAuth();

  const isSessionValid = () => {
    if (!session) return false;
    return session.expires_at > Date.now();
  };

  const getTimeUntilExpiry = () => {
    if (!session) return 0;
    return Math.max(0, session.expires_at - Date.now());
  };

  const handleSessionExpiry = async () => {
    try {
      await refreshSession();
    } catch (error) {
      // If refresh fails, sign out
      await signOut();
    }
  };

  return {
    session,
    isSessionValid: isSessionValid(),
    timeUntilExpiry: getTimeUntilExpiry(),
    refreshSession,
    handleSessionExpiry,
  };
};

/**
 * Hook for password management
 */
export const usePasswordManagement = () => {
  const { requestPasswordReset, resetPassword, isLoading, error, clearError } = useAuth();

  return {
    requestPasswordReset,
    resetPassword,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for social authentication
 */
export const useSocialAuth = () => {
  const { signInWithGoogle, signInWithApple, isLoading, error, clearError } = useAuth();

  return {
    signInWithGoogle,
    signInWithApple,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for checking authentication status without triggering auth flows
 */
export const useAuthStatus = () => {
  const {
    isAuthenticated,
    isInitialized,
    isLoading,
    user,
    error,
  } = useAuthStore();

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    hasUser: !!user,
    hasError: !!error,
    status: isLoading
      ? 'loading'
      : !isInitialized
      ? 'initializing'
      : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated',
  } as const;
};