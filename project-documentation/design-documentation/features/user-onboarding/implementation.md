---
title: User Onboarding - Developer Implementation Guide
description: Complete developer handoff documentation for implementing user onboarding flows
feature: User Onboarding
last-updated: 2025-01-16
version: 1.0.0
related-files:
  - user-journey.md
  - screen-states.md
  - ../../design-system/style-guide.md
dependencies:
  - React Native/Expo framework
  - OAuth 2.0 authentication libraries
  - AsyncStorage for local data persistence
  - Platform API SDKs
status: approved
---

# User Onboarding - Developer Implementation Guide

## Overview

This document provides comprehensive implementation guidance for the user onboarding flow, including specific React Native/Expo code examples, performance considerations, and technical requirements for the True Crime tracking application.

## Architecture Overview

### Tech Stack Requirements

**Core Framework**:
- **React Native/Expo**: Primary development framework
- **TypeScript**: Type safety and development experience
- **React Navigation**: Screen navigation and routing
- **Expo Router**: File-based routing system

**Authentication**:
- **Expo AuthSession**: OAuth 2.0 implementation
- **AsyncStorage**: Local token storage
- **Keychain/Keystore**: Secure credential storage

**State Management**:
- **React Context**: Global state management
- **React Query**: Server state management
- **AsyncStorage**: Local data persistence

**Platform Integration**:
- **Expo WebBrowser**: OAuth flows
- **Expo Haptics**: Touch feedback
- **Expo Notifications**: Push notification setup

## File Structure

```
/src/
├── screens/
│   └── onboarding/
│       ├── LandingScreen.tsx
│       ├── AccountCreationScreen.tsx
│       ├── InterestProfilingScreen.tsx
│       ├── PlatformIntegrationScreen.tsx
│       ├── TutorialScreen.tsx
│       └── DashboardIntroScreen.tsx
├── components/
│   └── onboarding/
│       ├── ProgressIndicator.tsx
│       ├── InterestCategory.tsx
│       ├── PlatformConnection.tsx
│       ├── TutorialOverlay.tsx
│       └── OnboardingButton.tsx
├── services/
│   ├── auth.service.ts
│   ├── platform.service.ts
│   └── user.service.ts
├── hooks/
│   ├── useOnboardingProgress.ts
│   ├── useAuth.ts
│   └── usePlatformConnection.ts
└── types/
    └── onboarding.types.ts
```

---

## Component Implementation

### Core Onboarding Components

#### ProgressIndicator Component

```typescript
// components/onboarding/ProgressIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../../design-tokens';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = []
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercentage}%` }
          ]}
        />
      </View>

      <Text style={styles.stepText}>
        Step {currentStep} of {totalSteps}
        {stepLabels[currentStep - 1] && ` - ${stepLabels[currentStep - 1]}`}
      </Text>

      <View style={styles.dots}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < currentStep ? styles.dotCompleted : styles.dotPending
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: tokens.colors.dark400,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.investigationRed,
    borderRadius: 2,
  },
  stepText: {
    fontSize: tokens.typography.caption.fontSize,
    color: tokens.colors.darkTextSecondary,
    textAlign: 'center',
    marginTop: tokens.spacing.sm,
    fontWeight: tokens.typography.caption.fontWeight,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: tokens.spacing.sm,
    gap: tokens.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCompleted: {
    backgroundColor: tokens.colors.successPrimary,
  },
  dotPending: {
    backgroundColor: tokens.colors.neutral400,
  },
});
```

#### OnboardingButton Component

```typescript
// components/onboarding/OnboardingButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator
} from 'react-native';
import { tokens } from '../../../design-tokens';

