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
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, isLoading, error, clearError } = useAuth();
  const { signInWithGoogle, signInWithApple } = useSocialAuth();

  const validateForm = () => {
    try {
      loginSchema.parse({ email, password });
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

  const handleSignIn = async () => {
    if (!validateForm()) return;

    clearError();

    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert(
        'Sign In Failed',
        error || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Google Sign In Failed', 'Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await signInWithApple();
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Apple Sign In Failed', 'Please try again.');
    }
  };

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
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-red-600 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">TC</Text>
            </View>
            <Text className="text-white text-3xl font-bold mb-2">Welcome Back</Text>
            <Text className="text-gray-400 text-center text-base">
              Sign in to continue tracking your True Crime content
            </Text>
          </View>

          {/* Login Form */}
          <View className="space-y-4">
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
                  value={email}
                  onChangeText={setEmail}
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
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  accessibilityLabel="Password"
                  accessibilityHint="Enter your password"
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
              {errors.password && (
                <Text className="text-red-500 text-sm mt-1">{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <View className="items-end">
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text className="text-red-500 text-sm">Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              className={`bg-red-600 rounded-lg py-3 items-center ${
                isLoading ? 'opacity-70' : ''
              }`}
              onPress={handleSignIn}
              disabled={isLoading}
              accessibilityLabel="Sign in"
              accessibilityHint="Sign in to your account"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">Sign In</Text>
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
              {/* Google Sign In */}
              <TouchableOpacity
                className="bg-white rounded-lg py-3 flex-row items-center justify-center space-x-2"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                accessibilityLabel="Sign in with Google"
              >
                <Ionicons name="logo-google" size={20} color="#4285F4" />
                <Text className="text-gray-900 text-base font-medium">Continue with Google</Text>
              </TouchableOpacity>

              {/* Apple Sign In (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  className="bg-black border border-gray-700 rounded-lg py-3 flex-row items-center justify-center space-x-2"
                  onPress={handleAppleSignIn}
                  disabled={isLoading}
                  accessibilityLabel="Sign in with Apple"
                >
                  <Ionicons name="logo-apple" size={20} color="white" />
                  <Text className="text-white text-base font-medium">Continue with Apple</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-gray-400 text-base">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-red-500 text-base font-medium">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}