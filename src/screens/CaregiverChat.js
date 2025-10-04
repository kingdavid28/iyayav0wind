// CaregiverChat.jsx - Enhanced chat screen with React Native best practices
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';

// Constants for responsive design
const { width: screenWidth } = Dimensions.get('window');
const MESSAGE_BUBBLE_MAX_WIDTH = screenWidth * 0.75;

// Chat Header Component (Best Practice: Component Extraction)
const ChatHeader = ({ caregiverName, onBackPress }) => (
  <Surface style={styles.header} elevation={2}>
    <TouchableOpacity
      style={styles.backButton}
      onPress={onBackPress}
      accessibilityLabel="Go back"
      accessibilityHint="Navigate back to previous screen"
    >
      <Ionicons name="arrow-back" size={24} color="#111827" />
    </TouchableOpacity>
    <View style={styles.headerContent}>
      <Text
        style={styles.headerTitle}
        numberOfLines={1}
        accessibilityLabel={`Chat with ${caregiverName}`}
      >
        {caregiverName || 'Chat'}
      </Text>
      <Text style={styles.subtitle}>Caregiver</Text>
    </View>
  </Surface>
);

// Loading State Component (Best Practice: Loading States)
const ChatLoadingState = ({ timeout = false, onRetry, canRetry, retryCount }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3B82F6" />
    <Text style={styles.loadingText}>
      {timeout ? 'Taking longer than expected...' : 'Loading conversation...'}
    </Text>
    {timeout && (
      <>
        <Text style={styles.timeoutText}>
          Please check your connection or try again later.
        </Text>
        {canRetry && retryCount < 3 && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={onRetry}
            accessibilityLabel="Retry loading messages"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        )}
      </>
    )}
  </View>
);

// Empty State Component (Best Practice: Empty States)
const ChatEmptyState = () => (
  <View style={styles.emptyContainer}>
    <Ionicons name="chatbubble-ellipses-outline" size={64} color="#9CA3AF" />
    <Text style={styles.emptyTitle}>No messages yet</Text>
    <Text style={styles.emptySubtitle}>Start the conversation!</Text>
  </View>
);

// Message Bubble Component (Best Practice: Component Extraction)
const MessageBubble = ({ message, isCurrentUser, formatTime }) => {
  console.log('🎈 MessageBubble rendering:', {
    messageId: message?.id,
    messageText: message?.text,
    isCurrentUser,
    hasText: !!message?.text
  });

  return (
    <View
      style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
      ]}
    >
      <Surface
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
        elevation={isCurrentUser ? 1 : 0}
      >
        <Text
          style={[
            styles.messageText,
            isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}
          accessibilityLabel={isCurrentUser ? 'Your message' : 'Received message'}
        >
          {message?.text || 'No message content'}
        </Text>

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
            ]}
          >
            {formatTime(message?.timestamp)}
          </Text>

          {isCurrentUser && (
            <View style={styles.messageStatus}>
              {message?.status === 'sent' && (
                <Ionicons name="checkmark" size={12} color="#10B981" />
              )}
              {message?.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={12} color="#10B981" />
              )}
              {message?.status === 'read' && (
                <Ionicons name="checkmark-done" size={12} color="#3B82F6" />
              )}
            </View>
          )}
        </View>
      </Surface>
    </View>
  );
};

