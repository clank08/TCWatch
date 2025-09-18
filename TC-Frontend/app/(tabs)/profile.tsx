import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser, useUserPreferences, useAuth } from '../../hooks/use-auth';
import { useBiometricAuth } from '../../components/auth/BiometricAuth';

export default function ProfileScreen() {
  const { user, isLoading } = useUser();
  const { preferences, updatePreferences } = useUserPreferences();
  const { signOut } = useAuth();
  const { isAvailable: biometricAvailable, isEnabled: biometricEnabled, enableBiometric, disableBiometric } = useBiometricAuth();

  const [isUpdating, setIsUpdating] = useState(false);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(auth)/edit-profile');
  };

  const handlePrivacySettings = () => {
    router.push('/(auth)/privacy-settings');
  };

  const handleNotificationSettings = () => {
    router.push('/(auth)/notification-settings');
  };

  const toggleBiometric = async () => {
    setIsUpdating(true);
    try {
      if (biometricEnabled) {
        await disableBiometric();
      } else {
        await enableBiometric();
      }
    } catch (error) {
      console.error('Error toggling biometric:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateNotificationPreference = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      await updatePreferences({ notifications_enabled: enabled });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    {
      id: 'edit-profile',
      title: 'Edit Profile',
      icon: 'person-outline',
      onPress: handleEditProfile,
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      icon: 'shield-checkmark-outline',
      onPress: handlePrivacySettings,
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: 'notifications-outline',
      onPress: handleNotificationSettings,
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => {},
    },
    {
      id: 'about',
      title: 'About TCWatch',
      icon: 'information-circle-outline',
      onPress: () => {},
    },
  ];

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <Text className="text-white text-2xl font-bold">Profile</Text>
        </View>

        {/* User Info Section */}
        <View className="px-6 mb-6">
          <View className="bg-gray-800 rounded-xl p-6">
            <View className="flex-row items-center space-x-4">
              {/* Avatar */}
              <TouchableOpacity onPress={handleEditProfile}>
                <View className="relative">
                  {user?.avatar_url ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <View className="w-16 h-16 bg-red-600 rounded-full items-center justify-center">
                      <Text className="text-white text-xl font-bold">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>
                  )}
                  <View className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full items-center justify-center">
                    <Ionicons name="pencil" size={12} color="white" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* User Details */}
              <View className="flex-1">
                <Text className="text-white text-lg font-semibold">
                  {user?.name || 'Anonymous User'}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {user?.email}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Member since {user?.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
                </Text>
              </View>

              {/* Edit Button */}
              <TouchableOpacity
                onPress={handleEditProfile}
                className="p-2"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Settings */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Quick Settings</Text>

          <View className="bg-gray-800 rounded-xl">
            {/* Notifications Toggle */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="notifications-outline" size={20} color="#9CA3AF" />
                <Text className="text-white text-base">Push Notifications</Text>
              </View>
              <Switch
                value={preferences?.notifications_enabled || false}
                onValueChange={updateNotificationPreference}
                trackColor={{ false: '#374151', true: '#DC2626' }}
                thumbColor={preferences?.notifications_enabled ? '#FFFFFF' : '#9CA3AF'}
                disabled={isUpdating}
              />
            </View>

            {/* Biometric Authentication Toggle */}
            {biometricAvailable && (
              <View className="flex-row items-center justify-between p-4">
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="finger-print-outline" size={20} color="#9CA3AF" />
                  <Text className="text-white text-base">Biometric Authentication</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={toggleBiometric}
                  trackColor={{ false: '#374151', true: '#DC2626' }}
                  thumbColor={biometricEnabled ? '#FFFFFF' : '#9CA3AF'}
                  disabled={isUpdating}
                />
              </View>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6 mb-6">
          <Text className="text-white text-lg font-semibold mb-4">Settings</Text>

          <View className="bg-gray-800 rounded-xl">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={item.onPress}
                className={`flex-row items-center justify-between p-4 ${
                  index < menuItems.length - 1 ? 'border-b border-gray-700' : ''
                }`}
                accessibilityLabel={item.title}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name={item.icon as any} size={20} color="#9CA3AF" />
                  <Text className="text-white text-base">{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-6 mb-8">
          <Text className="text-white text-lg font-semibold mb-4">Your Activity</Text>

          <View className="bg-gray-800 rounded-xl p-6">
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-red-500 text-2xl font-bold">0</Text>
                <Text className="text-gray-400 text-sm">Shows Tracked</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-red-500 text-2xl font-bold">0</Text>
                <Text className="text-gray-400 text-sm">Hours Watched</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-red-500 text-2xl font-bold">0</Text>
                <Text className="text-gray-400 text-sm">Friends</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sign Out Button */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-600 rounded-lg py-3 items-center"
            accessibilityLabel="Sign out"
          >
            <Text className="text-white text-base font-semibold">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}