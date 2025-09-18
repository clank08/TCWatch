import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function AuthLayout() {
  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" backgroundColor="#111827" />
      <Stack
        screenOptions={{
          headerShown: false,
          presentation: 'card',
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#111827' },
        }}
      >
        <Stack.Screen
          name="login"
          options={{
            title: 'Sign In',
          }}
        />
        <Stack.Screen
          name="register"
          options={{
            title: 'Create Account',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            title: 'Reset Password',
          }}
        />
        <Stack.Screen
          name="verify-email"
          options={{
            title: 'Verify Email',
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            title: 'Welcome',
            gestureEnabled: false,
          }}
        />
      </Stack>
    </View>
  );
}