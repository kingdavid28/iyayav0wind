// ConversationList.jsx - React Native Paper conversation list component
import React, { useMemo, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Avatar,
  ActivityIndicator,
  Chip,
  Surface,
} from 'react-native-paper';
import { MessageCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';

const ConversationList = ({ onSelectConversation, selectedConversation }) => {
  const { user } = useAuth();
  const {
    conversations,
    conversationsLoading,
    subscribeToConversations,
    totalUnreadCount,
  } = useMessaging();

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    subscribeToConversations(user.id, user.role === 'caregiver' ? 'caregiver' : 'parent');
    return () => {
      subscribeToConversations(null);
    };
  }, [subscribeToConversations, user?.id, user?.role]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const diff = now - new Date(timestamp);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
  };

  const normalizedConversations = useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    return conversations.map((conversation) => {
      const isParent = user?.role === 'parent';
      const recipientName = isParent ? conversation?.caregiverName : conversation?.parentName;
      const recipientAvatar = isParent ? conversation?.caregiverAvatar : conversation?.parentAvatar;
      const recipientRole = isParent ? 'caregiver' : 'parent';
      const otherUserId = isParent ? conversation?.caregiverId : conversation?.parentId;
      const lastActivity = conversation?.lastMessageTime || conversation?.lastActivity;

      return {
        ...conversation,
        recipientName: recipientName || 'Unknown User',
        recipientAvatar: recipientAvatar || null,
        recipientRole,
        otherUserId,
        lastActivity,
      };
    });
  }, [conversations, user?.role]);

  const handleConversationPress = useCallback(
    (conversation) => {
      if (typeof onSelectConversation === 'function') {
        onSelectConversation(conversation);
      }
    },
    [onSelectConversation]
  );

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleConversationPress(item)}
      style={[
        styles.conversationItem,
        selectedConversation?.id === item.id && styles.selectedConversation
      ]}
    >
      <Surface style={styles.conversationCard} elevation={selectedConversation?.id === item.id ? 4 : 1}>
        <View style={styles.conversationContent}>
          <Avatar.Image
            size={50}
            source={item.recipientAvatar ? { uri: item.recipientAvatar } : null}
            style={styles.avatar}
          />
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text variant="titleMedium" style={styles.recipientName}>
                {item.recipientName}
              </Text>
              <Text variant="caption" style={styles.timestamp}>
                {formatTime(item.lastActivity)}
              </Text>
            </View>

            <View style={styles.conversationMeta}>
              <Text variant="bodySmall" style={styles.lastMessage}>
                {item.lastMessage || 'No messages yet'}
              </Text>

              <View style={styles.conversationActions}>
                {item.unreadCount > 0 && (
                  <Chip
                    compact
                    style={styles.unreadBadge}
                    textStyle={styles.unreadText}
                  >
                    {item.unreadCount}
                  </Chip>
                )}

                <View style={styles.statusContainer}>
                  <Clock size={12} color="#666" />
                  <Text variant="caption" style={styles.statusText}>
                    {item.recipientRole === 'caregiver' ? 'Caregiver' : 'Parent'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MessageCircle size={64} color="#ccc" />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No conversations yet
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Start a conversation with a {user?.role === 'parent' ? 'caregiver' : 'parent'}
      </Text>
    </View>
  );

  if (conversationsLoading && normalizedConversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading conversations...
        </Text>
      </View>
    );
  }

  const isEmpty = normalizedConversations.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge" style={styles.title}>
          Conversations
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {normalizedConversations.length} {normalizedConversations.length === 1 ? 'conversation' : 'conversations'} · {totalUnreadCount} unread
        </Text>
      </View>

      {isEmpty ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={normalizedConversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: '#666',
  },
  listContainer: {
    padding: 8,
  },
  conversationItem: {
    marginVertical: 4,
  },
  conversationCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  selectedConversation: {
    backgroundColor: '#e3f2fd',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginRight: 16,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipientName: {
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  conversationMeta: {
    flexDirection: 'column',
  },
  lastMessage: {
    color: '#666',
    marginBottom: 8,
    flex: 1,
  },
  conversationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    minWidth: 24,
    height: 24,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#666',
    marginLeft: 4,
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default ConversationList;
