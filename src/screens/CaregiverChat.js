import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';

const CaregiverChat = ({ route }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const routeHook = useRoute();
  const { caregiverId, caregiverName } = route?.params || routeHook?.params || {};

  const {
    subscribeToMessages,
    markMessagesAsRead,
    sendMessage: sendMessageFromContext,
    setActiveConversationId,
    messages,
    messagesLoading,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!user?.id || !caregiverId) {
      Alert.alert('Error', 'Missing user information');
      navigation.goBack();
      return;
    }

    const [id1, id2] = [user.id, caregiverId].sort();
    setConversationId(`${id1}_${id2}`);
  }, [user?.id, caregiverId, navigation]);

  useEffect(() => {
    if (!conversationId || !user?.id || !caregiverId) {
      return;
    }

    setActiveConversationId(conversationId);
    subscribeToMessages(conversationId, user.id, caregiverId);
    markMessagesAsRead(user.id, caregiverId, conversationId).catch(console.error);

    return () => {
      setActiveConversationId(null);
      subscribeToMessages(null);
    };
  }, [conversationId, user?.id, caregiverId, setActiveConversationId, subscribeToMessages, markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage?.trim() || !user?.id || !caregiverId || !conversationId) {
      return;
    }

    try {
      await sendMessageFromContext(
        user.id,
        caregiverId,
        newMessage.trim(),
        'text',
        null,
        conversationId
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const MessageItem = ({ message, isCurrentUser }) => {
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {message.text || 'No message content'}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
              ]}
            >
              {formatTime(message.timestamp)}
            </Text>

            {isCurrentUser && (
              <View style={styles.messageStatus}>
                {message.status === 'sent' && (
                  <Ionicons name="checkmark" size={12} color="#10B981" />
                )}
                {message.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={12} color="#10B981" />
                )}
                {message.status === 'read' && (
                  <Ionicons name="checkmark-done" size={12} color="#3B82F6" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!caregiverId) {
    return null;
  }

  const displayedMessages = useMemo(() => messages || [], [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {caregiverName || 'Chat'}
          </Text>
          <Text style={styles.subtitle}>Caregiver</Text>
        </View>
      </View>

      {messagesLoading && displayedMessages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading chat...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayedMessages}
          renderItem={({ item }) => (
            <MessageItem message={item} isCurrentUser={item.senderId === user?.id} />
          )}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (displayedMessages.length > 0 && flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: true });
            }
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type your message..."
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendButton, { opacity: newMessage?.trim() ? 1 : 0.5 }]}
          onPress={handleSendMessage}
          disabled={!newMessage?.trim()}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CaregiverChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});