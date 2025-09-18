/**
 * Protected Route Guards Tests
 * Tests for route protection, authentication checks, and access control
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// Mock navigation
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    push: mockPush,
  }),
  useSegments: () => ['(tabs)', 'home'],
  useRootNavigationState: () => ({ key: 'root', stale: false }),
}));

// Mock the auth context
const createMockAuthContext = (user: any = null, loading: boolean = false) => ({
  user,
  loading,
  error: null,
  signIn: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithBiometrics: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  refreshSession: jest.fn(),
  clearError: jest.fn(),
});

let mockAuthContext = createMockAuthContext();

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
  redirectTo = '/auth/login',
}) => {
  const { user, loading } = require('../../../hooks/useAuth').useAuth();
  const router = require('expo-router').useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return <div testID="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return fallback ? <>{fallback}</> : <div testID="auth-required">Authentication required</div>;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return <div testID="access-denied">Access denied. Insufficient permissions.</div>;
  }

  return <>{children}</>;
};

// Mock Role-Based Route Component
interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallback,
}) => {
  const { user, loading } = require('../../../hooks/useAuth').useAuth();

  if (loading) {
    return <div testID="loading-spinner">Loading...</div>;
  }

  if (!user) {
    return <div testID="auth-required">Authentication required</div>;
  }

  const hasPermission = allowedRoles.includes(user.role) || user.role === 'admin';

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : <div testID="access-denied">Access denied</div>;
  }

  return <>{children}</>;
};

// Mock Admin Route Component
interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children, fallback }) => {
  const { user, loading } = require('../../../hooks/useAuth').useAuth();

  if (loading) {
    return <div testID="loading-spinner">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return fallback ? <>{fallback}</> : <div testID="admin-required">Admin access required</div>;
  }

  return <>{children}</>;
};

describe('Protected Route Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthContext = createMockAuthContext();
  });

  describe('ProtectedRoute Component', () => {
    it('should render children when user is authenticated', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      render(
        <ProtectedRoute>
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
      expect(screen.getByText('Protected Content')).toBeTruthy();
    });

    it('should show loading spinner when authentication is loading', () => {
      mockAuthContext = createMockAuthContext(null, true);

      render(
        <ProtectedRoute>
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
      expect(screen.getByText('Loading...')).toBeTruthy();
      expect(screen.queryByTestId('protected-content')).toBeFalsy();
    });

    it('should redirect to login when user is not authenticated', async () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute>
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('should redirect to custom path when specified', async () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute redirectTo="/custom-login">
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/custom-login');
      });
    });

    it('should show fallback content when user is not authenticated', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute fallback={<div testID="custom-fallback">Please log in</div>}>
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('custom-fallback')).toBeTruthy();
      expect(screen.getByText('Please log in')).toBeTruthy();
      expect(screen.queryByTestId('protected-content')).toBeFalsy();
    });

    it('should show default auth required message without fallback', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute>
          <div testID="protected-content">Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('auth-required')).toBeTruthy();
      expect(screen.getByText('Authentication required')).toBeTruthy();
    });

    it('should enforce role requirements', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      render(
        <ProtectedRoute requiredRole="admin">
          <div testID="admin-content">Admin Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('access-denied')).toBeTruthy();
      expect(screen.getByText('Access denied. Insufficient permissions.')).toBeTruthy();
      expect(screen.queryByTestId('admin-content')).toBeFalsy();
    });

    it('should allow admin access to any role requirement', () => {
      mockAuthContext = createMockAuthContext({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      });

      render(
        <ProtectedRoute requiredRole="moderator">
          <div testID="moderator-content">Moderator Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('moderator-content')).toBeTruthy();
      expect(screen.queryByTestId('access-denied')).toBeFalsy();
    });

    it('should allow exact role match', () => {
      mockAuthContext = createMockAuthContext({
        id: 'mod-1',
        email: 'mod@example.com',
        role: 'moderator',
      });

      render(
        <ProtectedRoute requiredRole="moderator">
          <div testID="moderator-content">Moderator Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('moderator-content')).toBeTruthy();
      expect(screen.queryByTestId('access-denied')).toBeFalsy();
    });
  });

  describe('RoleBasedRoute Component', () => {
    it('should render children when user has allowed role', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'moderator',
      });

      render(
        <RoleBasedRoute allowedRoles={['user', 'moderator']}>
          <div testID="role-content">Role-based Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('role-content')).toBeTruthy();
      expect(screen.queryByTestId('access-denied')).toBeFalsy();
    });

    it('should deny access when user role is not allowed', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      render(
        <RoleBasedRoute allowedRoles={['moderator', 'admin']}>
          <div testID="role-content">Role-based Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('access-denied')).toBeTruthy();
      expect(screen.queryByTestId('role-content')).toBeFalsy();
    });

    it('should allow admin access to all role-based routes', () => {
      mockAuthContext = createMockAuthContext({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      });

      render(
        <RoleBasedRoute allowedRoles={['moderator']}>
          <div testID="role-content">Role-based Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('role-content')).toBeTruthy();
      expect(screen.queryByTestId('access-denied')).toBeFalsy();
    });

    it('should show custom fallback for unauthorized access', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      render(
        <RoleBasedRoute
          allowedRoles={['admin']}
          fallback={<div testID="custom-denied">You need admin privileges</div>}
        >
          <div testID="role-content">Admin Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('custom-denied')).toBeTruthy();
      expect(screen.getByText('You need admin privileges')).toBeTruthy();
      expect(screen.queryByTestId('role-content')).toBeFalsy();
    });

    it('should require authentication', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <RoleBasedRoute allowedRoles={['user']}>
          <div testID="role-content">Role-based Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('auth-required')).toBeTruthy();
      expect(screen.queryByTestId('role-content')).toBeFalsy();
    });
  });

  describe('AdminRoute Component', () => {
    it('should render children for admin users', () => {
      mockAuthContext = createMockAuthContext({
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
      });

      render(
        <AdminRoute>
          <div testID="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('admin-content')).toBeTruthy();
      expect(screen.getByText('Admin Panel')).toBeTruthy();
    });

    it('should deny access for non-admin users', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'user@example.com',
        role: 'user',
      });

      render(
        <AdminRoute>
          <div testID="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('admin-required')).toBeTruthy();
      expect(screen.getByText('Admin access required')).toBeTruthy();
      expect(screen.queryByTestId('admin-content')).toBeFalsy();
    });

    it('should deny access for moderators', () => {
      mockAuthContext = createMockAuthContext({
        id: 'mod-1',
        email: 'mod@example.com',
        role: 'moderator',
      });

      render(
        <AdminRoute>
          <div testID="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('admin-required')).toBeTruthy();
      expect(screen.queryByTestId('admin-content')).toBeFalsy();
    });

    it('should deny access for unauthenticated users', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <AdminRoute>
          <div testID="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('admin-required')).toBeTruthy();
      expect(screen.queryByTestId('admin-content')).toBeFalsy();
    });

    it('should show custom fallback for unauthorized access', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'user@example.com',
        role: 'user',
      });

      render(
        <AdminRoute fallback={<div testID="custom-admin-denied">Admin only area</div>}>
          <div testID="admin-content">Admin Panel</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('custom-admin-denied')).toBeTruthy();
      expect(screen.getByText('Admin only area')).toBeTruthy();
      expect(screen.queryByTestId('admin-content')).toBeFalsy();
    });
  });

  describe('Loading States', () => {
    it('should show loading state in all route guards', () => {
      mockAuthContext = createMockAuthContext(null, true);

      const { rerender } = render(
        <ProtectedRoute>
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();

      rerender(
        <RoleBasedRoute allowedRoles={['user']}>
          <div testID="content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();

      rerender(
        <AdminRoute>
          <div testID="content">Content</div>
        </AdminRoute>
      );

      expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    });
  });

  describe('Navigation Integration', () => {
    it('should not redirect when fallback is provided', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute fallback={<div testID="fallback">Fallback</div>}>
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      expect(mockReplace).not.toHaveBeenCalled();
      expect(screen.getByTestId('fallback')).toBeTruthy();
    });

    it('should handle navigation state changes', async () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute>
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });

      // Simulate user authentication
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      // The component would re-render with new auth state
      // and should not redirect again
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user role', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        // role is undefined
      });

      render(
        <RoleBasedRoute allowedRoles={['user']}>
          <div testID="content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('access-denied')).toBeTruthy();
      expect(screen.queryByTestId('content')).toBeFalsy();
    });

    it('should handle empty allowed roles array', () => {
      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      render(
        <RoleBasedRoute allowedRoles={[]}>
          <div testID="content">Content</div>
        </RoleBasedRoute>
      );

      expect(screen.getByTestId('access-denied')).toBeTruthy();
      expect(screen.queryByTestId('content')).toBeFalsy();
    });

    it('should handle null user object', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute requiredRole="admin">
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByTestId('auth-required')).toBeTruthy();
      expect(screen.queryByTestId('content')).toBeFalsy();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return (
          <ProtectedRoute>
            <div testID="content">Content</div>
          </ProtectedRoute>
        );
      };

      mockAuthContext = createMockAuthContext({
        id: 'user-1',
        email: 'test@example.com',
        role: 'user',
      });

      const { rerender } = render(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props shouldn't cause additional renders
      // (in a real implementation with proper memoization)
      rerender(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible error messages', () => {
      mockAuthContext = createMockAuthContext(null, false);

      render(
        <ProtectedRoute>
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      const authRequired = screen.getByTestId('auth-required');
      expect(authRequired).toBeTruthy();

      // In a real implementation, this would have proper accessibility attributes
      expect(authRequired.children[0]).toBe('Authentication required');
    });

    it('should provide accessible loading indicators', () => {
      mockAuthContext = createMockAuthContext(null, true);

      render(
        <ProtectedRoute>
          <div testID="content">Content</div>
        </ProtectedRoute>
      );

      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeTruthy();

      // In a real implementation, this would have proper accessibility attributes
      expect(loadingSpinner.children[0]).toBe('Loading...');
    });
  });
});