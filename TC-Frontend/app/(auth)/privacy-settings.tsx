import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUserPreferences } from '../../hooks/use-auth';

export default function PrivacySettingsScreen() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);

  const privacyOptions = [
    {
      value: 'private',
      title: 'Private',
      description: 'Only you can see your activity and lists',
      icon: 'lock-closed',
    },
    {
      value: 'friends',
      title: 'Friends Only',
      description: 'Only friends you connect with can see your activity',
      icon: 'people',
    },
    {
      value: 'public',
      title: 'Public',
      description: 'Anyone can discover your profile and recommendations',
      icon: 'globe',
    },
  ];

  const contentWarningOptions = [
    {
      value: true,
      title: 'Show Content Warnings',
      description: 'Display warnings for graphic or sensitive content',
      icon: 'warning',
    },
    {
      value: false,
      title: 'No Content Warnings',
      description: 'Show all content without warnings',
      icon: 'eye',
    },
  ];

  const updatePrivacyLevel = async (level: 'private' | 'friends' | 'public') => {
    setIsUpdating(true);
    try {
      await updatePreferences({ privacy_level: level });
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateContentWarnings = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await updatePreferences({ content_warnings: enabled });
    } catch (error) {
      Alert.alert('Error', 'Failed to update content warning settings');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Privacy Settings</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Privacy Level Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-2">Profile Privacy</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Control who can see your profile and activity
            </Text>

            <View className="bg-gray-800 rounded-xl">
              {privacyOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updatePrivacyLevel(option.value as any)}
                  className={`p-4 ${
                    index < privacyOptions.length - 1 ? 'border-b border-gray-700' : ''
                  }`}
                  disabled={isUpdating}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: preferences?.privacy_level === option.value }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-3 flex-1">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        preferences?.privacy_level === option.value ? 'bg-red-600' : 'bg-gray-700'
                      }`}>
                        <Ionicons
                          name={option.icon as any}
                          size={20}
                          color={preferences?.privacy_level === option.value ? 'white' : '#9CA3AF'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-medium text-base mb-1">
                          {option.title}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      preferences?.privacy_level === option.value
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-600'
                    }`}>
                      {preferences?.privacy_level === option.value && (
                        <View className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Content Warnings Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-2">Content Warnings</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Choose whether to see warnings for sensitive True Crime content
            </Text>

            <View className="bg-gray-800 rounded-xl">
              {contentWarningOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value.toString()}
                  onPress={() => updateContentWarnings(option.value)}
                  className={`p-4 ${
                    index < contentWarningOptions.length - 1 ? 'border-b border-gray-700' : ''
                  }`}
                  disabled={isUpdating}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: preferences?.content_warnings === option.value }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center space-x-3 flex-1">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        preferences?.content_warnings === option.value ? 'bg-orange-600' : 'bg-gray-700'
                      }`}>
                        <Ionicons
                          name={option.icon as any}
                          size={20}
                          color={preferences?.content_warnings === option.value ? 'white' : '#9CA3AF'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-medium text-base mb-1">
                          {option.title}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      </View>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      preferences?.content_warnings === option.value
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-600'
                    }`}>
                      {preferences?.content_warnings === option.value && (
                        <View className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Data & Account Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-4">Data & Account</Text>

            <View className="bg-gray-800 rounded-xl">
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 border-b border-gray-700"
                onPress={() => {
                  Alert.alert(
                    'Download Data',
                    'Request a copy of your data. You will receive an email with your data within 7 days.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Request', onPress: () => {} },
                    ]
                  );
                }}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="download-outline" size={20} color="#9CA3AF" />
                  <Text className="text-white text-base">Download My Data</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between p-4"
                onPress={() => {
                  Alert.alert(
                    'Delete Account',
                    'This action cannot be undone. All your data will be permanently deleted.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete Account',
                        style: 'destructive',
                        onPress: () => {
                          // TODO: Implement account deletion
                          Alert.alert('Coming Soon', 'Account deletion will be available soon.');
                        },
                      },
                    ]
                  );
                }}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text className="text-red-500 text-base">Delete Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Information Section */}
          <View className="bg-gray-800 rounded-lg p-4">
            <View className="flex-row items-start space-x-3">
              <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
              <View className="flex-1">
                <Text className="text-blue-400 font-medium text-sm mb-1">
                  Privacy Information
                </Text>
                <Text className="text-gray-300 text-sm leading-5">
                  TCWatch is designed with privacy-first principles. Your data is encrypted and
                  never sold to third parties. Learn more in our Privacy Policy.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {(isLoading || isUpdating) && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center">
          <View className="bg-gray-800 rounded-lg p-4 items-center">
            <ActivityIndicator color="#DC2626" size="large" />
            <Text className="text-white text-sm mt-2">Updating settings...</Text>
          </View>
        </View>
      )}
    </View>
  );
}