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
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { usePasswordManagement } from '../../hooks/use-auth';
import { z } from 'zod';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { requestPasswordReset, isLoading, error, clearError } = usePasswordManagement();

  const validateForm = () => {
    try {
      forgotPasswordSchema.parse({ email });
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

  const handlePasswordReset = async () => {
    if (!validateForm()) return;

    clearError();

    try {
      await requestPasswordReset(email);
      setIsEmailSent(true);
    } catch (err) {
      Alert.alert(
        'Reset Failed',
        error || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleResendEmail = async () => {
    await handlePasswordReset();
  };

  if (isEmailSent) {
    return (
      <View className="flex-1 bg-gray-900 justify-center px-6">
        <StatusBar style="light" />

        <View className="items-center">
          {/* Success Icon */}
          <View className="w-20 h-20 bg-green-600 rounded-full items-center justify-center mb-6">
            <Ionicons name="mail-outline" size={32} color="white" />
          </View>

          {/* Success Message */}
          <Text className="text-white text-2xl font-bold text-center mb-4">
            Check Your Email
          </Text>
          <Text className="text-gray-400 text-center text-base leading-6 mb-8">
            We've sent password reset instructions to{'\n'}
            <Text className="text-white font-medium">{email}</Text>
          </Text>

          {/* Instructions */}
          <View className="bg-gray-800 rounded-lg p-4 mb-8 w-full">
            <Text className="text-white font-medium mb-2">What to do next:</Text>
            <View className="space-y-2">
              <Text className="text-gray-300 text-sm">• Check your email inbox</Text>
              <Text className="text-gray-300 text-sm">• Look for an email from TCWatch</Text>
              <Text className="text-gray-300 text-sm">• Click the reset link in the email</Text>
              <Text className="text-gray-300 text-sm">• Follow the instructions to reset your password</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full space-y-3">
            <TouchableOpacity
              className="bg-red-600 rounded-lg py-3 items-center"
              onPress={() => router.replace('/(auth)/login')}
              accessibilityLabel="Back to sign in"
            >
              <Text className="text-white text-base font-semibold">Back to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-gray-600 rounded-lg py-3 items-center"
              onPress={handleResendEmail}
              disabled={isLoading}
              accessibilityLabel="Resend email"
            >
              {isLoading ? (
                <ActivityIndicator color="#9CA3AF" />
              ) : (
                <Text className="text-gray-300 text-base font-medium">Resend Email</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Support */}
          <Text className="text-gray-500 text-sm text-center mt-8">
            Didn't receive the email? Check your spam folder or{'\n'}
            contact support for help.
          </Text>
        </View>
      </View>
    );
  }

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
        <View className="flex-1 justify-center px-6">
          {/* Back Button */}
          <TouchableOpacity
            className="absolute top-12 left-6 w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-red-600 rounded-full items-center justify-center mb-6">
              <Ionicons name="lock-closed-outline" size={32} color="white" />
            </View>
            <Text className="text-white text-3xl font-bold mb-4">Reset Password</Text>
            <Text className="text-gray-400 text-center text-base leading-6">
              Enter your email address and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            {/* Email Input */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Email Address</Text>
              <View className="relative">
                <TextInput
                  className={`bg-gray-800 border rounded-lg px-4 py-3 text-white text-base ${
                    errors.email ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="Email address"
                  accessibilityHint="Enter the email address associated with your account"
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

            {/* Submit Button */}
            <TouchableOpacity
              className={`bg-red-600 rounded-lg py-3 items-center ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handlePasswordReset}
              disabled={isLoading || !email.trim()}
              accessibilityLabel="Send reset instructions"
              accessibilityHint="Send password reset instructions to your email"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Send Reset Instructions</Text>
              )}
            </TouchableOpacity>

            {/* Help Text */}
            <View className="bg-gray-800 rounded-lg p-4">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
                <View className="flex-1">
                  <Text className="text-blue-400 font-medium text-sm mb-1">
                    Remember your password?
                  </Text>
                  <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                    <Text className="text-blue-400 text-sm underline">
                      Go back to sign in
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Security Note */}
          <View className="mt-8 pt-6 border-t border-gray-800">
            <View className="flex-row items-start space-x-3">
              <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
              <Text className="text-gray-400 text-xs leading-5 flex-1">
                For security reasons, we'll only send reset instructions to the email address
                associated with your account. If you don't receive an email, please check your
                spam folder.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}