// Message Input Component (Best Practice: Component Extraction)
const MessageInput = ({ value, onChangeText, onSend, disabled, placeholder }) => (
  <Surface style={styles.inputContainer} elevation={3}>
    <TextInput
      style={[
        styles.messageInput,
        Platform.OS === 'ios' && styles.messageInputIOS // iOS-specific styling
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline
      maxLength={500}
      accessibilityLabel="Type a message"
      accessibilityHint="Enter your message here"
      returnKeyType="send"
      onSubmitEditing={onSend}
      blurOnSubmit={false}
      disabled={disabled}
      // Enhanced props for better UX
      autoCapitalize="sentences"
      autoCorrect={true}
      spellCheck={true}
      keyboardType="default"
      // Better height handling
      numberOfLines={3}
      minHeight={48}
    />
    <TouchableOpacity
      style={[
        styles.sendButton,
        { opacity: value?.trim() ? 1 : 0.5 }
      ]}
      onPress={onSend}
      disabled={!value?.trim() || disabled}
      accessibilityLabel="Send message"
      accessibilityHint="Send your message"
    >
      <Ionicons name="send" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  </Surface>
);

const CaregiverChat = ({ route }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const routeHook = useRoute();
  const { caregiverId, caregiverName, recipientId, recipientName, conversationId: routeConversationId, userRole } = route?.params || routeHook?.params || {};

  // Handle both parameter naming conventions for backward compatibility
  const finalCaregiverId = caregiverId || recipientId;
  const finalCaregiverName = caregiverName || recipientName;

  const {
    subscribeToMessages,
    markMessagesAsRead,
    sendMessage: sendMessageFromContext,
    setActiveConversationId,
    messages,
    messagesLoading,
    currentFirebaseUser,
  } = useMessaging();

  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  // Generate conversation ID (Best Practice: useEffect for side effects)
  useEffect(() => {
    if (!user?.firebaseUid || !finalCaregiverId) {
      Alert.alert('Error', 'Missing user information');
      navigation.goBack();
      return;
    }

    // Use provided conversation ID or generate from user and caregiver IDs
    const generatedConversationId = routeConversationId || (() => {
      const [id1, id2] = [user.firebaseUid, finalCaregiverId].sort();
      return `${id1}_${id2}`;
    })();

    console.log('🔗 CaregiverChat conversation ID:', {
      routeConversationId,
      userFirebaseUid: user.firebaseUid,
      finalCaregiverId,
      generatedConversationId
    });

    setConversationId(generatedConversationId);
  }, [user?.firebaseUid, finalCaregiverId, routeConversationId, navigation]);

  // Subscribe to messages (Best Practice: Proper cleanup)
  useEffect(() => {
    if (!conversationId || !user?.firebaseUid || !finalCaregiverId) {
      return;
    }

    console.log('🔗 Subscribing to messages:', {
      conversationId,
      userFirebaseUid: user?.firebaseUid,
      finalCaregiverId,
      currentFirebaseUser: currentFirebaseUser?.uid
    });

    setActiveConversationId(conversationId);
    subscribeToMessages(conversationId, user.firebaseUid, finalCaregiverId);
    markMessagesAsRead(user.firebaseUid, finalCaregiverId, conversationId).catch(console.error);

    return () => {
      setActiveConversationId(null);
      subscribeToMessages(null);
    };
  }, [conversationId, user?.firebaseUid, finalCaregiverId, setActiveConversationId, subscribeToMessages, markMessagesAsRead]);

  const [retryCount, setRetryCount] = useState(0);
  const [canRetry, setCanRetry] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Handle retry logic for failed message subscriptions
  const handleRetry = useCallback(() => {
    if (!canRetry || retryCount >= 3) return;

    console.log(`🔄 Retrying message subscription (attempt ${retryCount + 1}/3)`);
    setRetryCount(prev => prev + 1);
    setCanRetry(false);

    // Reset states
    setLoadingTimeout(false);

    // Force re-subscription by triggering the useEffect
    if (conversationId && user?.firebaseUid && finalCaregiverId) {
      setActiveConversationId(conversationId);
      subscribeToMessages(conversationId, user.firebaseUid, finalCaregiverId);
    }

    // Re-enable retry after cooldown
    setTimeout(() => setCanRetry(true), 5000);
  }, [canRetry, retryCount, conversationId, user?.firebaseUid, finalCaregiverId, setActiveConversationId, subscribeToMessages]);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (messagesLoading) {
      const timeout = setTimeout(() => {
        console.warn('⚠️ Messages loading timeout reached');
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [messagesLoading]);

  // Handle sending message (Best Practice: useCallback for performance)
  const handleSendMessage = useCallback(async () => {
    if (!newMessage?.trim() || !user?.firebaseUid || !finalCaregiverId || !conversationId || sending) {
      return;
    }

    setSending(true);
    try {
      await sendMessageFromContext(
        user.firebaseUid,
        finalCaregiverId,
        newMessage.trim(),
        'text',
        null,
        conversationId
      );
      setNewMessage('');

      // Auto-scroll to bottom after sending (Best Practice: Delayed execution)
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }, [newMessage, user?.firebaseUid, finalCaregiverId, conversationId, sending, sendMessageFromContext]);

  // Format message time (Best Practice: useCallback for performance)
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  // Filter and sort messages for current conversation (Best Practice: useMemo for expensive operations)
  const displayedMessages = useMemo(() => {
    if (!messages || !conversationId) return [];

    const filteredMessages = messages
      .filter((message) => message?.conversationId === conversationId)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    console.log('📱 CaregiverChat Debug:', {
      totalMessages: messages.length,
      conversationId,
      filteredMessages: filteredMessages.length,
      currentFirebaseUser: currentFirebaseUser?.uid,
      sampleMessage: filteredMessages[0] ? {
        id: filteredMessages[0].id,
        text: filteredMessages[0].text,
        conversationId: filteredMessages[0].conversationId,
        senderId: filteredMessages[0].senderId
      } : null
    });

    return filteredMessages;
  }, [messages, conversationId, currentFirebaseUser]);

  if (!finalCaregiverId) {
    return null;
  }

  return (
    <View style={styles.screenContainer}>
      <Card style={styles.chatCard}>
        <Card.Content style={styles.chatContent}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ChatHeader
              caregiverName={finalCaregiverName}
              onBackPress={() => navigation.goBack()}
            />

            {messagesLoading && displayedMessages.length === 0 && !loadingTimeout ? (
              <ChatLoadingState />
            ) : displayedMessages.length === 0 && loadingTimeout ? (
              <ChatLoadingState
                timeout={true}
                onRetry={handleRetry}
                canRetry={canRetry}
                retryCount={retryCount}
              />
            ) : displayedMessages.length === 0 ? (
              <ChatEmptyState />
            ) : (
              <FlatList
                ref={flatListRef}
                data={displayedMessages}
                renderItem={({ item }) => (
                  <MessageBubble
                    message={item}
                    isCurrentUser={item.senderId === user?.firebaseUid}
                    formatTime={formatTime}
                  />
                )}
                keyExtractor={(item, index) => item.id || `message-${index}`}
                style={styles.messagesList}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  if (displayedMessages.length > 0) {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }
                }}
                // Performance optimizations (Best Practice: Virtual Scrolling)
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                initialNumToRender={20}
                getItemLayout={(data, index) => ({
                  length: 80,
                  offset: 80 * index,
                  index,
                })}
              />
            )}

            <MessageInput
              value={newMessage}
              onChangeText={setNewMessage}
              onSend={handleSendMessage}
              disabled={messagesLoading || sending}
              placeholder="Type your message..."
            />
          </KeyboardAvoidingView>
        </Card.Content>
      </Card>
    </View>
  );
};

export default CaregiverChat;

const styles = StyleSheet.create({
  // Screen Container (Best Practice: Responsive Design)
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },

  // Card Design (Best Practice: Material Design 3)
  chatCard: {
    flex: 1,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  // Content Layout (Best Practice: Flexbox Layout)
  chatContent: {
    flex: 1,
    padding: 0,
  },

  // Main Container
  container: {
    flex: 1,
  },

  // Header (Best Practice: Component Styling)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
  },

  headerContent: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Loading States (Best Practice: User Feedback)
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },

  timeoutText: {
    marginTop: 8,
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },

  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty States (Best Practice: User Guidance)
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Messages List (Best Practice: Performance)
  messagesList: {
    flex: 1,
  },

  messagesContent: {
    padding: 16,
    paddingBottom: 100, // Space for input
  },

  // Message Containers (Best Practice: Responsive Layout)
  messageContainer: {
    marginVertical: 4,
    maxWidth: MESSAGE_BUBBLE_MAX_WIDTH,
  },

  currentUserMessage: {
    alignSelf: 'flex-end',
  },

  otherUserMessage: {
    alignSelf: 'flex-start',
  },

  // Message Bubbles (Best Practice: Material Design)
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: MESSAGE_BUBBLE_MAX_WIDTH,
  },

  currentUserBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },

  otherUserBubble: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },

  // Message Text (Best Practice: Typography)
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },

  currentUserText: {
    color: '#ffffff',
  },

  otherUserText: {
    color: '#111827',
  },

  // Message Footer (Best Practice: Layout)
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  messageTime: {
    fontSize: 12,
  },

  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },

  otherUserTime: {
    color: '#9ca3af',
  },

  messageStatus: {
    flexDirection: 'row',
    marginLeft: 8,
  },

  // Input Container (Best Practice: Material Design)
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 'auto',
    minHeight: 80, // Increased height for better input field visibility
  },

  // Message Input (Best Practice: Form Design)
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: '#f9fafb',
    fontSize: 16,
    textAlignVertical: 'top',
    // Enhanced styling for better UX
    lineHeight: 20,
  },

  // iOS-specific input styling for better appearance
  messageInputIOS: {
    paddingTop: 14,
    paddingBottom: 14,
  },

  // Send Button (Best Practice: Interactive Elements)
  sendButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
  },
});