interface OnboardingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export const OnboardingButton: React.FC<OnboardingButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  testID
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? tokens.colors.white : tokens.colors.investigationRed}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: tokens.colors.investigationRed,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: tokens.colors.investigationRed,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.lg,
    minHeight: 56,
  },
  disabled: {
    backgroundColor: tokens.colors.neutral400,
    borderColor: tokens.colors.neutral400,
  },
  text: {
    fontWeight: tokens.typography.body.fontWeight,
    fontSize: tokens.typography.body.fontSize,
  },
  primaryText: {
    color: tokens.colors.white,
    fontWeight: '600',
  },
  secondaryText: {
    color: tokens.colors.investigationRed,
    fontWeight: '600',
  },
  ghostText: {
    color: tokens.colors.evidenceBlue,
    fontWeight: '500',
  },
  smallText: {
    fontSize: tokens.typography.bodySmall.fontSize,
  },
  mediumText: {
    fontSize: tokens.typography.body.fontSize,
  },
  largeText: {
    fontSize: tokens.typography.bodyLarge.fontSize,
  },
  disabledText: {
    color: tokens.colors.neutral600,
  },
});
```

### Screen Implementation Examples

#### Landing Screen Implementation

```typescript
// screens/onboarding/LandingScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { tokens } from '../../../design-tokens';

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/onboarding/account-creation');
  };

  const handleSignIn = () => {
    router.push('/auth/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.heroSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* App Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/app-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Value Proposition */}
          <Text style={styles.headline}>
            Never lose track of True Crime content again
          </Text>

          <Text style={styles.subheadline}>
            Discover, track, and discuss across Netflix, Hulu, Investigation Discovery,
            and 200+ more platforms
          </Text>

          {/* Platform Integration Visual */}
          <View style={styles.platformsContainer}>
            <View style={styles.platformLogos}>
              {['netflix', 'hulu', 'discovery', 'prime', 'hbo'].map((platform, index) => (
                <Animated.Image
                  key={platform}
                  source={require(`../../../assets/images/platforms/${platform}.png`)}
                  style={[
                    styles.platformLogo,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateY: Animated.add(slideAnim, new Animated.Value(index * 10))
                      }]
                    }
                  ]}
                />
              ))}
            </View>
            <Text style={styles.platformsText}>+ 200 more platforms</Text>
          </View>

          {/* Social Proof */}
          <View style={styles.socialProof}>
            <Text style={styles.socialProofText}>
              Join 10,000+ True Crime fans already tracking their content
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionsContainer,
            { opacity: fadeAnim }
          ]}
        >
          <OnboardingButton
            title="Start Tracking Free"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            style={styles.primaryButton}
            testID="get-started-button"
          />

          <OnboardingButton
            title="See How It Works"
            onPress={() => {/* TODO: Show demo */}}
            variant="secondary"
            size="medium"
            style={styles.secondaryButton}
            testID="demo-button"
          />

          <OnboardingButton
            title="Sign In"
            onPress={handleSignIn}
            variant="ghost"
            size="small"
            testID="sign-in-button"
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.dark50,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.xl,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: tokens.spacing.xl,
  },
  logo: {
    width: 80,
    height: 80,
  },
  headline: {
    fontSize: tokens.typography.h1.fontSize,
    fontWeight: tokens.typography.h1.fontWeight,
    color: tokens.colors.darkTextPrimary,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
    letterSpacing: -0.5,
  },
  subheadline: {
    fontSize: tokens.typography.bodyLarge.fontSize,
    color: tokens.colors.darkTextSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: tokens.spacing.xl,
  },
  platformsContainer: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  platformLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  platformLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  platformsText: {
    fontSize: tokens.typography.bodySmall.fontSize,
    color: tokens.colors.darkTextTertiary,
    fontWeight: '500',
  },
  socialProof: {
    paddingHorizontal: tokens.spacing.lg,
  },
  socialProofText: {
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.darkTextSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionsContainer: {
    gap: tokens.spacing.md,
  },
  primaryButton: {
    marginBottom: tokens.spacing.sm,
  },
  secondaryButton: {
    marginBottom: tokens.spacing.xs,
  },
});
```

#### Account Creation Screen Implementation

```typescript
// screens/onboarding/AccountCreationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { ProgressIndicator } from '../../components/onboarding/ProgressIndicator';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { useAuth } from '../../hooks/useAuth';
import { tokens } from '../../../design-tokens';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
}

