import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuthStatus } from '../../hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component that protects routes based on authentication status
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo,
  fallback,
}) => {
  const { isAuthenticated, isInitialized, isLoading, status } = useAuthStatus();
  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (requireAuth && !isAuthenticated && !inAuthGroup) {
      // User is not authenticated and trying to access protected route
      router.replace(redirectTo || '/(auth)/login');
    } else if (!requireAuth && isAuthenticated && inAuthGroup) {
      // User is authenticated and trying to access auth routes
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, isLoading, segments, requireAuth, redirectTo]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return fallback || <AuthLoadingScreen />;
  }

  // If auth is required but user is not authenticated, show loading
  // (the redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return fallback || <AuthLoadingScreen />;
  }

  return <>{children}</>;
};

/**
 * Hook for protecting individual components or screens
 */
export const useAuthGuard = (requireAuth: boolean = true) => {
  const { isAuthenticated, isInitialized, isLoading } = useAuthStatus();

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (!requireAuth && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isInitialized, isLoading, requireAuth]);

  return {
    isAuthenticated,
    isInitialized,
    isLoading,
    canAccess: requireAuth ? isAuthenticated : !isAuthenticated,
  };
};

/**
 * HOC for protecting screens with authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireAuth?: boolean;
    redirectTo?: string;
    fallback?: React.ReactNode;
  } = {}
) {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    return (
      <AuthGuard
        requireAuth={options.requireAuth}
        redirectTo={options.redirectTo}
        fallback={options.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return AuthenticatedComponent;
}

/**
 * Default loading screen for authentication states
 */
const AuthLoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center">
      <View className="items-center">
        {/* App Logo */}
        <View className="w-20 h-20 bg-red-600 rounded-full items-center justify-center mb-6">
          <Text className="text-white text-2xl font-bold">TC</Text>
        </View>

        {/* Loading Indicator */}
        <ActivityIndicator size="large" color="#DC2626" />

        {/* Loading Text */}
        <Text className="text-gray-400 text-base mt-4">Loading...</Text>
      </View>
    </View>
  );
};

/**
 * Component for handling deep links with authentication
 */
export const DeepLinkHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuthStatus();

  useEffect(() => {
    if (!isInitialized) return;

    // Handle any deep link logic here
    // For example, storing the intended destination and redirecting after auth
  }, [isAuthenticated, isInitialized]);

  return <>{children}</>;
};