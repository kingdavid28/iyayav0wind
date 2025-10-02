// MessageList.jsx - React Native Paper message list component
import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import MessageCard from './MessageCard';

const MessageList = ({ conversation }) => {
  const { user } = useAuth();
  const {
    messages,
    messagesLoading,
    typingUsers,
    queueStatus,
  } = useMessaging();

  const visibleMessages = useMemo(() => {
    if (!conversation?.id) {
      return [];
    }

    return (messages || []).filter((message) => message?.conversationId === conversation.id || !message?.conversationId);
  }, [conversation?.id, messages]);

  const renderMessage = ({ item }) => (
    <MessageCard
      message={item}
      isOwn={item.senderId === user?.id}
      showAvatar={true}
      senderName={item.senderId === user?.id ? 'You' : conversation?.recipientName}
      senderAvatar={item.senderId === user?.id ? null : conversation?.recipientAvatar}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text variant="bodyLarge" style={styles.emptyText}>
        No messages yet. Start the conversation!
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" />
      <Text variant="bodyMedium" style={styles.loadingText}>
        Loading messages...
      </Text>
    </View>
  );

  const renderTypingIndicator = () => {
    if (!conversation?.id) return null;
    const otherUsersTyping = typingUsers?.filter((id) => id !== user?.id) || [];
    if (otherUsersTyping.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text variant="bodySmall" style={styles.typingText}>
          {otherUsersTyping.length === 1 ? `Typing...` : `Multiple users typing...`}
        </Text>
      </View>
    );
  };

  const renderOfflineBanner = () => {
    if (!queueStatus?.isOnline) {
      return (
        <View style={styles.offlineBanner}>
          <Text variant="bodySmall" style={styles.offlineText}>
            You are offline. {queueStatus?.pendingCount || 0} message(s) will send when reconnected.
          </Text>
        </View>
      );
    }
    return null;
  };

  if (messagesLoading) {
    return renderLoading();
  }

  if (!conversation) {
    return (
      <View style={styles.noConversationContainer}>
        <Text variant="bodyLarge" style={styles.noConversationText}>
          Select a conversation to view messages
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {renderOfflineBanner()}
      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id || item.timestamp?.toString?.() || `${item.senderId}_${item.timestamp}`}
        renderItem={renderMessage}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
      {renderTypingIndicator()}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  noConversationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noConversationText: {
    color: '#666',
    textAlign: 'center',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FEEBC8',
  },
  offlineText: {
    color: '#8A6D3B',
  },
});

export default MessageList;
