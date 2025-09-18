import React from 'react';
import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

interface AppleAuthResult {
  type: 'success' | 'dismiss' | 'error';
  credential?: {
    identityToken?: string | null;
    authorizationCode?: string | null;
    user?: string | null;
    email?: string | null;
    fullName?: {
      givenName?: string | null;
      familyName?: string | null;
    } | null;
  };
  error?: string;
}

interface AppleAuthProviderProps {
  onSuccess: (result: AppleAuthResult) => void;
  onError: (error: string) => void;
  children: (signIn: () => Promise<void>) => React.ReactNode;
}

export const AppleAuthProvider: React.FC<AppleAuthProviderProps> = ({
  onSuccess,
  onError,
  children,
}) => {
  const signIn = async () => {
    try {
      // Check if Apple Authentication is available
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign In is not available on this device');
      }

      // Perform the authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Handle successful authentication
      const result: AppleAuthResult = {
        type: 'success',
        credential: {
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          user: credential.user,
          email: credential.email,
          fullName: credential.fullName,
        },
      };

      onSuccess(result);
    } catch (error: any) {
      let errorMessage = 'Apple Sign In failed';

      if (error.code === 'ERR_CANCELED') {
        // User canceled the authentication
        const result: AppleAuthResult = {
          type: 'dismiss',
        };
        onSuccess(result);
        return;
      }

      if (error.message) {
        errorMessage = error.message;
      }

      onError(errorMessage);
    }
  };

  return <>{children(signIn)}</>;
};

// Utility hook for Apple Auth
export const useAppleAuth = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(async (): Promise<AppleAuthResult | null> => {
    return new Promise((resolve) => {
      setIsLoading(true);
      setError(null);

      const handleSuccess = (result: AppleAuthResult) => {
        setIsLoading(false);
        resolve(result);
      };

      const handleError = (errorMessage: string) => {
        setIsLoading(false);
        setError(errorMessage);
        if (errorMessage !== 'Apple Sign In is only available on iOS') {
          Alert.alert('Apple Sign In Failed', errorMessage);
        }
        resolve(null);
      };

      // Check platform availability
      if (Platform.OS !== 'ios') {
        handleError('Apple Sign In is only available on iOS');
        return;
      }

      // Simulate auth flow for now
      setTimeout(() => {
        handleError('Apple Sign In not fully implemented yet');
      }, 1000);
    });
  }, []);

  const isAvailable = Platform.OS === 'ios';

  return {
    signIn,
    isLoading,
    error,
    isAvailable,
    clearError: () => setError(null),
  };
};

// Component for rendering Apple Sign In button with proper styling
export const AppleSignInButton: React.FC<{
  onPress: () => void;
  buttonStyle?: AppleAuthentication.AppleAuthenticationButtonStyle;
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
  cornerRadius?: number;
}> = ({
  onPress,
  buttonStyle = AppleAuthentication.AppleAuthenticationButtonStyle.BLACK,
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
  cornerRadius = 8,
}) => {
  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={buttonType}
      buttonStyle={buttonStyle}
      cornerRadius={cornerRadius}
      style={{
        width: '100%',
        height: 48,
      }}
      onPress={onPress}
    />
  );
};