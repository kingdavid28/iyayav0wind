// ChatScreen.jsx - Enhanced chat screen with Firebase messaging
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Card, Button, Chip, Avatar, FAB } from 'react-native-paper';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Search,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useMessaging } from '../../contexts/MessagingContext';
import MessageInput from './MessageInput';

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const {
    subscribeToMessages,
    sendMessage,
    setTypingStatus,
    messages,
    messagesLoading,
    typingUsers,
    queueStatus,
  } = useMessaging();
  const flatListRef = useRef(null);

  const { conversationId, recipientId, recipientName, recipientAvatar } = route.params || {};

  // Create conversation object for MessageInput
  const conversation = conversationId ? {
    id: conversationId,
    otherUserId: recipientId,
    recipientName,
    recipientAvatar,
  } : null;

  // State
  const [sending, setSending] = useState(false);

  // Load messages
  useEffect(() => {
    if (!conversationId || !user?.id) return () => {};

    subscribeToMessages(conversationId, user.id, recipientId);
    return () => {
      subscribeToMessages(null);
    };
  }, [conversationId, recipientId, subscribeToMessages, user?.id]);

  // Handle sending message
  const handleSendMessage = async (messageText) => {
    if (sending) return;

    setSending(true);
    try {
      await sendMessage(user?.id, recipientId, messageText, 'text', null, conversationId);
      await setTypingStatus(conversationId, user?.id, false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle typing
  const handleTyping = useCallback(
    (text) => {
      if (!conversationId || !user?.id) {
        return;
      }

      const hasContent = Boolean(text?.trim());
      setTypingStatus(conversationId, user.id, hasContent);
    },
    [conversationId, setTypingStatus, user?.id]
  );

  // Render message
  const visibleMessages = useMemo(
    () =>
      (messages || [])
        .filter((message) => (message?.conversationId || conversationId) === conversationId)
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)),
    [conversationId, messages]
  );

  const renderMessage = ({ item }) => (
    <MessageCard
      message={item}
      isOwn={item.senderId === user?.id}
      showAvatar={true}
      senderName={item.senderId === user?.id ? 'You' : recipientName}
      senderAvatar={item.senderId === user?.id ? null : recipientAvatar}
    />
  );

  // Render typing indicator
  const renderTypingIndicator = () => {
    const otherTyping = typingUsers?.filter((id) => id !== user?.id) || [];
    if (otherTyping.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <Text variant="caption" style={styles.typingText}>
          {otherTyping.includes(recipientId) ? `${recipientName} is typing...` : 'Someone is typing...'}
        </Text>
      </View>
    );
  };

  const renderOfflineBanner = () => {
    if (!queueStatus?.isOnline) {
      return (
        <View style={styles.offlineBanner}>
          <Text variant="bodySmall" style={styles.offlineText}>
            Offline mode. {queueStatus?.pendingCount || 0} message(s) pending sync.
          </Text>
        </View>
      );
    }
    return null;
  };

  // Render header
  const otherParticipantId = useMemo(() => {
    if (!conversationId) return recipientId;
    const ids = conversationId.split('_');
    if (!ids || ids.length !== 2) return recipientId;
    return ids[0] === user?.id ? ids[1] : ids[0];
  }, [conversationId, recipientId, user?.id]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text>←</Text>
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <Avatar.Image
          size={40}
          source={recipientAvatar ? { uri: recipientAvatar } : null}
        />
        <View style={styles.headerText}>
          <Text variant="titleMedium" style={styles.recipientName}>
            {recipientName}
          </Text>
          <Text variant="caption" style={styles.recipientStatus}>
            {typingUsers.includes(otherParticipantId) ? 'Typing...' : 'Online'}
          </Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Phone size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Video size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MoreVertical size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (messagesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading messages...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {renderHeader()}
      {renderOfflineBanner()}

      <FlatList
        ref={flatListRef}
        data={visibleMessages}
        keyExtractor={(item) => item.id || item.timestamp.toString()}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {renderTypingIndicator()}

      <MessageInput
        conversation={conversation}
        disabled={messagesLoading || sending}
        onSendMessage={handleSendMessage}
        onImagePick={handleImagePick}
        onTyping={handleTyping}
        placeholder="Type a message..."
      />
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  recipientName: {
    fontWeight: '600',
  },
  recipientStatus: {
    color: '#4CAF50',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  attachButton: {
    padding: 12,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    backgroundColor: '#f5f5f5',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default ChatScreen;
