// MessageList.jsx - React Native Paper message list component
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../core/contexts/AuthContext';
import { messagingService } from '../../services/messagingService';
import MessageCard from './MessageCard';

const MessageList = ({ conversation }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conversation?.id) {
      setMessages([]);
      return;
    }

    setLoading(true);
    const unsubscribe = messagingService.listenToMessages(conversation.id, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [conversation?.id]);

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

  if (loading) {
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
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id || item.timestamp.toString()}
      renderItem={renderMessage}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmpty}
    />
  );
};

const styles = StyleSheet.create({
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
});

export default MessageList;
