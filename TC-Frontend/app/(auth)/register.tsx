import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSocialAuth } from '../../hooks/use-auth';
import { z } from 'zod';

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Password strength indicator
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  return {
    score: strength,
    label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength],
    color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][strength],
  };
};

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { signUp, isLoading, error, clearError } = useAuth();
  const { signInWithGoogle, signInWithApple } = useSocialAuth();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      registerSchema.parse(formData);

      if (!acceptedTerms) {
        setErrors({ terms: 'Please accept the terms and conditions' });
        return false;
      }

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    clearError();

    try {
      await signUp(formData.email, formData.password, formData.name);
      router.replace('/(auth)/onboarding');
    } catch (err) {
      Alert.alert(
        'Registration Failed',
        error || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(auth)/onboarding');
    } catch (err) {
      Alert.alert('Google Sign Up Failed', 'Please try again.');
    }
  };

  const handleAppleSignUp = async () => {
    try {
      await signInWithApple();
      router.replace('/(auth)/onboarding');
    } catch (err) {
      Alert.alert('Apple Sign Up Failed', 'Please try again.');
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-red-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">TC</Text>
            </View>
            <Text className="text-white text-3xl font-bold mb-2">Create Account</Text>
            <Text className="text-gray-400 text-center text-base">
              Join the True Crime community and start tracking your content
            </Text>
          </View>

          {/* Registration Form */}
          <View className="space-y-4">
            {/* Name Input */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Full Name</Text>
              <View className="relative">
                <TextInput
                  className={`bg-gray-800 border rounded-lg px-4 py-3 text-white text-base ${
                    errors.name ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(value) => updateFormData('name', value)}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  accessibilityLabel="Full name"
                  accessibilityHint="Enter your full name"
                />
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ position: 'absolute', right: 12, top: 12 }}
                />
              </View>
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Email Input */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Email</Text>
              <View className="relative">
                <TextInput
                  className={`bg-gray-800 border rounded-lg px-4 py-3 text-white text-base ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter your email address"
                />
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#9CA3AF"
                  style={{ position: 'absolute', right: 12, top: 12 }}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Password</Text>
              <View className="relative">
                <TextInput
                  className={`bg-gray-800 border rounded-lg px-4 py-3 pr-12 text-white text-base ${
                    errors.password ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Password"
                  accessibilityHint="Create a new password"
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {formData.password.length > 0 && (
                <View className="mt-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-gray-400 text-xs">Password Strength</Text>
                    <Text className="text-xs" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                  <View className="flex-row space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        className="flex-1 h-1 rounded"
                        style={{
                          backgroundColor: level <= passwordStrength.score ? passwordStrength.color : '#374151'
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Confirm Password</Text>
              <View className="relative">
                <TextInput
                  className={`bg-gray-800 border rounded-lg px-4 py-3 pr-12 text-white text-base ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  textContentType="newPassword"
                  accessibilityLabel="Confirm password"
                  accessibilityHint="Re-enter your password"
                />
                <TouchableOpacity
                  className="absolute right-3 top-3"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text className="text-red-500 text-sm mt-1">{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Terms and Conditions */}
            <View className="flex-row items-start space-x-3 py-2">
              <TouchableOpacity
                className={`w-5 h-5 rounded border-2 items-center justify-center mt-0.5 ${
                  acceptedTerms ? 'bg-red-600 border-red-600' : 'border-gray-600'
                }`}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                accessibilityLabel="Accept terms and conditions"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                {acceptedTerms && (
                  <Ionicons name="checkmark" size={12} color="white" />
                )}
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-gray-300 text-sm leading-5">
                  I agree to the{' '}
                  <Text className="text-red-500 underline">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-red-500 underline">Privacy Policy</Text>
                </Text>
                {errors.terms && (
                  <Text className="text-red-500 text-sm mt-1">{errors.terms}</Text>
                )}
              </View>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              className={`bg-red-600 rounded-lg py-3 items-center mt-6 ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handleSignUp}
              disabled={isLoading}
              accessibilityLabel="Create account"
              accessibilityHint="Create your new account"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-gray-700" />
              <Text className="text-gray-400 px-4 text-sm">or continue with</Text>
              <View className="flex-1 h-px bg-gray-700" />
            </View>

            {/* Social Login Buttons */}
            <View className="space-y-3">
              {/* Google Sign Up */}
              <TouchableOpacity
                className="bg-white rounded-lg py-3 flex-row items-center justify-center space-x-2"
                onPress={handleGoogleSignUp}
                disabled={isLoading}
                accessibilityLabel="Sign up with Google"
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-gray-900 text-base font-medium">Continue with Google</Text>
              </TouchableOpacity>

              {/* Apple Sign Up (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  className="bg-black border border-gray-700 rounded-lg py-3 flex-row items-center justify-center space-x-2"
                  onPress={handleAppleSignUp}
                  disabled={isLoading}
                  accessibilityLabel="Sign up with Apple"
                >
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text className="text-white text-base font-medium">Continue with Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-400 text-base">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-red-500 text-base font-medium">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}