import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useMessaging } from '../../../contexts/MessagingContext';
import DashboardDataState from '../../common/DashboardDataState';

const BaseMessagesTab = ({
  navigation,
  refreshing,
  onRefresh,
  userRole,
  emptyStateIcon = 'chatbubble-ellipses-outline',
  emptyStateTitle = 'No conversations yet',
  emptyStateSubtitle = 'Messages will appear here',
  showUnreadBadge = true,
  maxAvatarSize = 40,
  customStyles = {},
}) => {
  const { user } = useAuth();
  const {
    conversations,
    conversationsStatus,
    conversationsLoading,
    conversationsError,
    subscribeToConversations,
    clearConversationsError,
  } = useMessaging();

  const userId = user?.id || user?.uid;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    subscribeToConversations(userId, userRole);
    return () => {
      subscribeToConversations(null);
    };
  }, [subscribeToConversations, userId, userRole]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
    if (userId) {
      subscribeToConversations(userId, userRole);
    }
  }, [onRefresh, subscribeToConversations, userId, userRole]);

  const handleRetry = useCallback(() => {
    clearConversationsError();
    handleRefresh();
  }, [clearConversationsError, handleRefresh]);

  const formatTime = useCallback((timestamp) => {
    if (!timestamp) {
      return '';
    }

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diff = now - messageTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (Number.isNaN(diff) || diff < 0) {
      return '';
    }

    if (days > 0) {
      return `${days}d ago`;
    }

    if (hours > 0) {
      return `${hours}h ago`;
    }

    return 'Just now';
  }, []);

  const openConversation = useCallback(
    (conversation) => {
      if (!conversation) {
        return;
      }

      navigation.navigate('ChatScreen', {
        conversationId: conversation.id,
        recipientId: conversation.participantId,
        recipientName: conversation.participantName,
        recipientAvatar: conversation.participantAvatar,
        userRole,
      });
    },
    [navigation, userRole]
  );

  const renderAvatar = useCallback(
    (item) => {
      if (item?.participantAvatar) {
        return (
          <Image
            source={{ uri: item.participantAvatar }}
            style={[styles.avatarImage, { width: maxAvatarSize, height: maxAvatarSize }]}
          />
        );
      }

      if (userRole === 'parent') {
        return <Ionicons name="person-circle" size={maxAvatarSize} color="#DB2777" />;
      }

      if (userRole === 'caregiver') {
        return <Ionicons name="person-circle" size={maxAvatarSize} color="#3B82F6" />;
      }

      return <Ionicons name="person-circle" size={maxAvatarSize} color="#6B7280" />;
    },
    [maxAvatarSize, userRole]
  );

  const renderConversation = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={[styles.conversationItem, customStyles.conversationItem]}
        onPress={() => openConversation(item)}
      >
        <View style={[styles.avatar, customStyles.avatar]}>{renderAvatar(item)}</View>

        <View style={[styles.conversationContent, customStyles.conversationContent]}>
          <View style={[styles.conversationHeader, customStyles.conversationHeader]}>
            <Text style={[styles.recipientName, customStyles.recipientName]}>
              {item.participantName}
            </Text>
            <Text style={[styles.timestamp, customStyles.timestamp]}>
              {formatTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={[styles.messageRow, customStyles.messageRow]}>
            <Text style={[styles.lastMessage, customStyles.lastMessage]} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {showUnreadBadge && item.unreadCount > 0 ? (
              <View style={[styles.unreadBadge, customStyles.unreadBadge]}>
                <Text style={[styles.unreadCount, customStyles.unreadCount]}>
                  {item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    ),
    [customStyles, formatTime, openConversation, renderAvatar, showUnreadBadge]
  );

  const conversationData = useMemo(() => conversations || [], [conversations]);

  const derivedStatus = useMemo(() => {
    if (!userId) {
      return 'idle';
    }

    if (conversationsStatus === 'maintenance') {
      return 'maintenance';
    }

    if (conversationsStatus === 'error' && conversationData.length === 0) {
      return 'error';
    }

    if (conversationsStatus === 'ready' && conversationData.length === 0) {
      return 'empty';
    }

    return conversationsStatus;
  }, [userId, conversationsStatus, conversationData.length]);

  const errorMessage = useMemo(() => {
    if (!conversationsError) {
      return null;
    }

    return typeof conversationsError === 'string'
      ? conversationsError
      : conversationsError.message || 'Unable to load conversations right now.';
  }, [conversationsError]);

  const shouldShowRetry = derivedStatus === 'error' || derivedStatus === 'maintenance';

  return (
    <View style={[styles.container, customStyles.container]}>
      <DashboardDataState
        status={derivedStatus}
        loadingText="Loading conversations…"
        emptyTitle={emptyStateTitle}
        emptySubtitle={emptyStateSubtitle}
        errorSubtitle={errorMessage || 'Unable to load conversations right now.'}
        maintenanceSubtitle="Messaging is temporarily unavailable."
        onRetry={shouldShowRetry ? handleRetry : undefined}
        retryLabel="Retry"
        iconOverrides={{ empty: emptyStateIcon }}
        contentStyle={conversationData.length === 0 ? styles.emptyList : undefined}
        testID={`messages-tab-state-${userRole}`}
      >
        <FlatList
          data={conversationData}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || conversationsLoading}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          contentContainerStyle={[
            conversationData.length === 0 ? styles.emptyList : undefined,
            customStyles.listContent,
          ]}
          showsVerticalScrollIndicator={false}
        />
      </DashboardDataState>
    </View>
  );
};

export const ParentMessagesTab = ({ navigation, refreshing, onRefresh }) => {
  const parentCustomStyles = {
    container: {
      backgroundColor: '#FEF7F0',
    },
    conversationItem: {
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 4,
      borderLeftColor: '#DB2777',
    },
    recipientName: {
      color: '#7C2D12',
    },
    avatar: {
      backgroundColor: '#FCE7F3',
    },
    unreadBadge: {
      backgroundColor: '#DB2777',
    },
  };

  return (
    <BaseMessagesTab
      navigation={navigation}
      refreshing={refreshing}
      onRefresh={onRefresh}
      userRole="parent"
      emptyStateIcon="people-outline"
      emptyStateTitle="No conversations yet"
      emptyStateSubtitle="Reach out to caregivers to start conversations"
      showUnreadBadge
      maxAvatarSize={40}
      customStyles={parentCustomStyles}
    />
  );
};

export const CaregiverMessagesTab = ({ navigation, refreshing, onRefresh }) => {
  const caregiverCustomStyles = {
    container: {
      backgroundColor: '#EFF6FF',
    },
    conversationItem: {
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 4,
      borderLeftColor: '#3B82F6',
    },
    recipientName: {
      color: '#1E3A8A',
    },
    avatar: {
      backgroundColor: '#DBEAFE',
    },
    unreadBadge: {
      backgroundColor: '#3B82F6',
    },
  };

  return (
    <BaseMessagesTab
      navigation={navigation}
      refreshing={refreshing}
      onRefresh={onRefresh}
      userRole="caregiver"
      emptyStateIcon="chatbubble-ellipses-outline"
      emptyStateTitle="No conversations yet"
      emptyStateSubtitle="Parents will reach out to you here"
      showUnreadBadge
      maxAvatarSize={40}
      customStyles={caregiverCustomStyles}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    borderRadius: 20,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    flex: 1,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BaseMessagesTab;
