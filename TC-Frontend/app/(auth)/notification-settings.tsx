import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUserPreferences } from '../../hooks/use-auth';

interface NotificationPreference {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);

  // Mock notification preferences - in a real app, these would come from the backend
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([
    {
      key: 'new_content',
      title: 'New Content Alerts',
      description: 'Get notified when new True Crime content is available',
      icon: 'tv-outline',
      enabled: preferences?.notifications_enabled || false,
    },
    {
      key: 'cable_reminders',
      title: 'Cable TV Reminders',
      description: 'Reminders for shows airing on cable networks',
      icon: 'alarm-outline',
      enabled: true,
    },
    {
      key: 'friend_activity',
      title: 'Friend Activity',
      description: 'When friends add shows or create lists',
      icon: 'people-outline',
      enabled: false,
    },
    {
      key: 'recommendations',
      title: 'Recommendations',
      description: 'Personalized content suggestions',
      icon: 'bulb-outline',
      enabled: true,
    },
    {
      key: 'system_updates',
      title: 'System Updates',
      description: 'App updates and important announcements',
      icon: 'settings-outline',
      enabled: true,
    },
  ]);

  const digestOptions = [
    { value: 'never', label: 'Never', description: 'No digest emails' },
    { value: 'daily', label: 'Daily', description: 'Every morning at 9 AM' },
    { value: 'weekly', label: 'Weekly', description: 'Every Monday at 9 AM' },
  ];

  const updateNotificationPref = async (key: string, enabled: boolean) => {
    setIsUpdating(true);

    // Update local state immediately for better UX
    setNotificationPrefs(prev =>
      prev.map(pref =>
        pref.key === key ? { ...pref, enabled } : pref
      )
    );

    try {
      // Special handling for main notifications toggle
      if (key === 'new_content') {
        await updatePreferences({ notifications_enabled: enabled });
      }

      // TODO: In a real app, update individual notification preferences via API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

    } catch (error) {
      // Revert local state on error
      setNotificationPrefs(prev =>
        prev.map(pref =>
          pref.key === key ? { ...pref, enabled: !enabled } : pref
        )
      );
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDigestFrequency = async (frequency: 'never' | 'daily' | 'weekly') => {
    setIsUpdating(true);
    try {
      await updatePreferences({ digest_frequency: frequency });
    } catch (error) {
      Alert.alert('Error', 'Failed to update digest frequency');
    } finally {
      setIsUpdating(false);
    }
  };

  const requestPermissions = async () => {
    Alert.alert(
      'Enable Notifications',
      'To receive notifications, please enable them in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // TODO: Open device settings
          Alert.alert('Info', 'Please go to Settings > Notifications > TCWatch to enable notifications.');
        }},
      ]
    );
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
        <Text className="text-white text-lg font-semibold">Notifications</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-4">
          {/* Push Notifications Section */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-lg font-semibold">Push Notifications</Text>
              <TouchableOpacity onPress={requestPermissions}>
                <Text className="text-blue-400 text-sm">Settings</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-400 text-sm mb-4">
              Get notified about content and activity that matters to you
            </Text>

            <View className="bg-gray-800 rounded-xl">
              {notificationPrefs.map((pref, index) => (
                <View
                  key={pref.key}
                  className={`flex-row items-center justify-between p-4 ${
                    index < notificationPrefs.length - 1 ? 'border-b border-gray-700' : ''
                  }`}
                >
                  <View className="flex-row items-center space-x-3 flex-1">
                    <View className="w-10 h-10 bg-gray-700 rounded-full items-center justify-center">
                      <Ionicons name={pref.icon} size={20} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-1">
                        {pref.title}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {pref.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={pref.enabled}
                    onValueChange={(enabled) => updateNotificationPref(pref.key, enabled)}
                    trackColor={{ false: '#374151', true: '#DC2626' }}
                    thumbColor={pref.enabled ? '#FFFFFF' : '#9CA3AF'}
                    disabled={isUpdating}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Email Digest Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-2">Email Digest</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Get a summary of new content and activity via email
            </Text>

            <View className="bg-gray-800 rounded-xl">
              {digestOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateDigestFrequency(option.value as any)}
                  className={`p-4 ${
                    index < digestOptions.length - 1 ? 'border-b border-gray-700' : ''
                  }`}
                  disabled={isUpdating}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: preferences?.digest_frequency === option.value }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-1">
                        {option.label}
                      </Text>
                      <Text className="text-gray-400 text-sm">
                        {option.description}
                      </Text>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      preferences?.digest_frequency === option.value
                        ? 'border-red-500 bg-red-500'
                        : 'border-gray-600'
                    }`}>
                      {preferences?.digest_frequency === option.value && (
                        <View className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quiet Hours Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-2">Quiet Hours</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Pause notifications during specific hours
            </Text>

            <View className="bg-gray-800 rounded-xl">
              <TouchableOpacity
                className="flex-row items-center justify-between p-4 border-b border-gray-700"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Quiet hours configuration will be available soon.');
                }}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="moon-outline" size={20} color="#9CA3AF" />
                  <View>
                    <Text className="text-white text-base">Enable Quiet Hours</Text>
                    <Text className="text-gray-400 text-sm">10:00 PM - 8:00 AM</Text>
                  </View>
                </View>
                <Switch
                  value={false}
                  onValueChange={() => {}}
                  trackColor={{ false: '#374151', true: '#DC2626' }}
                  thumbColor="#9CA3AF"
                  disabled={true}
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between p-4"
                onPress={() => {
                  Alert.alert('Coming Soon', 'Time configuration will be available soon.');
                }}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="time-outline" size={20} color="#9CA3AF" />
                  <Text className="text-white text-base">Configure Hours</Text>
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
                  Notification Tips
                </Text>
                <Text className="text-gray-300 text-sm leading-5">
                  • Notifications require device permissions{'\n'}
                  • Email digest can be disabled anytime{'\n'}
                  • Manage notification sounds in device settings
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