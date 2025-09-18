import React from 'react';
import { Alert, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface BiometricAuthConfig {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
  disableDeviceFallback?: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: LocalAuthentication.AuthenticationType;
}

export class BiometricAuthManager {
  private static instance: BiometricAuthManager;
  private readonly BIOMETRIC_ENABLED_KEY = 'tcwatch_biometric_enabled';

  public static getInstance(): BiometricAuthManager {
    if (!BiometricAuthManager.instance) {
      BiometricAuthManager.instance = new BiometricAuthManager();
    }
    return BiometricAuthManager.instance;
  }

  /**
   * Check if biometric authentication is available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get available biometric types
   */
  async getAvailableTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting biometric types:', error);
      return [];
    }
  }

  /**
   * Get biometric type names for display
   */
  async getBiometricTypeNames(): Promise<string[]> {
    const types = await this.getAvailableTypes();
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Biometric';
      }
    });
  }

  /**
   * Authenticate using biometrics
   */
  async authenticate(config: BiometricAuthConfig = {}): Promise<BiometricAuthResult> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const types = await this.getAvailableTypes();
      const primaryType = types[0];

      const defaultPrompt = this.getDefaultPromptMessage(primaryType);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: config.promptMessage || defaultPrompt,
        cancelLabel: config.cancelLabel || 'Cancel',
        fallbackLabel: config.fallbackLabel || 'Use Password',
        disableDeviceFallback: config.disableDeviceFallback || false,
      });

      if (result.success) {
        return {
          success: true,
          biometricType: primaryType,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Authentication failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Check if biometric authentication is enabled by user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  }

  /**
   * Enable or disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        // Verify biometric before enabling
        const result = await this.authenticate({
          promptMessage: 'Verify your identity to enable biometric authentication',
        });

        if (!result.success) {
          throw new Error('Biometric verification failed');
        }
      }

      await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, enabled.toString());
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update biometric settings'
      );
    }
  }

  /**
   * Get default prompt message based on biometric type
   */
  private getDefaultPromptMessage(type?: LocalAuthentication.AuthenticationType): string {
    switch (type) {
      case LocalAuthentication.AuthenticationType.FINGERPRINT:
        return 'Verify your fingerprint to continue';
      case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
        return Platform.OS === 'ios'
          ? 'Use Face ID to continue'
          : 'Use face recognition to continue';
      case LocalAuthentication.AuthenticationType.IRIS:
        return 'Verify your iris to continue';
      default:
        return 'Verify your identity to continue';
    }
  }
}

// React hook for biometric authentication
export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [biometricTypes, setBiometricTypes] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const manager = BiometricAuthManager.getInstance();

  // Check availability and settings on mount
  React.useEffect(() => {
    const checkBiometricStatus = async () => {
      const available = await manager.isAvailable();
      const enabled = await manager.isBiometricEnabled();
      const types = await manager.getBiometricTypeNames();

      setIsAvailable(available);
      setIsEnabled(enabled);
      setBiometricTypes(types);
    };

    checkBiometricStatus();
  }, []);

  const authenticate = React.useCallback(
    async (config?: BiometricAuthConfig): Promise<BiometricAuthResult> => {
      setIsLoading(true);
      try {
        return await manager.authenticate(config);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const enableBiometric = React.useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await manager.setBiometricEnabled(true);
      setIsEnabled(true);
      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to enable biometric authentication'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disableBiometric = React.useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      await manager.setBiometricEnabled(false);
      setIsEnabled(false);
      return true;
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to disable biometric authentication'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAvailable,
    isEnabled,
    biometricTypes,
    isLoading,
    authenticate,
    enableBiometric,
    disableBiometric,
  };
};