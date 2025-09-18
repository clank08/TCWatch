import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SocialLoginButtonProps {
  provider: 'google' | 'apple';
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'signin' | 'signup';
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'signin',
}) => {
  const getButtonConfig = () => {
    switch (provider) {
      case 'google':
        return {
          icon: 'logo-google' as keyof typeof Ionicons.glyphMap,
          iconColor: '#4285F4',
          backgroundColor: 'bg-white',
          textColor: 'text-gray-900',
          borderColor: 'border-gray-300',
          label: variant === 'signin' ? 'Continue with Google' : 'Sign up with Google',
        };
      case 'apple':
        return {
          icon: 'logo-apple' as keyof typeof Ionicons.glyphMap,
          iconColor: 'white',
          backgroundColor: 'bg-black',
          textColor: 'text-white',
          borderColor: 'border-gray-700',
          label: variant === 'signin' ? 'Continue with Apple' : 'Sign up with Apple',
        };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  const config = getButtonConfig();

  return (
    <TouchableOpacity
      className={`${config.backgroundColor} ${config.borderColor} border rounded-lg py-3 px-4 flex-row items-center justify-center space-x-2 ${
        (isLoading || disabled) ? 'opacity-60' : ''
      }`}
      onPress={onPress}
      disabled={isLoading || disabled}
      accessibilityLabel={config.label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading || disabled }}
    >
      {isLoading ? (
        <ActivityIndicator
          color={provider === 'google' ? '#4285F4' : 'white'}
          size="small"
        />
      ) : (
        <>
          <Ionicons name={config.icon} size={20} color={config.iconColor} />
          <Text className={`${config.textColor} text-base font-medium`}>
            {config.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};