export default function AccountCreationScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name
      });
      router.push('/onboarding/interest-profiling');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      } else {
        await signInWithApple();
      }
      router.push('/onboarding/interest-profiling');
    } catch (error) {
      Alert.alert('Error', `Failed to sign up with ${provider}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProgressIndicator
        currentStep={1}
        totalSteps={4}
        stepLabels={['Account', 'Interests', 'Platforms', 'Tutorial']}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>
            Join thousands of True Crime fans tracking their content
          </Text>
        </View>

        {/* Social Sign Up Options */}
        <View style={styles.socialSection}>
          <OnboardingButton
            title="Continue with Google"
            onPress={() => handleSocialSignUp('google')}
            variant="secondary"
            loading={loading}
            testID="google-signup-button"
          />
          <OnboardingButton
            title="Continue with Apple"
            onPress={() => handleSocialSignUp('apple')}
            variant="secondary"
            loading={loading}
            testID="apple-signup-button"
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        {/* Email Form */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              placeholderTextColor={tokens.colors.neutral400}
              autoCapitalize="words"
              autoComplete="name"
              testID="name-input"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email address"
              placeholderTextColor={tokens.colors.neutral400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              testID="email-input"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Create a strong password"
              placeholderTextColor={tokens.colors.neutral400}
              secureTextEntry
              autoComplete="new-password"
              testID="password-input"
            />
            <Text style={styles.helpText}>
              Must be at least 8 characters long
            </Text>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Confirm your password"
              placeholderTextColor={tokens.colors.neutral400}
              secureTextEntry
              autoComplete="new-password"
              testID="confirm-password-input"
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingButton
          title="Create Account"
          onPress={handleCreateAccount}
          variant="primary"
          size="large"
          loading={loading}
          testID="create-account-button"
        />

        <Text style={styles.termsText}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.dark100,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: tokens.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.h2.fontSize,
    fontWeight: tokens.typography.h2.fontWeight,
    color: tokens.colors.darkTextPrimary,
    textAlign: 'center',
    marginBottom: tokens.spacing.sm,
  },
  subtitle: {
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.darkTextSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  socialSection: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: tokens.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: tokens.colors.dark400,
  },
  dividerText: {
    marginHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.bodySmall.fontSize,
    color: tokens.colors.darkTextTertiary,
  },
  formSection: {
    gap: tokens.spacing.lg,
  },
  inputGroup: {
    gap: tokens.spacing.xs,
  },
  label: {
    fontSize: tokens.typography.body.fontSize,
    fontWeight: '500',
    color: tokens.colors.darkTextSecondary,
  },
  input: {
    height: 48,
    backgroundColor: tokens.colors.dark300,
    borderWidth: 1,
    borderColor: tokens.colors.dark400,
    borderRadius: 8,
    paddingHorizontal: tokens.spacing.md,
    fontSize: tokens.typography.body.fontSize,
    color: tokens.colors.darkTextPrimary,
  },
  inputError: {
    borderColor: tokens.colors.investigationRed,
  },
  helpText: {
    fontSize: tokens.typography.bodySmall.fontSize,
    color: tokens.colors.darkTextTertiary,
    marginTop: tokens.spacing.xs,
  },
  errorText: {
    fontSize: tokens.typography.bodySmall.fontSize,
    color: tokens.colors.investigationRed,
    marginTop: tokens.spacing.xs,
  },
  footer: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  termsText: {
    fontSize: tokens.typography.bodySmall.fontSize,
    color: tokens.colors.darkTextTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
```

---

## Service Layer Implementation

### Authentication Service

```typescript
// services/auth.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL;
  private tokenKey = '@truecrime_token';
  private userKey = '@truecrime_user';

  async signUp(data: SignUpData): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const result = await response.json();

      // Store authentication token and user data
      await AsyncStorage.setItem(this.tokenKey, result.token);
      await AsyncStorage.setItem(this.userKey, JSON.stringify(result.user));

      return result.user;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  async signIn(data: SignInData): Promise<User> {
    try {
      const response = await fetch(`${this.baseURL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to sign in');
      }

      const result = await response.json();

      await AsyncStorage.setItem(this.tokenKey, result.token);
      await AsyncStorage.setItem(this.userKey, JSON.stringify(result.user));

      return result.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  async signInWithGoogle(): Promise<User> {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
      });

      const authUrl = `${this.baseURL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === 'success' && result.params.token) {
        await AsyncStorage.setItem(this.tokenKey, result.params.token);

        // Fetch user data
        const user = await this.getCurrentUser();
        await AsyncStorage.setItem(this.userKey, JSON.stringify(user));

        return user;
      }

      throw new Error('Google authentication failed');
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<User> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    try {
      // Implementation for Apple Sign In
      // This would use @react-native-apple-authentication/apple-authentication
      // For brevity, showing the structure
      throw new Error('Apple Sign In not implemented yet');
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.tokenKey, this.userKey]);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem(this.tokenKey);
      if (!token) return null;

      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear storage
          await this.signOut();
          return null;
        }
        throw new Error('Failed to get current user');
      }

      const user = await response.json();
      await AsyncStorage.setItem(this.userKey, JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get stored user error:', error);
      return null;
    }
  }
}

export default new AuthService();
```

### Platform Integration Service

```typescript
// services/platform.service.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';

export interface Platform {
  id: string;
  name: string;
  slug: string;
  logo: string;
  color: string;
  isConnected: boolean;
  contentCount?: number;
}

export interface PlatformConnection {
  platformId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  userId: string;
}

class PlatformService {
  private baseURL = process.env.EXPO_PUBLIC_API_URL;
  private connectionsKey = '@truecrime_platform_connections';

  async getAvailablePlatforms(): Promise<Platform[]> {
    try {
      const response = await fetch(`${this.baseURL}/platforms`);
      if (!response.ok) {
        throw new Error('Failed to fetch platforms');
      }
      return await response.json();
    } catch (error) {
      console.error('Get platforms error:', error);
      throw error;
    }
  }

  async connectPlatform(platformSlug: string): Promise<PlatformConnection> {
    try {
      const token = await AsyncStorage.getItem('@truecrime_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const redirectUri = AuthSession.makeRedirectUri({
        useProxy: true,
        path: 'platform-callback',
      });

      const authUrl = `${this.baseURL}/platforms/${platformSlug}/connect?redirect_uri=${encodeURIComponent(redirectUri)}`;

      const result = await AuthSession.startAsync({
        authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === 'success' && result.params.success) {
        // Fetch the connection details
        const connectionResponse = await fetch(
          `${this.baseURL}/platforms/${platformSlug}/connection`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!connectionResponse.ok) {
          throw new Error('Failed to establish platform connection');
        }

        const connection = await connectionResponse.json();

        // Store connection locally
        await this.storeConnection(connection);

        return connection;
      }

      throw new Error(`Failed to connect to ${platformSlug}`);
    } catch (error) {
      console.error(`Platform connection error (${platformSlug}):`, error);
      throw error;
    }
  }

  async disconnectPlatform(platformSlug: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('@truecrime_token');
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(
        `${this.baseURL}/platforms/${platformSlug}/disconnect`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to disconnect from ${platformSlug}`);
      }

      // Remove local connection
      await this.removeConnection(platformSlug);
    } catch (error) {
      console.error(`Platform disconnection error (${platformSlug}):`, error);
      throw error;
    }
  }

  async getConnectedPlatforms(): Promise<PlatformConnection[]> {
    try {
      const token = await AsyncStorage.getItem('@truecrime_token');
      if (!token) return [];

      const response = await fetch(`${this.baseURL}/platforms/connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return [];
        }
        throw new Error('Failed to fetch connected platforms');
      }

      const connections = await response.json();

      // Store connections locally
      await AsyncStorage.setItem(
        this.connectionsKey,
        JSON.stringify(connections)
      );

      return connections;
    } catch (error) {
      console.error('Get connected platforms error:', error);
      // Return cached connections on error
      return await this.getCachedConnections();
    }
  }

  private async storeConnection(connection: PlatformConnection): Promise<void> {
    try {
      const existing = await this.getCachedConnections();
      const updated = existing.filter(c => c.platformId !== connection.platformId);
      updated.push(connection);

      await AsyncStorage.setItem(
        this.connectionsKey,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Store connection error:', error);
    }
  }

  private async removeConnection(platformSlug: string): Promise<void> {
    try {
      const existing = await this.getCachedConnections();
      const updated = existing.filter(c => c.platformId !== platformSlug);

      await AsyncStorage.setItem(
        this.connectionsKey,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Remove connection error:', error);
    }
  }

  private async getCachedConnections(): Promise<PlatformConnection[]> {
    try {
      const cached = await AsyncStorage.getItem(this.connectionsKey);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Get cached connections error:', error);
      return [];
    }
  }
}

export default new PlatformService();
```

---

## Custom Hooks

### Onboarding Progress Hook

```typescript
// hooks/useOnboardingProgress.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  isComplete: boolean;
  userData: {
    name?: string;
    email?: string;
    interests?: string[];
    connectedPlatforms?: string[];
  };
}

const ONBOARDING_KEY = '@truecrime_onboarding_progress';
const TOTAL_STEPS = 4;

export const useOnboardingProgress = () => {
  const [progress, setProgress] = useState<OnboardingProgress>({
    currentStep: 1,
    completedSteps: [],
    isComplete: false,
    userData: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProgress(parsed);
      }
    } catch (error) {
      console.error('Failed to load onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    try {
      const newProgress = { ...progress, ...updates };
      newProgress.isComplete = newProgress.completedSteps.length === TOTAL_STEPS;

      setProgress(newProgress);
      await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(newProgress));
    } catch (error) {
      console.error('Failed to update onboarding progress:', error);
    }
  };

  const completeStep = async (step: number, data?: any) => {
    const completedSteps = [...new Set([...progress.completedSteps, step])];
    const nextStep = Math.min(step + 1, TOTAL_STEPS);

    await updateProgress({
      currentStep: nextStep,
      completedSteps,
      userData: { ...progress.userData, ...data },
    });
  };

  const resetProgress = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setProgress({
        currentStep: 1,
        completedSteps: [],
        isComplete: false,
        userData: {},
      });
    } catch (error) {
      console.error('Failed to reset onboarding progress:', error);
    }
  };

  return {
    progress,
    loading,
    updateProgress,
    completeStep,
    resetProgress,
  };
};
```

### Authentication Hook

```typescript
// hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import authService, { User, SignUpData, SignInData } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for stored user first (faster)
      const storedUser = await authService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Then verify with server
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const newUser = await authService.signUp(data);
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      const authenticatedUser = await authService.signIn(data);
      setUser(authenticatedUser);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const authenticatedUser = await authService.signInWithGoogle();
      setUser(authenticatedUser);
    } catch (error) {
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      const authenticatedUser = await authService.signInWithApple();
      setUser(authenticatedUser);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear user state even if server request fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        setUser(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

---

## Performance Considerations

### Memory Management

```typescript
// hooks/useMemoryOptimization.ts
import { useCallback, useRef, useEffect } from 'react';

export const useMemoryOptimization = () => {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = global.setTimeout(callback, delay);
    timeoutsRef.current.push(timeout);
    return timeout;
  }, []);

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const interval = global.setInterval(callback, delay);
    intervalsRef.current.push(interval);
    return interval;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      clearAllIntervals();
    };
  }, [clearAllTimeouts, clearAllIntervals]);

  return {
    setTimeout,
    setInterval,
    clearAllTimeouts,
    clearAllIntervals,
  };
};
```

### Image Loading Optimization

```typescript
// components/common/OptimizedImage.tsx
import React, { useState } from 'react';
import { Image, View, StyleSheet, ImageProps, ActivityIndicator } from 'react-native';
import { tokens } from '../../../design-tokens';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  fallbackSource?: { uri: string } | number;
  aspectRatio?: number;
  showLoader?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallbackSource,
  aspectRatio = 1.5, // 3:2 ratio for content posters
  showLoader = true,
  style,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const imageSource = error && fallbackSource ? fallbackSource : source;

  return (
    <View style={[styles.container, { aspectRatio }, style]}>
      <Image
        {...props}
        source={imageSource}
        style={styles.image}
        onLoad={handleLoad}
        onError={handleError}
        resizeMode="cover"
      />

      {loading && showLoader && (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={tokens.colors.investigationRed} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.dark200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.dark200,
  },
});
```

---

## Testing Implementation

### Unit Test Example

```typescript
// __tests__/components/OnboardingButton.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingButton } from '../../src/components/onboarding/OnboardingButton';

