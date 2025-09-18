import React from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function DiscoverScreen() {
  return (
    <View className="flex-1 bg-gray-900 items-center justify-center">
      <StatusBar style="light" />
      <Text className="text-white text-xl">Discover Screen</Text>
      <Text className="text-gray-400 text-sm mt-2">Coming soon...</Text>
    </View>
  );
}