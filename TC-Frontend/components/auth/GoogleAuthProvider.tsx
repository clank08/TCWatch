import React from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Complete the auth session for web
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthConfig {
  clientId: string;
  androidClientId?: string;
  iosClientId?: string;
}

interface GoogleAuthResult {
  type: 'success' | 'dismiss' | 'error';
  params?: {
    access_token?: string;
    id_token?: string;
    error?: string;
  };
  user?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

interface GoogleAuthProviderProps {
  config: GoogleAuthConfig;
  onSuccess: (result: GoogleAuthResult) => void;
  onError: (error: string) => void;
  children: (signIn: () => Promise<void>) => React.ReactNode;
}

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  config,
  onSuccess,
  onError,
  children,
}) => {
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

  // Create request configuration
  const redirectUri = makeRedirectUri({
    scheme: 'tcwatch',
    path: 'auth/google',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: Platform.select({
        ios: config.iosClientId || config.clientId,
        android: config.androidClientId || config.clientId,
        default: config.clientId,
      }),
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      additionalParameters: {},
      extraParams: {
        access_type: 'offline',
      },
    },
    discovery
  );

  // Handle auth response
  React.useEffect(() => {
    if (response?.type === 'success') {
      handleAuthSuccess(response.params);
    } else if (response?.type === 'error') {
      onError(response.params?.error || 'Authentication failed');
    }
  }, [response]);

  const handleAuthSuccess = async (params: any) => {
    try {
      if (!params.access_token) {
        throw new Error('No access token received');
      }

      // Fetch user info from Google
      const userInfoResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${params.access_token}`
      );

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user information');
      }

      const userInfo = await userInfoResponse.json();

      const result: GoogleAuthResult = {
        type: 'success',
        params: {
          access_token: params.access_token,
          id_token: params.id_token,
        },
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        },
      };

      onSuccess(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const signIn = async () => {
    try {
      if (!request) {
        throw new Error('Auth request not ready');
      }

      await promptAsync();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to start authentication');
    }
  };

  return <>{children(signIn)}</>;
};

// Utility hook for Google Auth
export const useGoogleAuth = (config: GoogleAuthConfig) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const signIn = React.useCallback(async (): Promise<GoogleAuthResult | null> => {
    return new Promise((resolve) => {
      setIsLoading(true);
      setError(null);

      const handleSuccess = (result: GoogleAuthResult) => {
        setIsLoading(false);
        resolve(result);
      };

      const handleError = (errorMessage: string) => {
        setIsLoading(false);
        setError(errorMessage);
        Alert.alert('Google Sign In Failed', errorMessage);
        resolve(null);
      };

      // This would need to be implemented differently in a real app
      // For now, we'll just simulate the flow
      setTimeout(() => {
        handleError('Google Sign In not implemented yet');
      }, 1000);
    });
  }, [config]);

  return {
    signIn,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};