import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import messagingService from '../services/messagingService';
import { useApi } from '../hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import { styles } from './styles/MessagingScreen.styles';

const MessagingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, recipientId, recipientName } = route.params || {};
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);

  const {
    data: messagesData,
    loading: loadingMessages,
    error: messagesError,
    execute: loadMessages,
  } = useApi();

  const {
    loading: sendingMessage,
    execute: sendMessage,
  } = useApi();

  // Load messages on mount
  useEffect(() => {
    if (conversationId) {
      loadConversationMessages();
    } else if (recipientId) {
      // Start new conversation
      startNewConversation();
    }
  }, [conversationId, recipientId]);

  // Set navigation title
  useEffect(() => {
    if (recipientName) {
      navigation.setOptions({
        title: recipientName,
      });
    } else if (conversation?.participants) {
      const otherParticipant = conversation.participants.find(
        p => p._id !== conversation.currentUserId
      );
      if (otherParticipant) {
        navigation.setOptions({
          title: otherParticipant.name,
        });
      }
    }
  }, [conversation, recipientName, navigation]);

  const loadConversationMessages = async () => {
    try {
      const result = await loadMessages(() =>
        messagingService.getConversationMessages(conversationId, page)
      );

      if (result) {
        const { messages: newMessages, pagination } = result;
        
        if (page === 1) {
          setMessages(newMessages);
        } else {
          setMessages(prev => [...newMessages, ...prev]);
        }
        
        setHasMore(pagination.page < pagination.pages);
        
        // Mark messages as read
        await messagingService.markMessagesAsRead(conversationId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    }
  };

  const startNewConversation = async () => {
    try {
      const result = await loadMessages(() =>
        messagingService.startConversation(recipientId)
      );

      if (result) {
        setConversation(result);
        // Navigate to the new conversation
        navigation.setParams({ conversationId: result._id });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    const tempMessage = {
      _id: `temp-${Date.now()}`,
      text: messageText,
      fromUserId: { name: 'You' },
      createdAt: new Date().toISOString(),
      sending: true,
    };

    setMessages(prev => [...prev, tempMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const messageData = {
        text: messageText,
        conversationId: conversationId || conversation?._id,
        recipientId: !conversationId ? recipientId : undefined,
      };

      const result = await sendMessage(() =>
        messagingService.sendMessage(messageData)
      );

      if (result) {
        // Remove temp message and add real message
        setMessages(prev => 
          prev.filter(msg => msg._id !== tempMessage._id).concat(result)
        );

        // Update conversation ID if this was a new conversation
        if (!conversationId && result.conversationId) {
          navigation.setParams({ conversationId: result.conversationId });
        }
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const loadMoreMessages = () => {
    if (!loadingMessages && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.fromUserId?.name === 'You' || message.sending;
    const showAvatar = !isOwnMessage;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {showAvatar && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {message.fromUserId?.name?.charAt(0) || '?'}
              </Text>
            </View>
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          {!isOwnMessage && (
            <Text style={styles.senderName}>
              {message.fromUserId?.name || 'Unknown'}
            </Text>
          )}
          
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.text}
          </Text>
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </Text>
            
            {isOwnMessage && (
              <View style={styles.messageStatus}>
                {message.sending ? (
                  <ActivityIndicator size="small" color="#666" />
                ) : (
                  <Ionicons 
                    name={message.read ? "checkmark-done" : "checkmark"} 
                    size={16} 
                    color={message.read ? "#4CAF50" : "#666"} 
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!loadingMessages || page === 1) return null;
    
    return (
      <View style={styles.loadingHeader}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadingText}>Loading more messages...</Text>
      </View>
    );
  };

  if (loadingMessages && page === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b83f5" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={5000}
          editable={!sendingMessage}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
        >
          {sendingMessage ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MessagingScreen;
