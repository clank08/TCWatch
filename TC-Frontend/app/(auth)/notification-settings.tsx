import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useUserPreferences } from '../../hooks/use-auth';
import { TimePicker } from '../../components/ui/TimePicker';

interface NotificationPreference {
  key: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
}

interface QuietHoursSettings {
  enabled: boolean;
  startTime: Date;
  endTime: Date;
  timezone?: string;
}

export default function NotificationSettingsScreen() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [isUpdating, setIsUpdating] = useState(false);
  // Removed showStartTimePicker and showEndTimePicker state - handled by TimePicker component

  // Get device timezone
  const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezoneDisplay = deviceTimezone.replace(/_/g, ' ');

  // Initialize quiet hours settings with better default handling
  const [quietHours, setQuietHours] = useState<QuietHoursSettings>(() => {
    // Don't try to initialize from preferences on first render - they might not be loaded yet
    return {
      enabled: false,
      startTime: new Date(new Date().setHours(22, 0, 0, 0)),
      endTime: new Date(new Date().setHours(8, 0, 0, 0)),
      timezone: deviceTimezone,
    };
  });

  // Get notification settings from preferences or use defaults
  const getNotificationSetting = (key: string, defaultValue: boolean = true): boolean => {
    if (!preferences?.notificationSettings) {
      console.log('[NotificationSettings] No notificationSettings in preferences, using default:', defaultValue);
      return defaultValue;
    }
    const settings = preferences.notificationSettings as Record<string, any>;
    const value = settings[key] !== undefined ? settings[key] : defaultValue;
    console.log(`[NotificationSettings] Getting setting ${key}:`, value, 'from settings:', settings);
    return value;
  };

  // Track if we've initialized preferences from backend to prevent resets
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize notification preferences with default values - don't try to read backend settings during initialization
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([
    {
      key: 'newContentAlerts',
      title: 'New Content Alerts',
      description: 'Get notified when new True Crime content is available',
      icon: 'tv-outline',
      enabled: true, // Default value, will be updated from backend
    },
    {
      key: 'cableReminders',
      title: 'Cable TV Reminders',
      description: 'Reminders for shows airing on cable networks',
      icon: 'alarm-outline',
      enabled: true, // Default value, will be updated from backend
    },
    {
      key: 'friendActivity',
      title: 'Friend Activity',
      description: 'When friends add shows or create lists',
      icon: 'people-outline',
      enabled: false, // Default value, will be updated from backend
    },
    {
      key: 'weeklyDigest',
      title: 'Weekly Digest',
      description: 'Weekly summary of new content and activity',
      icon: 'mail-outline',
      enabled: true, // Default value, will be updated from backend
    },
    {
      key: 'systemAnnouncements',
      title: 'System Updates',
      description: 'App updates and important announcements',
      icon: 'settings-outline',
      enabled: false, // Default value, will be updated from backend
    },
    {
      key: 'listUpdates',
      title: 'List Updates',
      description: 'Updates to your lists and collections',
      icon: 'list-outline',
      enabled: true, // Default value, will be updated from backend
    },
    {
      key: 'friendRequests',
      title: 'Friend Requests',
      description: 'New friend requests and connections',
      icon: 'person-add-outline',
      enabled: true, // Default value, will be updated from backend
    },
  ]);

  // Initialize preferences from backend only once on mount
  useEffect(() => {
    // Only initialize if we haven't already and preferences are available AND not currently updating
    if (!hasInitialized && preferences?.notificationSettings && !isUpdating && !isLoading) {
      console.log('[NotificationSettings] First-time initialization from preferences');
      console.log('[NotificationSettings] notificationSettings:', preferences?.notificationSettings);
      console.log('[NotificationSettings] Full preferences object:', preferences);

      // Create a new array with updated enabled states from backend
      const updatedPrefs = notificationPrefs.map(pref => {
        const backendValue = getNotificationSetting(pref.key, pref.enabled);
        console.log(`[NotificationSettings] Setting ${pref.key} to ${backendValue} (default was ${pref.enabled})`);
        return {
          ...pref,
          enabled: backendValue,
        };
      });

      console.log('[NotificationSettings] Initializing notification prefs from preferences:', updatedPrefs);
      setNotificationPrefs(updatedPrefs);

      // Update quiet hours from preferences
      const quietHoursSettings = (preferences.notificationSettings as any).quietHours || {};
      console.log('[NotificationSettings] Initializing quiet hours from preferences:', quietHoursSettings);

      // Always update quiet hours state from backend preferences, even if some fields are missing
      setQuietHours({
        enabled: quietHoursSettings.enabled === true, // Explicitly check for true to handle undefined/null
        startTime: quietHoursSettings.startTime ? new Date(quietHoursSettings.startTime) : new Date(new Date().setHours(22, 0, 0, 0)),
        endTime: quietHoursSettings.endTime ? new Date(quietHoursSettings.endTime) : new Date(new Date().setHours(8, 0, 0, 0)),
        timezone: quietHoursSettings.timezone || deviceTimezone,
      });

      console.log('[NotificationSettings] Set quiet hours state to:', {
        enabled: quietHoursSettings.enabled === true,
        startTime: quietHoursSettings.startTime,
        endTime: quietHoursSettings.endTime,
        timezone: quietHoursSettings.timezone || deviceTimezone,
      });

      setHasInitialized(true);
    }
  }, [preferences?.notificationSettings, hasInitialized, isUpdating, isLoading]);

  // Reset hasInitialized when preferences change significantly (but not on every update)
  useEffect(() => {
    // If preferences become null/undefined, allow re-initialization when they're loaded again
    if (!preferences?.notificationSettings && hasInitialized) {
      console.log('[NotificationSettings] Preferences lost, allowing re-initialization');
      setHasInitialized(false);
    }
  }, [preferences?.notificationSettings, hasInitialized]);

  // Separate effect to handle digest frequency updates from backend
  useEffect(() => {
    const newDigestFrequency = (
      (preferences?.notificationSettings as any)?.digestFrequency ||
      preferences?.digestFrequency ||
      'weekly'
    );
    console.log('[NotificationSettings] Digest frequency effect triggered:', newDigestFrequency);
  }, [preferences?.notificationSettings, preferences?.digestFrequency]);

  const digestOptions = [
    { value: 'never', label: 'Never', description: 'No digest emails' },
    { value: 'daily', label: 'Daily', description: 'Every morning at 9 AM' },
    { value: 'weekly', label: 'Weekly', description: 'Every Monday at 9 AM' },
  ];

  // Get current digest frequency with fallback - prioritize notificationSettings, then preferences root level
  const currentDigestFrequency = (
    (preferences?.notificationSettings as any)?.digestFrequency ||
    preferences?.digestFrequency ||
    'weekly'
  );

  console.log('[NotificationSettings] Current digest frequency:', currentDigestFrequency, 'from preferences:', preferences);

  const updateNotificationPref = async (key: string, enabled: boolean) => {
    console.log(`[NotificationSettings] Updating ${key} to ${enabled}`);

    // Prevent updates while already updating
    if (isUpdating) {
      console.log('[NotificationSettings] Already updating, skipping');
      return;
    }

    setIsUpdating(true);

    // Update local state immediately for better UX
    setNotificationPrefs(prev =>
      prev.map(pref =>
        pref.key === key ? { ...pref, enabled } : pref
      )
    );

    try {
      // Get current notification settings or create new object
      const currentSettings = (preferences?.notificationSettings || {}) as Record<string, any>;
      // Update the specific notification setting
      const updatedSettings = {
        ...currentSettings,
        [key]: enabled,
      };

      // Handle special case for weeklyDigest
      if (key === 'weeklyDigest') {
        // When enabling weeklyDigest, also set digestFrequency to weekly
        if (enabled) {
          updatedSettings.digestFrequency = 'weekly';
        } else {
          // When disabling, set to never
          updatedSettings.digestFrequency = 'never';
        }
      }

      // Prepare the preferences update object
      const preferencesUpdate: any = {
        notificationSettings: updatedSettings,
      };

      // Also update the main notifications_enabled flag if it's the newContentAlerts toggle
      if (key === 'newContentAlerts') {
        preferencesUpdate.notifications_enabled = enabled;
        console.log('[NotificationSettings] Also updating notifications_enabled to:', enabled);
      }

      // Also update digestFrequency at root level if it's weeklyDigest
      if (key === 'weeklyDigest') {
        preferencesUpdate.digestFrequency = enabled ? 'weekly' : 'never';
      }

      console.log('[NotificationSettings] Full preferences update:', preferencesUpdate);

      // Save all notification settings to backend
      await updatePreferences(preferencesUpdate);

      console.log('[NotificationSettings] Successfully updated preferences');

      // Success - local state is already updated, no need to change it again

    } catch (error) {
      console.error('[NotificationSettings] Failed to update notification settings:', error);

      // Revert local state on error
      setNotificationPrefs(prev =>
        prev.map(pref =>
          pref.key === key ? { ...pref, enabled: !enabled } : pref
        )
      );
      Alert.alert(
        'Update Failed',
        'Failed to update notification settings. Please check your connection and try again.\n\nError: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDigestFrequency = async (frequency: 'never' | 'daily' | 'weekly') => {
    console.log('[NotificationSettings] updateDigestFrequency called with:', frequency);
    console.log('[NotificationSettings] Current frequency:', currentDigestFrequency);
    console.log('[NotificationSettings] isUpdating:', isUpdating);

    // Prevent updates while already updating, but allow same selection (for better UX)
    if (isUpdating) {
      console.log('[NotificationSettings] Already updating, skipping');
      return;
    }

    // If frequency is the same, still process it (user might be confirming selection)
    // Only skip if it's truly redundant
    if (currentDigestFrequency === frequency) {
      console.log('[NotificationSettings] Frequency already set to:', frequency, 'but allowing update for confirmation');
    }

    setIsUpdating(true);
    try {
      // Update both in notificationSettings and at the root level for compatibility
      const currentSettings = (preferences?.notificationSettings || {}) as Record<string, any>;
      const updatedSettings = {
        ...currentSettings,
        digestFrequency: frequency,
        // Also set the weeklyDigest toggle based on frequency
        weeklyDigest: frequency === 'weekly',
        dailyDigest: frequency === 'daily',
        // Ensure never option disables all digest toggles
        ...(frequency === 'never' && { weeklyDigest: false, dailyDigest: false })
      };

      console.log('[NotificationSettings] Updating preferences with:', {
        digestFrequency: frequency,
        notificationSettings: updatedSettings
      });

      await updatePreferences({
        digestFrequency: frequency,
        notificationSettings: updatedSettings
      });

      console.log('[NotificationSettings] Successfully updated digest frequency to:', frequency);
    } catch (error) {
      console.error('[NotificationSettings] Failed to update digest frequency:', error);
      Alert.alert(
        'Update Failed',
        'Failed to update email digest frequency. Please check your connection and try again.\n\nError: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const validateQuietHours = (startTime: Date, endTime: Date): { isValid: boolean; error?: string } => {
    // Check if times are valid dates
    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
      return { isValid: false, error: 'Invalid start time' };
    }
    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
      return { isValid: false, error: 'Invalid end time' };
    }

    // For quiet hours, it's okay if end time is before start time (spans midnight)
    // But we should warn user if they're the same
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (startMinutes === endMinutes) {
      return { isValid: false, error: 'Start and end time cannot be the same' };
    }

    return { isValid: true };
  };

  // Create a debounced version of saving quiet hours to backend
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<QuietHoursSettings | null>(null);

  const debouncedSaveQuietHours = useCallback((newQuietHours: QuietHoursSettings) => {
    // Store the pending save data
    pendingSaveRef.current = newQuietHours;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save after 1 second of no changes
    saveTimeoutRef.current = setTimeout(() => {
      console.log('[NotificationSettings] Debounced save triggered for quiet hours:', newQuietHours);
      updateQuietHours(newQuietHours, true); // Pass flag to indicate it's from debounce
      pendingSaveRef.current = null; // Clear pending save after completion
      saveTimeoutRef.current = null; // Clear timeout reference
    }, 1000);
  }, []);

  // Cleanup effect to save pending changes when component unmounts
  useEffect(() => {
    return () => {
      // If there's a pending save when component unmounts, execute it immediately
      if (pendingSaveRef.current) {
        console.log('[NotificationSettings] Component unmounting with pending save, executing immediately:', pendingSaveRef.current);

        // Clear the timeout to prevent duplicate saves
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        // Execute the pending save immediately
        // Note: This will be async but we can't await in cleanup
        updateQuietHours(pendingSaveRef.current, true);
        pendingSaveRef.current = null;
      }
    };
  }, []);

  // Effect to save notification preferences state when component unmounts
  useEffect(() => {
    return () => {
      console.log('[NotificationSettings] Component unmounting, ensuring all notification settings are saved');
      // The settings should already be saved via updateNotificationPref, but this ensures consistency
    };
  }, []);

  // Focus effect to refresh settings when user returns to the screen
  useFocusEffect(
    useCallback(() => {
      console.log('[NotificationSettings] Screen focused, checking if settings need refresh');

      // If we already have preferences and they're not being updated, refresh the local state
      if (preferences?.notificationSettings && !isUpdating && hasInitialized) {
        console.log('[NotificationSettings] Refreshing notification preferences from store on focus');

        const refreshedPrefs = notificationPrefs.map(pref => {
          const currentValue = getNotificationSetting(pref.key, pref.enabled);
          console.log(`[NotificationSettings] On focus: ${pref.key} is ${currentValue} (was ${pref.enabled})`);
          return {
            ...pref,
            enabled: currentValue,
          };
        });

        // Only update if there are actual changes
        const hasChanges = refreshedPrefs.some((pref, index) =>
          pref.enabled !== notificationPrefs[index].enabled
        );

        if (hasChanges) {
          console.log('[NotificationSettings] Detected changes, updating notification preferences');
          setNotificationPrefs(refreshedPrefs);
        }

        // Also refresh quiet hours, but only if not currently updating
        const quietHoursSettings = (preferences.notificationSettings as any).quietHours || {};
        const currentQuietHoursEnabled = quietHoursSettings.enabled === true;
        const hasQuietHoursChanges = (
          currentQuietHoursEnabled !== quietHours.enabled ||
          (quietHoursSettings.startTime && new Date(quietHoursSettings.startTime).getTime() !== quietHours.startTime.getTime()) ||
          (quietHoursSettings.endTime && new Date(quietHoursSettings.endTime).getTime() !== quietHours.endTime.getTime())
        );

        if (hasQuietHoursChanges && !isUpdating) {
          console.log('[NotificationSettings] Updating quiet hours on focus from backend');
          setQuietHours({
            enabled: currentQuietHoursEnabled,
            startTime: quietHoursSettings.startTime ? new Date(quietHoursSettings.startTime) : quietHours.startTime,
            endTime: quietHoursSettings.endTime ? new Date(quietHoursSettings.endTime) : quietHours.endTime,
            timezone: quietHoursSettings.timezone || quietHours.timezone,
          });
        }
      }
    }, [preferences?.notificationSettings, isUpdating, hasInitialized, notificationPrefs, quietHours, getNotificationSetting])
  );

  const updateQuietHours = async (updatedQuietHours: Partial<QuietHoursSettings> | QuietHoursSettings, fromDebounce = false) => {
    console.log('[NotificationSettings] updateQuietHours called with:', {
      updatedQuietHours,
      currentQuietHours: quietHours,
      isUpdating,
      fromDebounce
    });

    // Only check if updating when it's not from a debounce (for toggle changes)
    // Allow debounced saves to proceed even if updating
    if (!fromDebounce && isUpdating) {
      console.log('[NotificationSettings] Already updating, skipping this call');
      return;
    }

    // Store the current state before making changes for potential reversion
    const previousQuietHours = { ...quietHours };

    // Determine the new quiet hours values to use
    // If it's a complete object (from debounce), use it directly
    // Otherwise, use current local state and merge with the updates
    const newQuietHours = 'enabled' in updatedQuietHours && 'startTime' in updatedQuietHours
      ? updatedQuietHours as QuietHoursSettings
      : { ...quietHours, ...updatedQuietHours };

    console.log('[NotificationSettings] Previous state:', previousQuietHours);
    console.log('[NotificationSettings] New state for backend save:', newQuietHours);

    // Validate the new quiet hours settings
    if (newQuietHours.enabled && newQuietHours.startTime && newQuietHours.endTime) {
      const validation = validateQuietHours(newQuietHours.startTime, newQuietHours.endTime);
      if (!validation.isValid) {
        console.log('[NotificationSettings] Validation failed:', validation.error);
        Alert.alert('Invalid Time Settings', validation.error || 'Please check your time settings');
        // Revert the state if validation fails
        if (!fromDebounce) {
          setQuietHours(previousQuietHours);
        }
        return;
      }
    }

    // Only update local state if this is from debounce (time changes)
    // For toggle changes, the state is already updated by the Switch handler
    if (fromDebounce) {
      console.log('[NotificationSettings] Updating local state from debounce:', newQuietHours);
      setQuietHours(newQuietHours);
    }

    console.log('[NotificationSettings] Starting backend update...');
    setIsUpdating(true);
    try {
      // Get current notification settings and update quiet hours
      const currentSettings = (preferences?.notificationSettings || {}) as Record<string, any>;

      // Ensure we have valid dates before converting to ISO string
      if (!(newQuietHours.startTime instanceof Date) || isNaN(newQuietHours.startTime.getTime())) {
        throw new Error('Invalid start time');
      }
      if (!(newQuietHours.endTime instanceof Date) || isNaN(newQuietHours.endTime.getTime())) {
        throw new Error('Invalid end time');
      }

      const updatedSettings = {
        ...currentSettings,
        quietHours: {
          enabled: newQuietHours.enabled,
          startTime: newQuietHours.startTime.toISOString(),
          endTime: newQuietHours.endTime.toISOString(),
          timezone: newQuietHours.timezone || deviceTimezone,
        },
      };

      console.log('[NotificationSettings] Sending quiet hours update to backend:', {
        enabled: newQuietHours.enabled,
        startTime: newQuietHours.startTime.toISOString(),
        endTime: newQuietHours.endTime.toISOString(),
        timezone: newQuietHours.timezone || deviceTimezone,
      });

      console.log('[NotificationSettings] Calling updatePreferences with:', { notificationSettings: updatedSettings });
      await updatePreferences({ notificationSettings: updatedSettings });
      console.log('[NotificationSettings] Backend update completed successfully for quiet hours');
    } catch (error) {
      console.error('[NotificationSettings] Failed to update quiet hours:', error);
      // On error, revert the local state to the previous value
      console.log('[NotificationSettings] Reverting to previous state:', previousQuietHours);
      setQuietHours(previousQuietHours);

      Alert.alert(
        'Update Failed',
        'Failed to update quiet hours. Please check your connection and try again.\n\nError: ' +
        (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartTimeChange = (selectedDate: Date) => {
    console.log('[NotificationSettings] handleStartTimeChange called with:', {
      selectedDate,
      selectedDateISO: selectedDate?.toISOString(),
      currentStartTime: quietHours.startTime,
      currentStartTimeISO: quietHours.startTime?.toISOString()
    });
    // Update local state immediately without triggering save
    setQuietHours(prev => ({ ...prev, startTime: selectedDate }));
    // Debounce the actual save
    debouncedSaveQuietHours({ ...quietHours, startTime: selectedDate });
  };

  const handleEndTimeChange = (selectedDate: Date) => {
    console.log('[NotificationSettings] handleEndTimeChange called with:', {
      selectedDate,
      selectedDateISO: selectedDate?.toISOString(),
      currentEndTime: quietHours.endTime,
      currentEndTimeISO: quietHours.endTime?.toISOString()
    });
    // Update local state immediately without triggering save
    setQuietHours(prev => ({ ...prev, endTime: selectedDate }));
    // Debounce the actual save
    debouncedSaveQuietHours({ ...quietHours, endTime: selectedDate });
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

  // Navigate back to profile screen (not home)
  const handleBack = () => {
    // Use replace to go back to the profile tab
    router.replace('/(tabs)/profile');
  };

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
        <TouchableOpacity
          onPress={handleBack}
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
            {/* Debug info - remove in production */}
            {__DEV__ && (
              <Text className="text-gray-500 text-xs mb-2">
                Current: {currentDigestFrequency} | Updating: {isUpdating ? 'Yes' : 'No'}
              </Text>
            )}

            <View className="bg-gray-800 rounded-xl">
              {digestOptions.map((option, index) => {
                const isSelected = currentDigestFrequency === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      console.log('[NotificationSettings] Digest option pressed:', option.value);
                      updateDigestFrequency(option.value as any);
                    }}
                    className={`p-4 ${
                      index < digestOptions.length - 1 ? 'border-b border-gray-700' : ''
                    } ${isSelected ? 'bg-gray-750' : ''}`}
                    disabled={isUpdating}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${option.label} - ${option.description}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`font-medium text-base mb-1 ${
                          isSelected ? 'text-red-400' : 'text-white'
                        }`}>
                          {option.label}
                        </Text>
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      </View>
                      <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-600'
                      }`}>
                        {isSelected && (
                          <View className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Quiet Hours Section */}
          <View className="mb-8">
            <Text className="text-white text-lg font-semibold mb-2">Quiet Hours</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Pause notifications during specific hours
            </Text>

            <View className="bg-gray-800 rounded-xl">
              <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="moon-outline" size={20} color="#9CA3AF" />
                  <View>
                    <Text className="text-white text-base">Enable Quiet Hours</Text>
                    <Text className="text-gray-400 text-sm">
                      {format(quietHours.startTime, 'h:mm a')} - {format(quietHours.endTime, 'h:mm a')} ({timezoneDisplay})
                    </Text>
                  </View>
                </View>
                <Switch
                  value={quietHours.enabled}
                  onValueChange={(enabled) => {
                    console.log(`[NotificationSettings] Quiet hours toggle changed to: ${enabled}`);
                    // Update local state immediately for responsive UI
                    setQuietHours(prev => ({ ...prev, enabled }));
                    // Then save to backend (this will not interfere with local state)
                    updateQuietHours({ enabled });
                  }}
                  trackColor={{ false: '#374151', true: '#DC2626' }}
                  thumbColor={quietHours.enabled ? '#FFFFFF' : '#9CA3AF'}
                  disabled={isUpdating}
                />
              </View>

              {quietHours.enabled && (
                <>
                  <View className="border-b border-gray-700">
                    <TimePicker
                      value={quietHours.startTime}
                      onChange={handleStartTimeChange}
                      label="Start Time"
                      disabled={false}
                      testID="quiet-hours-start-time"
                    />
                  </View>

                  <TimePicker
                    value={quietHours.endTime}
                    onChange={handleEndTimeChange}
                    label="End Time"
                    disabled={false}
                    testID="quiet-hours-end-time"
                  />
                </>
              )}
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
                  • Quiet hours use your device's local time ({timezoneDisplay}){'\n'}
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