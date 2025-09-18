import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUser } from '../../hooks/use-auth';
import { z } from 'zod';

// Validation schema
const editProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
});

export default function EditProfileScreen() {
  const { user, updateProfile, isLoading } = useUser();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      editProfileSchema.parse(formData);
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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateProfile({
        name: formData.name,
        email: formData.email,
        avatar_url: formData.avatar_url,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);

        // TODO: In a real app, upload the image to your storage service
        // For now, we'll just use the local URI
        const imageUri = result.assets[0].uri;

        // Simulate upload delay
        setTimeout(() => {
          updateFormData('avatar_url', imageUri);
          setIsUploading(false);
        }, 1000);
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        return;
      }

      // Take photo
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);

        // TODO: In a real app, upload the image to your storage service
        const imageUri = result.assets[0].uri;

        // Simulate upload delay
        setTimeout(() => {
          updateFormData('avatar_url', imageUri);
          setIsUploading(false);
        }, 1000);
      }
    } catch (error) {
      setIsUploading(false);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      'Profile Photo',
      'Choose how to update your profile photo',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Photo Library', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeAvatar = () => {
    updateFormData('avatar_url', '');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <Text className="text-white text-lg font-semibold">Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading}
          className="p-2 -mr-2"
          accessibilityLabel="Save changes"
        >
          {isLoading ? (
            <ActivityIndicator color="#DC2626" size="small" />
          ) : (
            <Text className="text-red-500 text-base font-medium">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-6">
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="relative">
              {formData.avatar_url ? (
                <Image
                  source={{ uri: formData.avatar_url }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 bg-red-600 rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-bold">
                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}

              {/* Loading overlay */}
              {isUploading && (
                <View className="absolute inset-0 bg-black/50 rounded-full items-center justify-center">
                  <ActivityIndicator color="white" />
                </View>
              )}

              {/* Edit button */}
              <TouchableOpacity
                onPress={showImagePicker}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-600 rounded-full items-center justify-center"
                disabled={isUploading}
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>

            {/* Remove avatar option */}
            {formData.avatar_url && (
              <TouchableOpacity
                onPress={removeAvatar}
                className="mt-2"
                accessibilityLabel="Remove profile photo"
              >
                <Text className="text-red-500 text-sm">Remove Photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {/* Name Field */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Full Name</Text>
              <TextInput
                className={`bg-gray-800 border rounded-lg px-4 py-3 text-white text-base ${
                  errors.name ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
                accessibilityLabel="Full name"
                accessibilityHint="Enter your full name"
              />
              {errors.name && (
                <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>
              )}
            </View>

            {/* Email Field */}
            <View>
              <Text className="text-white text-sm font-medium mb-2">Email Address</Text>
              <TextInput
                className={`bg-gray-800 border rounded-lg px-4 py-3 text-white text-base ${
                  errors.email ? 'border-red-500' : 'border-gray-700'
                }`}
                placeholder="Enter your email address"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email address"
                accessibilityHint="Enter your email address"
              />
              {errors.email && (
                <Text className="text-red-500 text-sm mt-1">{errors.email}</Text>
              )}
            </View>

            {/* Info Section */}
            <View className="bg-gray-800 rounded-lg p-4 mt-6">
              <View className="flex-row items-start space-x-3">
                <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
                <View className="flex-1">
                  <Text className="text-blue-400 font-medium text-sm mb-1">
                    Profile Information
                  </Text>
                  <Text className="text-gray-300 text-sm leading-5">
                    Your profile information is used to personalize your experience and help
                    friends find you. Your email address is kept private.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}