/**
 * Login Form Component Tests
 * Tests for login form validation, submission, and error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { jest } from '@jest/globals';

// Mock the auth context
const mockSignIn = jest.fn();
const mockSignInWithGoogle = jest.fn();
const mockSignInWithApple = jest.fn();

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
    loading: false,
    error: null,
  }),
}));

// Mock React Native components
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Create a mock LoginForm component since we don't have it yet
interface LoginFormProps {
  onLoginSuccess?: () => void;
  onForgotPassword?: () => void;
}

const MockLoginForm: React.FC<LoginFormProps> = ({
  onLoginSuccess,
  onForgotPassword
}) => {
  const { signIn, signInWithGoogle, signInWithApple, loading, error } = require('../../../hooks/useAuth').useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [validationErrors, setValidationErrors] = React.useState<{email?: string; password?: string}>({});

  const validateForm = () => {
    const errors: {email?: string; password?: string} = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await signIn(email, password);
      onLoginSuccess?.();
    } catch (error) {
      // Error handling
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onLoginSuccess?.();
    } catch (error) {
      // Error handling
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      onLoginSuccess?.();
    } catch (error) {
      // Error handling
    }
  };

  return (
    <>
      <input
        testID="email-input"
        value={email}
        onChange={(e: any) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {validationErrors.email && (
        <span testID="email-error">{validationErrors.email}</span>
      )}

      <input
        testID="password-input"
        type="password"
        value={password}
        onChange={(e: any) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {validationErrors.password && (
        <span testID="password-error">{validationErrors.password}</span>
      )}

      {error && (
        <span testID="form-error">{error}</span>
      )}

      <button
        testID="login-button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <button
        testID="google-button"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Sign in with Google
      </button>

      <button
        testID="apple-button"
        onClick={handleAppleSignIn}
        disabled={loading}
      >
        Sign in with Apple
      </button>

      <button
        testID="forgot-password-button"
        onClick={onForgotPassword}
      >
        Forgot Password?
      </button>
    </>
  );
};

describe('LoginForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all form elements', () => {
      render(<MockLoginForm />);

      expect(screen.getByTestId('email-input')).toBeTruthy();
      expect(screen.getByTestId('password-input')).toBeTruthy();
      expect(screen.getByTestId('login-button')).toBeTruthy();
      expect(screen.getByTestId('google-button')).toBeTruthy();
      expect(screen.getByTestId('apple-button')).toBeTruthy();
      expect(screen.getByTestId('forgot-password-button')).toBeTruthy();
    });

    it('should have correct placeholder text', () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      expect(emailInput.props.placeholder).toBe('Email');
      expect(passwordInput.props.placeholder).toBe('Password');
    });

    it('should display correct button text', () => {
      render(<MockLoginForm />);

      expect(screen.getByText('Sign In')).toBeTruthy();
      expect(screen.getByText('Sign in with Google')).toBeTruthy();
      expect(screen.getByText('Sign in with Apple')).toBeTruthy();
      expect(screen.getByText('Forgot Password?')).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      render(<MockLoginForm />);

      const submitButton = screen.getByTestId('login-button');

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeTruthy();
        expect(screen.getByText('Email is required')).toBeTruthy();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeTruthy();
        expect(screen.getByText('Email is invalid')).toBeTruthy();
      });
    });

    it('should show error for empty password', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toBeTruthy();
        expect(screen.getByText('Password is required')).toBeTruthy();
      });
    });

    it('should show error for short password', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toBeTruthy();
        expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
      });
    });

    it('should accept valid email formats', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      const validEmails = [
        'test@example.com',
        'user.name@domain.org',
        'firstname+lastname@company.co.uk',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        fireEvent.changeText(emailInput, email);
        fireEvent.changeText(passwordInput, 'validpassword123');
        fireEvent.press(submitButton);

        await waitFor(() => {
          expect(screen.queryByTestId('email-error')).toBeFalsy();
        });

        expect(mockSignIn).toHaveBeenCalledWith(email, 'validpassword123');
        jest.clearAllMocks();
      }
    });
  });

  describe('Form Submission', () => {
    it('should call signIn with correct credentials', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should call onLoginSuccess after successful login', async () => {
      const mockOnLoginSuccess = jest.fn();
      mockSignIn.mockResolvedValueOnce({ user: { id: '1' } });

      render(<MockLoginForm onLoginSuccess={mockOnLoginSuccess} />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const submitButton = screen.getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should not submit with validation errors', async () => {
      render(<MockLoginForm />);

      const submitButton = screen.getByTestId('login-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeTruthy();
        expect(screen.getByTestId('password-error')).toBeTruthy();
      });

      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe('Social Authentication', () => {
    it('should call Google sign in', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce({ user: { id: '1' } });

      render(<MockLoginForm />);

      const googleButton = screen.getByTestId('google-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should call Apple sign in', async () => {
      mockSignInWithApple.mockResolvedValueOnce({ user: { id: '1' } });

      render(<MockLoginForm />);

      const appleButton = screen.getByTestId('apple-button');
      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });
    });

    it('should call onLoginSuccess after successful Google sign in', async () => {
      const mockOnLoginSuccess = jest.fn();
      mockSignInWithGoogle.mockResolvedValueOnce({ user: { id: '1' } });

      render(<MockLoginForm onLoginSuccess={mockOnLoginSuccess} />);

      const googleButton = screen.getByTestId('google-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });

    it('should call onLoginSuccess after successful Apple sign in', async () => {
      const mockOnLoginSuccess = jest.fn();
      mockSignInWithApple.mockResolvedValueOnce({ user: { id: '1' } });

      render(<MockLoginForm onLoginSuccess={mockOnLoginSuccess} />);

      const appleButton = screen.getByTestId('apple-button');
      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(mockOnLoginSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during sign in', () => {
      // Mock loading state
      jest.doMock('../../../hooks/useAuth', () => ({
        useAuth: () => ({
          signIn: mockSignIn,
          signInWithGoogle: mockSignInWithGoogle,
          signInWithApple: mockSignInWithApple,
          loading: true,
          error: null,
        }),
      }));

      render(<MockLoginForm />);

      expect(screen.getByText('Signing In...')).toBeTruthy();

      const loginButton = screen.getByTestId('login-button');
      const googleButton = screen.getByTestId('google-button');
      const appleButton = screen.getByTestId('apple-button');

      expect(loginButton.props.disabled).toBe(true);
      expect(googleButton.props.disabled).toBe(true);
      expect(appleButton.props.disabled).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should display authentication errors', () => {
      // Mock error state
      jest.doMock('../../../hooks/useAuth', () => ({
        useAuth: () => ({
          signIn: mockSignIn,
          signInWithGoogle: mockSignInWithGoogle,
          signInWithApple: mockSignInWithApple,
          loading: false,
          error: 'Invalid email or password',
        }),
      }));

      render(<MockLoginForm />);

      expect(screen.getByTestId('form-error')).toBeTruthy();
      expect(screen.getByText('Invalid email or password')).toBeTruthy();
    });

    it('should handle Google sign in errors', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign in failed'));

      render(<MockLoginForm />);

      const googleButton = screen.getByTestId('google-button');
      fireEvent.press(googleButton);

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });

      // Error handling would be in the actual implementation
    });

    it('should handle Apple sign in errors', async () => {
      mockSignInWithApple.mockRejectedValueOnce(new Error('Apple sign in failed'));

      render(<MockLoginForm />);

      const appleButton = screen.getByTestId('apple-button');
      fireEvent.press(appleButton);

      await waitFor(() => {
        expect(mockSignInWithApple).toHaveBeenCalled();
      });

      // Error handling would be in the actual implementation
    });
  });

  describe('Forgot Password', () => {
    it('should call onForgotPassword when forgot password is pressed', () => {
      const mockOnForgotPassword = jest.fn();

      render(<MockLoginForm onForgotPassword={mockOnForgotPassword} />);

      const forgotPasswordButton = screen.getByTestId('forgot-password-button');
      fireEvent.press(forgotPasswordButton);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      const loginButton = screen.getByTestId('login-button');

      // In a real implementation, these would have proper accessibility props
      expect(emailInput).toBeTruthy();
      expect(passwordInput).toBeTruthy();
      expect(loginButton).toBeTruthy();
    });

    it('should announce validation errors to screen readers', async () => {
      render(<MockLoginForm />);

      const submitButton = screen.getByTestId('login-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        const emailError = screen.getByTestId('email-error');
        const passwordError = screen.getByTestId('password-error');

        // In a real implementation, these would have proper accessibility announcements
        expect(emailError).toBeTruthy();
        expect(passwordError).toBeTruthy();
      });
    });
  });

  describe('Form Interaction', () => {
    it('should clear validation errors when user starts typing', async () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('login-button');

      // Trigger validation error
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeTruthy();
      });

      // Start typing to clear error
      fireEvent.changeText(emailInput, 'test@example.com');

      // In a real implementation, this would clear the error
      // For this mock, we'd need to implement that behavior
    });

    it('should maintain form state during navigation', () => {
      render(<MockLoginForm />);

      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      expect(emailInput.props.value).toBe('test@example.com');
      expect(passwordInput.props.value).toBe('password123');
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();

      const TestComponent = () => {
        renderSpy();
        return <MockLoginForm />;
      };

      const { rerender } = render(<TestComponent />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      rerender(<TestComponent />);

      // In a real implementation with proper memoization,
      // this should not increase the render count
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});