import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Card, Avatar, Text as PaperText, ActivityIndicator, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../core/contexts/AuthContext';
import { messagingService } from '../../../services/messagingService';
import { authService } from '../../../services/authService';

const MessagesTab = ({ navigation, refreshing, onRefresh }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const userId = authService.getCurrentUserId();

      if (!userId) {
        console.warn('No authenticated user found');
        setConversations([]);
        setLoading(false);
        return;
      }

      // Check if messaging service is ready
      if (!messagingService.isFirebaseReady()) {
        console.warn('Firebase is not properly initialized');
        setConversations([]);
        setLoading(false);
        return;
      }

      // Listen to conversations using Firebase
      const unsubscribe = messagingService.listenToUserConversations(userId, async (firebaseConversations) => {
        // Enhance with user profile data and message data from MongoDB
        const enhancedConversations = await Promise.all(
          firebaseConversations.map(async (conv) => {
            try {
              // Get user profile data
              const userProfile = await messagingService.getConversationMetadata(conv.id);

              // Get last message from Firebase
              const lastMessageData = await messagingService.getLastMessage(conv.id);

              // Get unread count from messageSync
              const unreadCount = await messagingService.getUnreadCount(conv.id, userId);

              return {
                ...conv,
                recipientName: userProfile?.name || 'Unknown User',
                recipientAvatar: userProfile?.profileImage || null,
                recipientRole: userProfile?.role || 'user',
                lastMessage: lastMessageData?.text || 'No messages yet',
                lastMessageTime: lastMessageData?.timestamp || conv.lastActivity,
                unreadCount: unreadCount || 0,
              };
            } catch (error) {
              console.warn('Error fetching conversation data:', error);
              return {
                ...conv,
                recipientName: 'Unknown User',
                recipientAvatar: null,
                recipientRole: 'user',
                lastMessage: 'No messages yet',
                lastMessageTime: conv.lastActivity,
                unreadCount: 0,
              };
            }
          })
        );

        setConversations(enhancedConversations);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = loadConversations();
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [loadConversations]);

  const handleRefresh = useCallback(async () => {
    await loadConversations();
    if (onRefresh) onRefresh();
  }, [loadConversations, onRefresh]);

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

  const navigateToChat = (conversation) => {
    navigation.navigate('ChatScreen', {
      conversationId: conversation.id,
      recipientId: conversation.otherUserId,
      recipientName: conversation.recipientName,
      recipientAvatar: conversation.recipientAvatar,
    });
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity onPress={() => navigateToChat(item)}>
      <Card style={styles.conversationCard}>
        <Card.Content style={styles.conversationContent}>
          <View style={styles.conversationLeft}>
            <Avatar.Image
              size={50}
              source={item.recipientAvatar ? { uri: item.recipientAvatar } : null}
            />
            <View style={styles.conversationInfo}>
              <PaperText variant="titleMedium" style={styles.recipientName}>
                {item.recipientName}
              </PaperText>
              <PaperText variant="bodySmall" style={styles.lastMessage}>
                {item.lastMessage}
              </PaperText>
            </View>
          </View>

          <View style={styles.conversationRight}>
            <PaperText variant="caption" style={styles.timestamp}>
              {formatTime(item.lastMessageTime)}
            </PaperText>
            {item.unreadCount > 0 && (
              <Chip
                compact
                style={styles.unreadBadge}
                textStyle={styles.unreadText}
              >
                {item.unreadCount}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
      <PaperText variant="headlineSmall" style={styles.emptyTitle}>
        No conversations yet
      </PaperText>
      <PaperText variant="bodyMedium" style={styles.emptySubtitle}>
        Start a conversation with a caregiver or parent
      </PaperText>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <PaperText variant="bodyMedium" style={styles.loadingText}>
          Loading conversations...
        </PaperText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  conversationCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 2,
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  conversationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  conversationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  recipientName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    color: '#666',
    maxWidth: 200,
  },
  conversationRight: {
    alignItems: 'flex-end',
  },
  timestamp: {
    color: '#999',
    marginBottom: 8,
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
  },
  emptySubtitle: {
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MessagesTab;