describe('OnboardingButton', () => {
  it('renders correctly with default props', () => {
    const { getByText, getByRole } = render(
      <OnboardingButton title="Test Button" onPress={jest.fn()} />
    );

    expect(getByText('Test Button')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <OnboardingButton title="Test Button" onPress={mockOnPress} />
    );

    fireEvent.press(getByRole('button'));

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state correctly', () => {
    const { getByTestId, queryByText } = render(
      <OnboardingButton
        title="Test Button"
        onPress={jest.fn()}
        loading={true}
        testID="test-button"
      />
    );

    expect(queryByText('Test Button')).toBeNull();
    expect(getByTestId('test-button')).toHaveProp('accessibilityState', { disabled: true });
  });

  it('respects disabled state', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <OnboardingButton
        title="Test Button"
        onPress={mockOnPress}
        disabled={true}
      />
    );

    const button = getByRole('button');
    expect(button).toHaveProp('accessibilityState', { disabled: true });

    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
```

### Integration Test Example

```typescript
// __tests__/screens/AccountCreationScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '../../src/hooks/useAuth';
import AccountCreationScreen from '../../src/screens/onboarding/AccountCreationScreen';

// Mock the router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const MockedAccountCreationScreen = () => (
  <AuthProvider>
    <AccountCreationScreen />
  </AuthProvider>
);

describe('AccountCreationScreen', () => {
  it('validates form inputs correctly', async () => {
    const { getByTestId, getByText } = render(<MockedAccountCreationScreen />);

    const createButton = getByTestId('create-account-button');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });

  it('shows password requirements', () => {
    const { getByText } = render(<MockedAccountCreationScreen />);

    expect(getByText('Must be at least 8 characters long')).toBeTruthy();
  });

  it('handles form submission with valid data', async () => {
    const { getByTestId } = render(<MockedAccountCreationScreen />);

    const nameInput = getByTestId('name-input');
    const emailInput = getByTestId('email-input');
    const passwordInput = getByTestId('password-input');
    const confirmPasswordInput = getByTestId('confirm-password-input');
    const createButton = getByTestId('create-account-button');

    fireEvent.changeText(nameInput, 'Test User');
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password123');

    fireEvent.press(createButton);

    await waitFor(() => {
      // Account creation should be initiated
      expect(createButton).toHaveProp('accessibilityState', { disabled: true });
    });
  });
});
```

---

## Deployment and Build Configuration

### Expo Configuration

```json
// app.json additions for onboarding
{
  "expo": {
    "name": "TrueCrime",
    "slug": "TrueCrime",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "truecrime",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0A"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.truecrime.tracker",
      "config": {
        "usesNonExemptEncryption": false
      },
      "associatedDomains": [
        "applinks:truecrime-tracker.com"
      ]
    },
    "android": {
      "package": "com.truecrime.tracker",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A0A0A"
      },
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "truecrime-tracker.com"
            }
          ],
          "category": [
            "BROWSABLE",
            "DEFAULT"
          ]
        }
      ]
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      [
        "expo-auth-session",
        {
          "schemes": ["truecrime"]
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

This comprehensive implementation guide provides the development team with everything needed to build the user onboarding flow, including specific React Native/Expo code, performance optimizations, testing strategies, and deployment considerations while maintaining the serious, investigative aesthetic appropriate for True Crime content.