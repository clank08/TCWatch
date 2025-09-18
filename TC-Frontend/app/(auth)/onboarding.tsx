import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUserPreferences } from '../../hooks/use-auth';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  options?: {
    id: string;
    label: string;
    description?: string;
    value: any;
  }[];
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TCWatch',
    description: 'Your personal True Crime content tracker across 200+ streaming platforms and cable networks.',
    icon: 'tv-outline',
  },
  {
    id: 'notifications',
    title: 'Stay Updated',
    description: 'Choose how you want to be notified about new content and updates.',
    icon: 'notifications-outline',
    options: [
      {
        id: 'push',
        label: 'Push Notifications',
        description: 'Get notified about new content and updates',
        value: 'notifications_enabled',
      },
      {
        id: 'digest',
        label: 'Weekly Digest',
        description: 'Receive a weekly summary of new True Crime content',
        value: 'digest_frequency',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters',
    description: 'Set your privacy preferences. You can always change these later.',
    icon: 'shield-checkmark-outline',
    options: [
      {
        id: 'private',
        label: 'Private Profile',
        description: 'Keep your watchlist and activity private',
        value: 'private',
      },
      {
        id: 'friends',
        label: 'Friends Only',
        description: 'Share with friends you connect with',
        value: 'friends',
      },
      {
        id: 'public',
        label: 'Public Profile',
        description: 'Let others discover your recommendations',
        value: 'public',
      },
    ],
  },
  {
    id: 'content-warnings',
    title: 'Content Warnings',
    description: 'True Crime content can be intense. We can show warnings for sensitive content.',
    icon: 'warning-outline',
    options: [
      {
        id: 'warnings-on',
        label: 'Show Content Warnings',
        description: 'Display warnings for graphic or sensitive content',
        value: true,
      },
      {
        id: 'warnings-off',
        label: 'No Content Warnings',
        description: 'I prefer to see all content without warnings',
        value: false,
      },
    ],
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, any>>({
    notifications_enabled: true,
    digest_frequency: 'weekly',
    privacy_level: 'private',
    content_warnings: true,
  });

  const { updatePreferences, isLoading } = useUserPreferences();

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleOptionSelect = (optionValue: any, preferenceKey?: string) => {
    if (preferenceKey) {
      setSelections(prev => ({
        ...prev,
        [preferenceKey]: optionValue,
      }));
    } else if (currentStepData.id === 'privacy') {
      setSelections(prev => ({
        ...prev,
        privacy_level: optionValue,
      }));
    } else if (currentStepData.id === 'content-warnings') {
      setSelections(prev => ({
        ...prev,
        content_warnings: optionValue,
      }));
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleFinishOnboarding();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleFinishOnboarding = async () => {
    try {
      await updatePreferences(selections);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      // Still navigate even if preferences fail to save
      router.replace('/(tabs)');
    }
  };

  const renderStep = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <View className="items-center">
            <View className="w-24 h-24 bg-red-600 rounded-full items-center justify-center mb-8">
              <Ionicons name={currentStepData.icon} size={40} color="white" />
            </View>
            <Text className="text-white text-3xl font-bold text-center mb-4">
              {currentStepData.title}
            </Text>
            <Text className="text-gray-400 text-center text-base leading-6 px-4">
              {currentStepData.description}
            </Text>

            <View className="mt-8 space-y-3">
              <View className="flex-row items-center space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 text-sm">Track across 200+ platforms</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 text-sm">Discover new True Crime content</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 text-sm">Connect with fellow enthusiasts</Text>
              </View>
              <View className="flex-row items-center space-x-3">
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-gray-300 text-sm">Privacy-first social features</Text>
              </View>
            </View>
          </View>
        );

      case 'notifications':
        return (
          <View className="items-center">
            <View className="w-20 h-20 bg-blue-600 rounded-full items-center justify-center mb-6">
              <Ionicons name={currentStepData.icon} size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {currentStepData.title}
            </Text>
            <Text className="text-gray-400 text-center text-base leading-6 mb-8">
              {currentStepData.description}
            </Text>

            <View className="w-full space-y-3">
              {currentStepData.options?.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`p-4 rounded-lg border-2 ${
                    (option.value === 'notifications_enabled' && selections.notifications_enabled) ||
                    (option.value === 'digest_frequency' && selections.digest_frequency === 'weekly')
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                  onPress={() => handleOptionSelect(
                    option.value === 'notifications_enabled' ? !selections.notifications_enabled : option.value,
                    option.value
                  )}
                  accessibilityRole="checkbox"
                  accessibilityState={{
                    checked: option.value === 'notifications_enabled'
                      ? selections.notifications_enabled
                      : selections.digest_frequency === 'weekly'
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-1">
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      )}
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      (option.value === 'notifications_enabled' && selections.notifications_enabled) ||
                      (option.value === 'digest_frequency' && selections.digest_frequency === 'weekly')
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-600'
                    }`}>
                      {((option.value === 'notifications_enabled' && selections.notifications_enabled) ||
                        (option.value === 'digest_frequency' && selections.digest_frequency === 'weekly')) && (
                        <Ionicons name="checkmark" size={12} color="white" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'privacy':
        return (
          <View className="items-center">
            <View className="w-20 h-20 bg-green-600 rounded-full items-center justify-center mb-6">
              <Ionicons name={currentStepData.icon} size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {currentStepData.title}
            </Text>
            <Text className="text-gray-400 text-center text-base leading-6 mb-8">
              {currentStepData.description}
            </Text>

            <View className="w-full space-y-3">
              {currentStepData.options?.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`p-4 rounded-lg border-2 ${
                    selections.privacy_level === option.value
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                  onPress={() => handleOptionSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selections.privacy_level === option.value }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-1">
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      )}
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selections.privacy_level === option.value
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-600'
                    }`}>
                      {selections.privacy_level === option.value && (
                        <View className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'content-warnings':
        return (
          <View className="items-center">
            <View className="w-20 h-20 bg-orange-600 rounded-full items-center justify-center mb-6">
              <Ionicons name={currentStepData.icon} size={32} color="white" />
            </View>
            <Text className="text-white text-2xl font-bold text-center mb-4">
              {currentStepData.title}
            </Text>
            <Text className="text-gray-400 text-center text-base leading-6 mb-8">
              {currentStepData.description}
            </Text>

            <View className="w-full space-y-3">
              {currentStepData.options?.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  className={`p-4 rounded-lg border-2 ${
                    selections.content_warnings === option.value
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-800'
                  }`}
                  onPress={() => handleOptionSelect(option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selections.content_warnings === option.value }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-1">
                        {option.label}
                      </Text>
                      {option.description && (
                        <Text className="text-gray-400 text-sm">
                          {option.description}
                        </Text>
                      )}
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      selections.content_warnings === option.value
                        ? 'border-orange-500 bg-orange-500'
                        : 'border-gray-600'
                    }`}>
                      {selections.content_warnings === option.value && (
                        <View className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-900">
      <StatusBar style="light" />

      {/* Progress Bar */}
      <View className="px-6 pt-12 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-gray-400 text-sm">
            Step {currentStep + 1} of {onboardingSteps.length}
          </Text>
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-gray-400 text-sm">Skip</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row space-x-2">
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              className={`flex-1 h-1 rounded ${
                index <= currentStep ? 'bg-red-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center px-6 py-8">
          {renderStep()}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-6 pb-8 pt-4">
        <View className="flex-row space-x-3">
          {currentStep > 0 && (
            <TouchableOpacity
              className="flex-1 border border-gray-600 rounded-lg py-3 items-center"
              onPress={handleBack}
              accessibilityLabel="Go back"
            >
              <Text className="text-gray-300 text-base font-medium">Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className={`${currentStep > 0 ? 'flex-1' : 'w-full'} bg-red-600 rounded-lg py-3 items-center ${
              isLoading ? 'opacity-70' : ''
            }`}
            onPress={handleNext}
            disabled={isLoading}
            accessibilityLabel={isLastStep ? 'Finish setup' : 'Continue'}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {isLastStep ? 'Get Started' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}