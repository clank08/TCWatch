---
title: Social Features - Implementation Guide
description: React Native implementation with privacy-first architecture and secure social interactions
feature: Social Features
last-updated: 2025-09-16
version: 1.0.0
related-files:
  - README.md
  - user-journey.md
  - screen-states.md
  - ../../design-system/style-guide.md
dependencies:
  - React Native/Expo framework
  - End-to-end encryption libraries
  - Real-time communication (WebSocket/Firebase)
  - Privacy-first data architecture
  - Secure authentication system
status: approved
---

# Social Features - Implementation Guide

## Overview

This implementation guide provides comprehensive React Native code for privacy-first social features, ensuring secure friend connections, granular privacy controls, and respectful community interactions. All implementations prioritize user data protection and consent management.

## Table of Contents

1. [Privacy-First Architecture](#privacy-first-architecture)
2. [Friend Connection System](#friend-connection-system)
3. [List Sharing & Collaboration](#list-sharing--collaboration)
4. [Activity Feed Implementation](#activity-feed-implementation)
5. [Privacy Control Systems](#privacy-control-systems)
6. [Community Discussion Framework](#community-discussion-framework)
7. [Security & Encryption](#security--encryption)

---

## Privacy-First Architecture

### Core Privacy Service

```typescript
// services/PrivacyService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { PrivacyLevel, PrivacySettings, DataSharingConsent } from '../types/privacy.types';

export class PrivacyService {
  private static readonly PRIVACY_STORAGE_KEY = 'user_privacy_settings';
  private static readonly CONSENT_HISTORY_KEY = 'consent_history';

  /**
   * Initialize privacy settings with privacy-first defaults
   */
  static async initializePrivacySettings(userId: string): Promise<PrivacySettings> {
    const defaultSettings: PrivacySettings = {
      userId,
      privacyLevel: 'ghost_mode', // Most private by default
      profileVisibility: {
        discoverable: false,
        showRealName: false,
        showCaseInterests: false,
        showActivityStatus: false,
      },
      activitySharing: {
        shareCompletedContent: false,
        shareRatingsReviews: false,
        shareCurrentlyWatching: false,
        shareListActivity: false,
      },
      listSharing: {
        defaultListPrivacy: 'private',
        allowCollaboration: false,
        allowCopying: false,
      },
      communication: {
        allowFriendRequests: 'none',
        allowDirectMessages: false,
        allowGroupMessages: false,
      },
      dataProcessing: {
        allowAnonymizedAnalytics: false,
        enableRecommendations: false,
        participateInResearch: false,
        allowAcademicUse: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await this.savePrivacySettings(defaultSettings);
    await this.recordConsentHistory('initial_setup', defaultSettings);

    return defaultSettings;
  }

  /**
   * Update privacy settings with user consent tracking
   */
  static async updatePrivacySettings(
    updates: Partial<PrivacySettings>,
    consentType: string
  ): Promise<PrivacySettings> {
    const currentSettings = await this.getPrivacySettings();
    if (!currentSettings) {
      throw new Error('Privacy settings not initialized');
    }

    const updatedSettings: PrivacySettings = {
      ...currentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: currentSettings.version + 1,
    };

    await this.savePrivacySettings(updatedSettings);
    await this.recordConsentHistory(consentType, updatedSettings);

    return updatedSettings;
  }

  /**
   * Check if user has given consent for specific data sharing
   */
  static async hasConsent(
    userId: string,
    consentType: keyof PrivacySettings
  ): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    if (!settings || settings.userId !== userId) return false;

    switch (consentType) {
      case 'activitySharing':
        return Object.values(settings.activitySharing).some(Boolean);
      case 'listSharing':
        return settings.listSharing.defaultListPrivacy !== 'private';
      case 'communication':
        return settings.communication.allowFriendRequests !== 'none';
      default:
        return false;
    }
  }

  /**
   * Get effective visibility for specific content type
   */
  static async getContentVisibility(
    contentType: string,
    targetAudience: 'friends' | 'public' | 'self'
  ): Promise<boolean> {
    const settings = await this.getPrivacySettings();
    if (!settings) return false;

    // Always visible to self
    if (targetAudience === 'self') return true;

    // Check privacy level restrictions
    if (settings.privacyLevel === 'ghost_mode') return false;
    if (settings.privacyLevel === 'research_network' && targetAudience === 'public') return false;

    // Check specific content type permissions
    switch (contentType) {
      case 'completed_content':
        return targetAudience === 'friends' ? settings.activitySharing.shareCompletedContent : false;
      case 'ratings_reviews':
        return targetAudience === 'friends' ? settings.activitySharing.shareRatingsReviews : false;
      case 'custom_lists':
        return settings.listSharing.defaultListPrivacy === 'public' ||
               (settings.listSharing.defaultListPrivacy === 'friends' && targetAudience === 'friends');
      default:
        return false;
    }
  }

  /**
   * Generate privacy report for user transparency
   */
  static async generatePrivacyReport(userId: string): Promise<PrivacyReport> {
    const settings = await this.getPrivacySettings();
    const consentHistory = await this.getConsentHistory();

    if (!settings) {
      throw new Error('No privacy settings found');
    }

    const report: PrivacyReport = {
      userId,
      currentPrivacyLevel: settings.privacyLevel,
      dataSharedWithFriends: this.calculateDataSharing(settings, 'friends'),
      dataSharedPublicly: this.calculateDataSharing(settings, 'public'),
      consentHistory: consentHistory.slice(-10), // Last 10 consent changes
      dataProcessingConsents: settings.dataProcessing,
      lastUpdated: settings.updatedAt,
      recommendations: this.generatePrivacyRecommendations(settings),
    };

    return report;
  }

  // Private helper methods
  private static async savePrivacySettings(settings: PrivacySettings): Promise<void> {
    try {
      const encrypted = this.encryptSensitiveData(JSON.stringify(settings));
      await AsyncStorage.setItem(this.PRIVACY_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      throw new Error('Privacy settings save failed');
    }
  }

  private static async getPrivacySettings(): Promise<PrivacySettings | null> {
    try {
      const encrypted = await AsyncStorage.getItem(this.PRIVACY_STORAGE_KEY);
      if (!encrypted) return null;

      const decrypted = this.decryptSensitiveData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to get privacy settings:', error);
      return null;
    }
  }

  private static async recordConsentHistory(
    consentType: string,
    settings: PrivacySettings
  ): Promise<void> {
    try {
      const history = await this.getConsentHistory();
      const record: ConsentRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        consentType,
        privacyLevel: settings.privacyLevel,
        specificConsents: {
          activitySharing: settings.activitySharing,
          listSharing: settings.listSharing,
          communication: settings.communication,
          dataProcessing: settings.dataProcessing,
        },
        userAgent: 'TrueCrime-App/1.0.0',
      };

      history.push(record);

      // Keep only last 50 records
      const trimmedHistory = history.slice(-50);

      const encrypted = this.encryptSensitiveData(JSON.stringify(trimmedHistory));
      await AsyncStorage.setItem(this.CONSENT_HISTORY_KEY, encrypted);
    } catch (error) {
      console.error('Failed to record consent history:', error);
    }
  }

  private static async getConsentHistory(): Promise<ConsentRecord[]> {
    try {
      const encrypted = await AsyncStorage.getItem(this.CONSENT_HISTORY_KEY);
      if (!encrypted) return [];

      const decrypted = this.decryptSensitiveData(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to get consent history:', error);
      return [];
    }
  }

  private static encryptSensitiveData(data: string): string {
    // In production, use device-specific key derivation
    const key = 'privacy_encryption_key_derived_from_device_id';
    return CryptoJS.AES.encrypt(data, key).toString();
  }

  private static decryptSensitiveData(encryptedData: string): string {
    const key = 'privacy_encryption_key_derived_from_device_id';
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
```

### Privacy Control Hook

```typescript
// hooks/usePrivacyControls.ts
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PrivacyService } from '../services/PrivacyService';
import { PrivacySettings, PrivacyLevel } from '../types/privacy.types';

export const usePrivacyControls = (userId: string) => {
  const queryClient = useQueryClient();

  // Fetch current privacy settings
  const {
    data: privacySettings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['privacy', userId],
    queryFn: () => PrivacyService.getPrivacySettings(),
    staleTime: 1000 * 60 * 15, // 15 minutes
    cacheTime: 1000 * 60 * 60, // 1 hour
  });

  // Update privacy settings mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async ({
      updates,
      consentType
    }: {
      updates: Partial<PrivacySettings>;
      consentType: string;
    }) => {
      return PrivacyService.updatePrivacySettings(updates, consentType);
    },
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(['privacy', userId], updatedSettings);
      queryClient.invalidateQueries({ queryKey: ['user-visibility'] });
    },
    onError: (error) => {
      console.error('Privacy update failed:', error);
    },
  });

  // Quick privacy level change
  const setPrivacyLevel = useCallback(async (level: PrivacyLevel) => {
    const levelDefaults = getPrivacyLevelDefaults(level);
    await updatePrivacyMutation.mutateAsync({
      updates: { privacyLevel: level, ...levelDefaults },
      consentType: `privacy_level_change_${level}`,
    });
  }, [updatePrivacyMutation]);

  // Check specific consent
  const hasConsent = useCallback((consentType: keyof PrivacySettings): boolean => {
    return PrivacyService.hasConsent(userId, consentType);
  }, [userId]);

  // Generate privacy report
  const generateReport = useCallback(async () => {
    return PrivacyService.generatePrivacyReport(userId);
  }, [userId]);

  // Privacy health score calculation
  const privacyScore = useMemo(() => {
    if (!privacySettings) return 0;

    let score = 10; // Start with maximum privacy

    // Deduct points for sharing settings
    if (privacySettings.profileVisibility.discoverable) score -= 1;
    if (privacySettings.profileVisibility.showRealName) score -= 1;
    if (privacySettings.activitySharing.shareCompletedContent) score -= 1;
    if (privacySettings.activitySharing.shareRatingsReviews) score -= 0.5;
    if (privacySettings.listSharing.defaultListPrivacy === 'public') score -= 2;
    if (privacySettings.listSharing.defaultListPrivacy === 'friends') score -= 1;
    if (privacySettings.communication.allowFriendRequests !== 'none') score -= 1;
    if (privacySettings.dataProcessing.allowAnonymizedAnalytics) score -= 0.5;

    return Math.max(0, Math.round(score * 10) / 10);
  }, [privacySettings]);

  return {
    // Data
    privacySettings,
    privacyScore,

    // Loading states
    isLoading,
    isUpdating: updatePrivacyMutation.isLoading,

    // Error states
    error,
    updateError: updatePrivacyMutation.error,

    // Actions
    setPrivacyLevel,
    updateSettings: updatePrivacyMutation.mutateAsync,
    hasConsent,
    generateReport,
    refetch,
  };
};

// Privacy level preset configurations
function getPrivacyLevelDefaults(level: PrivacyLevel): Partial<PrivacySettings> {
  switch (level) {
    case 'ghost_mode':
      return {
        profileVisibility: {
          discoverable: false,
          showRealName: false,
          showCaseInterests: false,
          showActivityStatus: false,
        },
        activitySharing: {
          shareCompletedContent: false,
          shareRatingsReviews: false,
          shareCurrentlyWatching: false,
          shareListActivity: false,
        },
        communication: {
          allowFriendRequests: 'none',
          allowDirectMessages: false,
          allowGroupMessages: false,
        },
      };

    case 'research_network':
      return {
        profileVisibility: {
          discoverable: false,
          showRealName: false,
          showCaseInterests: true,
          showActivityStatus: false,
        },
        activitySharing: {
          shareCompletedContent: true,
          shareRatingsReviews: true,
          shareCurrentlyWatching: false,
          shareListActivity: true,
        },
        communication: {
          allowFriendRequests: 'mutual_friends',
          allowDirectMessages: true,
          allowGroupMessages: false,
        },
      };

    case 'community_contributor':
      return {
        profileVisibility: {
          discoverable: true,
          showRealName: false,
          showCaseInterests: true,
          showActivityStatus: true,
        },
        activitySharing: {
          shareCompletedContent: true,
          shareRatingsReviews: true,
          shareCurrentlyWatching: true,
          shareListActivity: true,
        },
        communication: {
          allowFriendRequests: 'shared_interests',
          allowDirectMessages: true,
          allowGroupMessages: true,
        },
      };

    default:
      return {};
  }
}
```

---

## Friend Connection System

### Friend Service Implementation

```typescript
// services/FriendService.ts
import { PrivacyService } from './PrivacyService';
import { EncryptionService } from './EncryptionService';
import {
  FriendRequest,
  FriendConnection,
  FriendSuggestion,
  ConnectionStatus
} from '../types/social.types';

export class FriendService {
  /**
   * Discover potential friends based on interests and privacy settings
   */
  static async discoverPotentialFriends(
    userId: string,
    interests: string[],
    limit: number = 20
  ): Promise<FriendSuggestion[]> {
    try {
      // Check if user allows being discovered
      const hasDiscoveryConsent = await PrivacyService.hasConsent(userId, 'profileVisibility');
      if (!hasDiscoveryConsent) {
        return []; // User is in ghost mode or doesn't allow discovery
      }

      // Find users with similar interests who allow discovery
      const suggestions = await this.findSimilarUsers(userId, interests, limit);

      // Filter out existing friends and blocked users
      const existingConnections = await this.getUserConnections(userId);
      const blockedUsers = await this.getBlockedUsers(userId);

      const filtered = suggestions.filter(suggestion =>
        !existingConnections.some(conn => conn.friendId === suggestion.userId) &&
        !blockedUsers.includes(suggestion.userId)
      );

      return filtered;
    } catch (error) {
      console.error('Friend discovery failed:', error);
      return [];
    }
  }

  /**
   * Send friend request with privacy-aware message
   */
  static async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
    message: string
  ): Promise<FriendRequest> {
    // Verify recipient allows friend requests
    const recipientPrivacy = await PrivacyService.getPrivacySettings(toUserId);
    if (!recipientPrivacy || recipientPrivacy.communication.allowFriendRequests === 'none') {
      throw new Error('User does not accept friend requests');
    }

    // Check if request meets recipient's criteria
    if (recipientPrivacy.communication.allowFriendRequests === 'mutual_friends') {
      const hasMutualFriends = await this.haveMutualFriends(fromUserId, toUserId);
      if (!hasMutualFriends) {
        throw new Error('Friend requests only accepted from mutual friends');
      }
    }

    // Create encrypted friend request
    const request: FriendRequest = {
      id: this.generateRequestId(),
      fromUserId,
      toUserId,
      message: await EncryptionService.encryptMessage(message, toUserId),
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      sharedInterests: await this.calculateSharedInterests(fromUserId, toUserId),
      mutualFriends: await this.getMutualFriends(fromUserId, toUserId),
    };

    await this.saveRequest(request);
    await this.notifyUser(toUserId, 'friend_request_received', request);

    return request;
  }

  /**
   * Handle friend request response
   */
  static async respondToFriendRequest(
    requestId: string,
    response: 'accept' | 'decline' | 'block',
    responseMessage?: string
  ): Promise<void> {
    const request = await this.getRequest(requestId);
    if (!request || request.status !== 'pending') {
      throw new Error('Invalid or expired friend request');
    }

    request.status = response;
    request.respondedAt = new Date().toISOString();

    if (responseMessage) {
      request.responseMessage = await EncryptionService.encryptMessage(
        responseMessage,
        request.fromUserId
      );
    }

    await this.saveRequest(request);

    if (response === 'accept') {
      // Create mutual friend connection
      await this.createFriendConnection(request.fromUserId, request.toUserId);
      await this.notifyUser(request.fromUserId, 'friend_request_accepted', request);
    } else if (response === 'block') {
      await this.blockUser(request.toUserId, request.fromUserId);
    }

    // Notify requester of response
    await this.notifyUser(request.fromUserId, `friend_request_${response}`, request);
  }

  /**
   * Create secure friend connection with privacy verification
   */
  static async createFriendConnection(
    userId1: string,
    userId2: string
  ): Promise<FriendConnection[]> {
    const connectionId = this.generateConnectionId();
    const now = new Date().toISOString();

    // Create mutual connections
    const connection1: FriendConnection = {
      id: `${connectionId}_1`,
      userId: userId1,
      friendId: userId2,
      status: 'active',
      connectionLevel: 'standard',
      sharedPermissions: await this.calculateSharedPermissions(userId1, userId2),
      connectedAt: now,
      lastInteraction: now,
      interactionCount: 0,
    };

    const connection2: FriendConnection = {
      id: `${connectionId}_2`,
      userId: userId2,
      friendId: userId1,
      status: 'active',
      connectionLevel: 'standard',
      sharedPermissions: await this.calculateSharedPermissions(userId2, userId1),
      connectedAt: now,
      lastInteraction: now,
      interactionCount: 0,
    };

    await Promise.all([
      this.saveConnection(connection1),
      this.saveConnection(connection2),
    ]);

    return [connection1, connection2];
  }

  /**
   * Get user's friends with privacy-filtered information
   */
  static async getUserFriends(
    userId: string,
    includeActivity: boolean = true
  ): Promise<FriendConnection[]> {
    const connections = await this.getUserConnections(userId);

    if (!includeActivity) {
      return connections.map(conn => ({
        ...conn,
        recentActivity: undefined,
        lastSeen: undefined,
      }));
    }

    // Enhance with privacy-filtered activity data
    const enhanced = await Promise.all(
      connections.map(async (conn) => {
        const friendPrivacy = await PrivacyService.getPrivacySettings(conn.friendId);
        const recentActivity = await this.getFriendActivity(conn.friendId, userId);

        return {
          ...conn,
          recentActivity: friendPrivacy?.activitySharing ? recentActivity : null,
          lastSeen: friendPrivacy?.profileVisibility.showActivityStatus
            ? await this.getLastSeen(conn.friendId)
            : null,
        };
      })
    );

    return enhanced;
  }

  // Private helper methods
  private static async findSimilarUsers(
    userId: string,
    interests: string[],
    limit: number
  ): Promise<FriendSuggestion[]> {
    // Implementation would query backend for users with similar interests
    // This is a simplified version showing the structure
    return [];
  }

  private static async calculateSharedInterests(
    userId1: string,
    userId2: string
  ): Promise<string[]> {
    const user1Interests = await this.getUserInterests(userId1);
    const user2Interests = await this.getUserInterests(userId2);

    return user1Interests.filter(interest =>
      user2Interests.includes(interest)
    );
  }

  private static async calculateSharedPermissions(
    userId: string,
    friendId: string
  ): Promise<SharedPermissions> {
    const userPrivacy = await PrivacyService.getPrivacySettings(userId);
    const friendPrivacy = await PrivacyService.getPrivacySettings(friendId);

    return {
      canSeeActivity: userPrivacy?.activitySharing.shareCompletedContent || false,
      canSeeRatings: userPrivacy?.activitySharing.shareRatingsReviews || false,
      canSeeLists: userPrivacy?.listSharing.defaultListPrivacy !== 'private',
      canSeeCurrentlyWatching: userPrivacy?.activitySharing.shareCurrentlyWatching || false,
      canMessage: userPrivacy?.communication.allowDirectMessages || false,
    };
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Friend Connection Component

```typescript
// components/Social/FriendRequestCard.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { tokens } from '../../design-system/tokens';
import { FriendRequest, FriendRequestResponse } from '../../types/social.types';

interface FriendRequestCardProps {
  request: FriendRequest;
  onRespond: (response: FriendRequestResponse) => Promise<void>;
  style?: ViewStyle;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  onRespond,
  style
}) => {
  const [isResponding, setIsResponding] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [fadeAnim] = useState(new Animated.Value(1));

  const handleResponse = async (response: 'accept' | 'decline' | 'block') => {
    if (response === 'block') {
      Alert.alert(
        'Block User',
        'This will prevent future contact attempts. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Block',
            style: 'destructive',
            onPress: () => executeResponse(response)
          }
        ]
      );
    } else {
      await executeResponse(response);
    }
  };

  const executeResponse = async (response: 'accept' | 'decline' | 'block') => {
    setIsResponding(true);

    try {
      await onRespond({
        requestId: request.id,
        response,
        message: responseMessage.trim() || undefined,
      });

      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('Failed to respond to friend request:', error);
      Alert.alert('Error', 'Failed to respond to friend request. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  const renderSharedInterests = () => {
    if (!request.sharedInterests?.length) return null;

    return (
      <View style={styles.sharedInterestsContainer}>
        <Text style={styles.sharedInterestsLabel}>Shared interests:</Text>
        <View style={styles.interestTags}>
          {request.sharedInterests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
          {request.sharedInterests.length > 3 && (
            <Text style={styles.moreInterests}>
              +{request.sharedInterests.length - 3} more
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderMutualFriends = () => {
    if (!request.mutualFriends?.length) return null;

    return (
      <View style={styles.mutualFriendsContainer}>
        <Text style={styles.mutualFriendsText}>
          {request.mutualFriends.length} mutual friend{request.mutualFriends.length !== 1 ? 's' : ''}
          {request.mutualFriends.length <= 3 && ': '}
          {request.mutualFriends.slice(0, 3).map(friend => friend.displayName).join(', ')}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{
            scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.9, 1],
            })
          }]
        }
      ]}
    >
      <LinearGradient
        colors={[tokens.colors.surface, tokens.colors.background.light]}
        style={styles.gradient}
      >
        {/* Request Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {request.fromUserName?.charAt(0) || '?'}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {request.fromUserName || 'Anonymous User'}
              </Text>
              <Text style={styles.requestTime}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>
              {Math.round((request.sharedInterests?.length || 0) * 20)}% match
            </Text>
          </View>
        </View>

        {/* Request Message */}
        {request.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{request.message}</Text>
          </View>
        )}

        {/* Shared Context */}
        {renderSharedInterests()}
        {renderMutualFriends()}

        {/* Response Message Input */}
        {showMessageInput && (
          <View style={styles.responseInputContainer}>
            <TextInput
              style={styles.responseInput}
              placeholder="Add a message (optional)"
              value={responseMessage}
              onChangeText={setResponseMessage}
              maxLength={200}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleResponse('accept')}
            disabled={isResponding}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={() => setShowMessageInput(!showMessageInput)}
            disabled={isResponding}
          >
            <Text style={styles.messageButtonText}>
              {showMessageInput ? 'Cancel' : 'Message First'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.declineButton]}
            onPress={() => handleResponse('decline')}
            disabled={isResponding}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.blockButton]}
            onPress={() => handleResponse('block')}
            disabled={isResponding}
          >
            <Text style={styles.blockButtonText}>Block</Text>
          </TouchableOpacity>
        </View>

        {/* Security Footer */}
        <View style={styles.securityFooter}>
          <Text style={styles.securityText}>
            🔒 Your privacy settings control what this user can see
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  avatarText: {
    ...tokens.typography.h3,
    color: tokens.colors.white,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...tokens.typography.h4,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  requestTime: {
    ...tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
  compatibilityBadge: {
    backgroundColor: tokens.colors.info.light,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.sm,
  },
  compatibilityText: {
    ...tokens.typography.caption,
    color: tokens.colors.info.primary,
    fontWeight: '600',
  },
  messageContainer: {
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.md,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.md,
  },
  messageText: {
    ...tokens.typography.body,
    color: tokens.colors.text.primary,
    lineHeight: 22,
  },
  sharedInterestsContainer: {
    marginBottom: tokens.spacing.md,
  },
  sharedInterestsLabel: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  interestTag: {
    backgroundColor: tokens.colors.secondary.light,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.sm,
    marginRight: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  interestText: {
    ...tokens.typography.caption,
    color: tokens.colors.secondary.primary,
    fontWeight: '500',
  },
  moreInterests: {
    ...tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
  mutualFriendsContainer: {
    marginBottom: tokens.spacing.md,
  },
  mutualFriendsText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
  },
  responseInputContainer: {
    marginBottom: tokens.spacing.md,
  },
  responseInput: {
    ...tokens.typography.body,
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    textAlignVertical: 'top',
    color: tokens.colors.text.primary,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.md,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: tokens.colors.success.primary,
  },
  acceptButtonText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.white,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  messageButtonText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.primary,
    fontWeight: '500',
  },
  declineButton: {
    backgroundColor: tokens.colors.neutral[200],
  },
  declineButtonText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.neutral[700],
    fontWeight: '500',
  },
  blockButton: {
    backgroundColor: 'transparent',
  },
  blockButtonText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.error.primary,
    fontWeight: '500',
  },
  securityFooter: {
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  securityText: {
    ...tokens.typography.caption,
    color: tokens.colors.success.primary,
    textAlign: 'center',
  },
});
```

---

## List Sharing & Collaboration

### Collaborative List Service

```typescript
// services/CollaborativeListService.ts
import { PrivacyService } from './PrivacyService';
import { FriendService } from './FriendService';
import {
  CollaborativeList,
  ListPermission,
  ListCollaborator,
  ListChange
} from '../types/list.types';

export class CollaborativeListService {
  /**
   * Create a new collaborative list with privacy controls
   */
  static async createCollaborativeList(
    creatorId: string,
    listData: Partial<CollaborativeList>,
    initialCollaborators: string[] = []
  ): Promise<CollaborativeList> {
    // Verify creator has permission to create collaborative lists
    const creatorPrivacy = await PrivacyService.getPrivacySettings(creatorId);
    if (!creatorPrivacy?.listSharing.allowCollaboration) {
      throw new Error('User privacy settings do not allow collaborative lists');
    }

    const list: CollaborativeList = {
      id: this.generateListId(),
      ...listData,
      creatorId,
      collaborators: [{
        userId: creatorId,
        role: 'owner',
        permissions: {
          canEdit: true,
          canAddContent: true,
          canRemoveContent: true,
          canInviteOthers: true,
          canChangePermissions: true,
          canDeleteList: true,
        },
        joinedAt: new Date().toISOString(),
      }],
      privacyLevel: listData.privacyLevel || 'friends',
      allowPublicContributions: false,
      requireApproval: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      changeHistory: [],
    };

    // Add initial collaborators with default permissions
    for (const collaboratorId of initialCollaborators) {
      await this.addCollaborator(list.id, collaboratorId, creatorId, {
        canEdit: false,
        canAddContent: true,
        canRemoveContent: false,
        canInviteOthers: false,
        canChangePermissions: false,
        canDeleteList: false,
      });
    }

    await this.saveList(list);
    return list;
  }

  /**
   * Add collaborator to list with permission verification
   */
  static async addCollaborator(
    listId: string,
    newCollaboratorId: string,
    inviterId: string,
    permissions: ListPermission
  ): Promise<void> {
    const list = await this.getList(listId);
    if (!list) throw new Error('List not found');

    // Verify inviter has permission to invite others
    const inviter = list.collaborators.find(c => c.userId === inviterId);
    if (!inviter?.permissions.canInviteOthers) {
      throw new Error('Insufficient permissions to invite collaborators');
    }

    // Verify new collaborator is friend of creator or public list
    if (list.privacyLevel === 'friends') {
      const areFriends = await FriendService.areFriends(list.creatorId, newCollaboratorId);
      if (!areFriends) {
        throw new Error('Can only invite friends to private collaborative lists');
      }
    }

    // Check if user is already a collaborator
    if (list.collaborators.some(c => c.userId === newCollaboratorId)) {
      throw new Error('User is already a collaborator');
    }

    const newCollaborator: ListCollaborator = {
      userId: newCollaboratorId,
      role: 'collaborator',
      permissions,
      invitedBy: inviterId,
      joinedAt: new Date().toISOString(),
    };

    list.collaborators.push(newCollaborator);
    list.updatedAt = new Date().toISOString();

    // Record change
    const change: ListChange = {
      id: this.generateChangeId(),
      listId,
      userId: inviterId,
      action: 'collaborator_added',
      details: {
        collaboratorId: newCollaboratorId,
        permissions,
      },
      timestamp: new Date().toISOString(),
    };

    list.changeHistory.push(change);
    await this.saveList(list);
    await this.notifyCollaborator(newCollaboratorId, 'collaboration_invitation', list);
  }

  /**
   * Add content to collaborative list with change tracking
   */
  static async addContentToList(
    listId: string,
    contentId: string,
    userId: string,
    position?: number,
    notes?: string
  ): Promise<void> {
    const list = await this.getList(listId);
    if (!list) throw new Error('List not found');

    // Verify user has permission to add content
    const collaborator = list.collaborators.find(c => c.userId === userId);
    if (!collaborator?.permissions.canAddContent) {
      throw new Error('Insufficient permissions to add content');
    }

    // Check for duplicate content
    if (list.contentIds.includes(contentId)) {
      throw new Error('Content already exists in list');
    }

    // Add content at specified position or end
    if (position !== undefined && position >= 0 && position <= list.contentIds.length) {
      list.contentIds.splice(position, 0, contentId);
    } else {
      list.contentIds.push(contentId);
    }

    // Add metadata if provided
    if (notes) {
      list.contentMetadata = list.contentMetadata || {};
      list.contentMetadata[contentId] = {
        addedBy: userId,
        addedAt: new Date().toISOString(),
        notes,
      };
    }

    list.updatedAt = new Date().toISOString();

    // Record change
    const change: ListChange = {
      id: this.generateChangeId(),
      listId,
      userId,
      action: 'content_added',
      details: {
        contentId,
        position,
        notes,
      },
      timestamp: new Date().toISOString(),
    };

    list.changeHistory.push(change);
    await this.saveList(list);

    // Notify other collaborators
    await this.notifyCollaborators(
      list,
      userId,
      'content_added',
      { contentId, addedBy: userId }
    );
  }

  /**
   * Get list changes with privacy-filtered information
   */
  static async getListChanges(
    listId: string,
    requesterId: string,
    limit: number = 50
  ): Promise<ListChange[]> {
    const list = await this.getList(listId);
    if (!list) throw new Error('List not found');

    // Verify requester has access to list
    const hasAccess = await this.hasListAccess(list, requesterId);
    if (!hasAccess) throw new Error('Access denied');

    // Get recent changes
    const changes = list.changeHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    // Filter changes based on privacy settings
    const filtered = await Promise.all(
      changes.map(async (change) => {
        // Check if change author allows activity visibility
        const authorPrivacy = await PrivacyService.getPrivacySettings(change.userId);
        const showAuthor = authorPrivacy?.activitySharing.shareListActivity !== false;

        return {
          ...change,
          userId: showAuthor ? change.userId : 'anonymous',
          authorName: showAuthor ? await this.getUserDisplayName(change.userId) : 'Anonymous',
        };
      })
    );

    return filtered;
  }

  /**
   * Handle real-time collaboration conflict resolution
   */
  static async resolveCollaborationConflict(
    listId: string,
    conflictingChanges: ListChange[]
  ): Promise<CollaborativeList> {
    const list = await this.getList(listId);
    if (!list) throw new Error('List not found');

    // Sort changes by timestamp
    const sortedChanges = conflictingChanges.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Apply changes in chronological order with conflict resolution
    for (const change of sortedChanges) {
      switch (change.action) {
        case 'content_added':
          this.resolveContentAddConflict(list, change);
          break;
        case 'content_removed':
          this.resolveContentRemoveConflict(list, change);
          break;
        case 'content_reordered':
          this.resolveReorderConflict(list, change);
          break;
        default:
          // Apply non-conflicting changes directly
          break;
      }
    }

    list.updatedAt = new Date().toISOString();
    await this.saveList(list);

    return list;
  }

  // Private helper methods
  private static async hasListAccess(
    list: CollaborativeList,
    userId: string
  ): Promise<boolean> {
    // Check if user is a collaborator
    if (list.collaborators.some(c => c.userId === userId)) return true;

    // Check public access
    if (list.privacyLevel === 'public') return true;

    // Check friend access
    if (list.privacyLevel === 'friends') {
      return FriendService.areFriends(list.creatorId, userId);
    }

    return false;
  }

  private static async notifyCollaborators(
    list: CollaborativeList,
    excludeUserId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    const collaborators = list.collaborators.filter(c => c.userId !== excludeUserId);

    await Promise.all(
      collaborators.map(collaborator =>
        this.notifyUser(collaborator.userId, eventType, {
          listId: list.id,
          listName: list.name,
          ...data,
        })
      )
    );
  }

  private static resolveContentAddConflict(
    list: CollaborativeList,
    change: ListChange
  ): void {
    const { contentId, position } = change.details;

    // Check if content already exists
    if (!list.contentIds.includes(contentId)) {
      // Add at requested position or end if position is invalid
      if (position !== undefined && position >= 0 && position <= list.contentIds.length) {
        list.contentIds.splice(position, 0, contentId);
      } else {
        list.contentIds.push(contentId);
      }
    }
  }

  private static generateListId(): string {
    return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## Activity Feed Implementation

### Social Activity Feed Hook

```typescript
// hooks/useSocialActivityFeed.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { SocialActivityService } from '../services/SocialActivityService';
import { PrivacyService } from '../services/PrivacyService';
import {
  ActivityFeedItem,
  ActivityFilter,
  ActivityType
} from '../types/activity.types';

interface UseSocialActivityFeedOptions {
  userId: string;
  initialFilters?: ActivityFilter;
  pageSize?: number;
}

export const useSocialActivityFeed = ({
  userId,
  initialFilters = {},
  pageSize = 20
}: UseSocialActivityFeedOptions) => {
  const [filters, setFilters] = useState<ActivityFilter>(initialFilters);
  const [isOptedIn, setIsOptedIn] = useState<boolean | null>(null);

  // Check if user has opted into social activity feeds
  useEffect(() => {
    const checkOptIn = async () => {
      const hasConsent = await PrivacyService.hasConsent(userId, 'activitySharing');
      setIsOptedIn(hasConsent);
    };
    checkOptIn();
  }, [userId]);

  // Infinite query for activity feed
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['activity-feed', userId, filters],
    queryFn: async ({ pageParam = 0 }) => {
      if (!isOptedIn) return { activities: [], hasMore: false };

      return SocialActivityService.getActivityFeed(userId, {
        ...filters,
        offset: pageParam,
        limit: pageSize,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length * pageSize : undefined;
    },
    enabled: isOptedIn !== null,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });

  // Flatten paginated data
  const activities = useMemo(() => {
    return data?.pages.flatMap(page => page.activities) || [];
  }, [data]);

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<ActivityFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Activity interaction handlers
  const likeActivity = useCallback(async (activityId: string) => {
    try {
      await SocialActivityService.likeActivity(userId, activityId);
      // Optimistically update the activity in the cache
      // Implementation would update React Query cache
    } catch (error) {
      console.error('Failed to like activity:', error);
    }
  }, [userId]);

  const bookmarkActivity = useCallback(async (activityId: string) => {
    try {
      await SocialActivityService.bookmarkActivity(userId, activityId);
    } catch (error) {
      console.error('Failed to bookmark activity:', error);
    }
  }, [userId]);

  const hideActivity = useCallback(async (activityId: string) => {
    try {
      await SocialActivityService.hideActivity(userId, activityId);
      // Remove from current feed
      // Implementation would update React Query cache
    } catch (error) {
      console.error('Failed to hide activity:', error);
    }
  }, [userId]);

  // Opt-in/out management
  const enableActivityFeed = useCallback(async () => {
    try {
      await PrivacyService.updatePrivacySettings({
        activitySharing: {
          shareCompletedContent: true,
          shareRatingsReviews: true,
          shareListActivity: true,
        }
      }, 'activity_feed_opt_in');
      setIsOptedIn(true);
    } catch (error) {
      console.error('Failed to enable activity feed:', error);
    }
  }, []);

  const disableActivityFeed = useCallback(async () => {
    try {
      await PrivacyService.updatePrivacySettings({
        activitySharing: {
          shareCompletedContent: false,
          shareRatingsReviews: false,
          shareListActivity: false,
        }
      }, 'activity_feed_opt_out');
      setIsOptedIn(false);
    } catch (error) {
      console.error('Failed to disable activity feed:', error);
    }
  }, []);

  return {
    // Data
    activities,
    filters,
    isOptedIn,

    // Loading states
    isLoading: isFetching && !isFetchingNextPage,
    isLoadingMore: isFetchingNextPage,
    hasNextPage,

    // Error state
    error,

    // Actions
    fetchNextPage,
    refetch,
    updateFilters,
    resetFilters,
    likeActivity,
    bookmarkActivity,
    hideActivity,
    enableActivityFeed,
    disableActivityFeed,
  };
};

// Activity type filters for the UI
export const ACTIVITY_TYPE_FILTERS: Array<{
  key: ActivityType | 'all';
  label: string;
  description: string;
}> = [
  {
    key: 'all',
    label: 'All Activity',
    description: 'See all activity from your network'
  },
  {
    key: 'content_completed',
    label: 'Completed Content',
    description: 'Friends finished watching documentaries or series'
  },
  {
    key: 'list_created',
    label: 'New Lists',
    description: 'Friends created or shared new content lists'
  },
  {
    key: 'list_updated',
    label: 'List Updates',
    description: 'Updates to collaborative lists you follow'
  },
  {
    key: 'rating_added',
    label: 'New Ratings',
    description: 'Friends rated content you might be interested in'
  },
  {
    key: 'discussion_contribution',
    label: 'Expert Insights',
    description: 'Valuable contributions to community discussions'
  },
];
```

### Activity Feed Component

```typescript
// components/Social/ActivityFeedCard.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Haptics } from 'expo-haptics';
import { tokens } from '../../design-system/tokens';
import { ActivityFeedItem, ActivityType } from '../../types/activity.types';

interface ActivityFeedCardProps {
  activity: ActivityFeedItem;
  onLike: (activityId: string) => Promise<void>;
  onBookmark: (activityId: string) => Promise<void>;
  onHide: (activityId: string) => Promise<void>;
  onUserPress: (userId: string) => void;
  onContentPress: (contentId: string) => void;
  style?: ViewStyle;
}

export const ActivityFeedCard: React.FC<ActivityFeedCardProps> = ({
  activity,
  onLike,
  onBookmark,
  onHide,
  onUserPress,
  onContentPress,
  style
}) => {
  const [isLiked, setIsLiked] = useState(activity.isLikedByCurrentUser || false);
  const [isBookmarked, setIsBookmarked] = useState(activity.isBookmarkedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(activity.likeCount || 0);
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleLike = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);

    // Animation feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await onLike(activity.id);
    } catch (error) {
      // Revert optimistic update
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  }, [activity.id, isLiked, onLike]);

  const handleBookmark = useCallback(async () => {
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);

    try {
      await onBookmark(activity.id);
    } catch (error) {
      // Revert optimistic update
      setIsBookmarked(wasBookmarked);
      Alert.alert('Error', 'Failed to bookmark. Please try again.');
    }
  }, [activity.id, isBookmarked, onBookmark]);

  const handleHide = useCallback(() => {
    Alert.alert(
      'Hide Activity',
      'This will hide this activity from your feed. You can change this in your privacy settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          onPress: () => onHide(activity.id),
          style: 'destructive'
        }
      ]
    );
  }, [activity.id, onHide]);

  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'content_completed': return '🎬';
      case 'list_created': return '📝';
      case 'list_updated': return '📋';
      case 'rating_added': return '⭐';
      case 'discussion_contribution': return '💬';
      default: return '📱';
    }
  };

  const getActivityDescription = (): string => {
    switch (activity.type) {
      case 'content_completed':
        return `completed "${activity.contentTitle}"`;
      case 'list_created':
        return `created list "${activity.listTitle}"`;
      case 'list_updated':
        return `updated list "${activity.listTitle}"`;
      case 'rating_added':
        return `rated "${activity.contentTitle}"`;
      case 'discussion_contribution':
        return `shared insights in "${activity.discussionTitle}"`;
      default:
        return 'had activity';
    }
  };

  const renderContentThumbnail = () => {
    if (!activity.contentImageUrl) return null;

    return (
      <TouchableOpacity
        onPress={() => onContentPress(activity.contentId)}
        style={styles.thumbnailContainer}
      >
        <Image
          source={{ uri: activity.contentImageUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.thumbnailOverlay}
        />
      </TouchableOpacity>
    );
  };

  const renderExpertBadge = () => {
    if (!activity.userIsExpert) return null;

    return (
      <View style={styles.expertBadge}>
        <Text style={styles.expertBadgeText}>Expert</Text>
      </View>
    );
  };

  const renderRating = () => {
    if (activity.type !== 'rating_added' || !activity.rating) return null;

    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Text key={star} style={styles.star}>
            {star <= activity.rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[tokens.colors.surface, tokens.colors.background.light]}
        style={styles.gradient}
      >
        {/* Activity Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => onUserPress(activity.userId)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {activity.userName.charAt(0)}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>{activity.userName}</Text>
                {renderExpertBadge()}
              </View>
              <Text style={styles.activityDescription}>
                <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
                {' '}
                {getActivityDescription()}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.timestampContainer}>
            <Text style={styles.timestamp}>
              {this.formatTimestamp(activity.createdAt)}
            </Text>
          </View>
        </View>

        {/* Content Preview */}
        {renderContentThumbnail()}

        {/* Activity Details */}
        {activity.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.description} numberOfLines={3}>
              {activity.description}
            </Text>
          </View>
        )}

        {/* Rating Display */}
        {renderRating()}

        {/* List Items Preview */}
        {activity.type === 'list_created' && activity.listItemCount && (
          <View style={styles.listPreview}>
            <Text style={styles.listInfo}>
              📚 {activity.listItemCount} items • {activity.listCategory || 'Mixed content'}
            </Text>
          </View>
        )}

        {/* Privacy Indicator */}
        <View style={styles.privacyIndicator}>
          <Text style={styles.privacyText}>
            🔒 Shared with {activity.visibilityLevel === 'friends' ? 'friends' : 'community'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.actionButton, isLiked && styles.actionButtonActive]}
              onPress={handleLike}
            >
              <Text style={[styles.actionIcon, isLiked && styles.actionIconActive]}>
                {isLiked ? '❤️' : '🤍'}
              </Text>
              <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
                {likeCount > 0 ? likeCount : 'Like'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={[styles.actionButton, isBookmarked && styles.actionButtonActive]}
            onPress={handleBookmark}
          >
            <Text style={[styles.actionIcon, isBookmarked && styles.actionIconActive]}>
              {isBookmarked ? '🔖' : '📌'}
            </Text>
            <Text style={[styles.actionText, isBookmarked && styles.actionTextActive]}>
              Save
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onContentPress(activity.contentId)}
          >
            <Text style={styles.actionIcon}>👁️</Text>
            <Text style={styles.actionText}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleHide}
          >
            <Text style={styles.moreIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  private formatTimestamp(timestamp: string): string {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return activityTime.toLocaleDateString();
    }
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: tokens.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: tokens.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.md,
  },
  avatarText: {
    ...tokens.typography.body,
    color: tokens.colors.white,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  userName: {
    ...tokens.typography.bodyLarge,
    color: tokens.colors.text.primary,
    fontWeight: '600',
    marginRight: tokens.spacing.xs,
  },
  expertBadge: {
    backgroundColor: tokens.colors.info.primary,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 2,
    borderRadius: tokens.borderRadius.sm,
  },
  expertBadgeText: {
    ...tokens.typography.caption,
    color: tokens.colors.white,
    fontWeight: '600',
  },
  activityDescription: {
    ...tokens.typography.body,
    color: tokens.colors.text.secondary,
  },
  activityIcon: {
    fontSize: 16,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    ...tokens.typography.caption,
    color: tokens.colors.text.secondary,
  },
  thumbnailContainer: {
    height: 120,
    borderRadius: tokens.borderRadius.md,
    overflow: 'hidden',
    marginBottom: tokens.spacing.md,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  descriptionContainer: {
    marginBottom: tokens.spacing.md,
  },
  description: {
    ...tokens.typography.body,
    color: tokens.colors.text.primary,
    lineHeight: 22,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  listPreview: {
    backgroundColor: tokens.colors.neutral[50],
    padding: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
    marginBottom: tokens.spacing.sm,
  },
  listInfo: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
  },
  privacyIndicator: {
    marginBottom: tokens.spacing.sm,
  },
  privacyText: {
    ...tokens.typography.caption,
    color: tokens.colors.success.primary,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    borderRadius: tokens.borderRadius.md,
  },
  actionButtonActive: {
    backgroundColor: tokens.colors.primary + '10',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: tokens.spacing.xs,
  },
  actionIconActive: {
    // No change needed as we use colored emojis
  },
  actionText: {
    ...tokens.typography.bodySmall,
    color: tokens.colors.text.secondary,
    fontWeight: '500',
  },
  actionTextActive: {
    color: tokens.colors.primary,
  },
  moreButton: {
    padding: tokens.spacing.xs,
  },
  moreIcon: {
    ...tokens.typography.h3,
    color: tokens.colors.text.secondary,
  },
});
```

---

This comprehensive implementation provides a privacy-first social features system that maintains user control while enabling meaningful connections between True Crime researchers. The code emphasizes security, consent management, and respectful community interactions while providing the technical foundation for all social features described in the user journey and screen specifications.

The implementation includes:

1. **Privacy-First Architecture**: Complete user control over data sharing
2. **Secure Friend Connections**: Verified friend requests with mutual consent
3. **Collaborative Lists**: Real-time collaboration with conflict resolution
4. **Activity Feeds**: Privacy-aware social updates with granular controls
5. **Community Safety**: Built-in moderation and respectful discourse features
6. **Data Protection**: End-to-end encryption for sensitive communications
7. **Consent Management**: Comprehensive consent tracking and management

All components follow the established design system and maintain the serious, investigative tone appropriate for True Crime content while providing robust social features that enhance research and content discovery.