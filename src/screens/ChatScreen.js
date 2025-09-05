import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { GiftedChat, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Send as SendIcon, Check, CheckCheck, MoreVertical, Image as ImageIcon } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useMessaging } from '../contexts/MessagingContext';

export default function ChatScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, recipientId, recipientName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientData, setRecipientData] = useState({});
  const typingTimeoutRef = useRef(null);
  const { messages: ctxMessages, getOrCreateConversation, setActiveConversation, activeConversation, sendMessage, markMessagesAsRead } = useMessaging();

  // Initialize conversation via MessagingContext
  useEffect(() => {
    const init = async () => {
      try {
        if (conversationId) {
          // Set active if exists; otherwise we still proceed as temp
          setActiveConversation({ id: conversationId, participants: [user?.uid, recipientId].filter(Boolean) });
        } else if (recipientId) {
          await getOrCreateConversation(recipientId);
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [conversationId, recipientId, user?.uid, getOrCreateConversation, setActiveConversation]);

  // Map context messages to GiftedChat format
  const giftedMessages = useMemo(() => {
    return (ctxMessages || [])
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
      .map((m) => ({
        _id: m.id || m._id,
        text: m.content || m.text || '',
        createdAt: m.createdAt ? new Date(m.createdAt) : (m.created_at ? new Date(m.created_at) : new Date()),
        user: {
          _id: m.senderId || m.sender_id,
          name: m.senderName || m.sender_name || '',
          avatar: m.senderAvatar || m.sender_avatar || undefined,
        },
        read: !!m.read,
        sent: true,
        received: !!m.delivered || !!m.received,
      }));
  }, [ctxMessages]);

  useEffect(() => {
    setMessages(giftedMessages);
  }, [giftedMessages]);

  // Mark messages as read (via context, optimistic)
  const handleMarkRead = useCallback((msgs) => {
    if (!user?.uid) return;
    const unreadIds = (msgs || [])
      .filter((m) => m.user?._id !== user.uid && !m.read)
      .map((m) => m._id);
    if (unreadIds.length) {
      try { markMessagesAsRead(unreadIds); } catch (error) {
        console.warn('Mark read error:', error);
      }
    }
  }, [user?.uid, markMessagesAsRead]);

  // Handle sending a new message
  const onSend = useCallback(async (newMessages = []) => {
    if (newMessages.length === 0) return;
    if (!user || !user.uid) {
      Alert.alert('Sign in required', 'Please sign in to send messages.');
      return;
    }
    const m = newMessages[0];
    try {
      await sendMessage(m.text || '');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [user, sendMessage]);

  // Handle typing indicator
  const onInputTextChanged = useCallback((text) => {
    // Implement typing indicator logic here
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a timeout to indicate user stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      // Update typing status in Firestore
      // TODO: Implement typing indicator via backend if needed
    }, 1000);
  }, []);

  // Custom render methods
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#3b82f6',
          marginVertical: 4,
          padding: 8,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 0,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 12,
        },
        left: {
          backgroundColor: '#f3f4f6',
          marginVertical: 4,
          padding: 8,
          borderTopRightRadius: 12,
          borderBottomRightRadius: 12,
          borderTopLeftRadius: 12,
          borderBottomLeftRadius: 0,
        },
      }}
      textStyle={{
        right: {
          color: 'white',
          fontSize: 15,
        },
        left: {
          color: '#111827',
          fontSize: 15,
        },
      }}
      renderTime={(timeProps) => (
        <View style={styles.timeContainer}>
          <Text style={[
            styles.timeText,
            timeProps.position === 'right' ? styles.timeTextRight : {}
          ]}>
            {timeProps.currentMessage.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {timeProps.position === 'right' && (
              <View style={styles.statusIcon}>
                {timeProps.currentMessage.read ? (
                  <CheckCheck size={14} color="#60a5fa" />
                ) : timeProps.currentMessage.sent ? (
                  <Check size={14} color="#9ca3af" />
                ) : (
                  <View style={styles.sendingIndicator} />
                )}
              </View>
            )}
          </Text>
        </View>
      )}
    />
  );

  const renderInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbar}
      primaryStyle={styles.inputPrimary}
      renderSend={renderSend}
      renderActions={renderActions}
    />
  );

  const renderSend = (props) => (
    <Send
      {...props}
      containerStyle={styles.sendContainer}
    >
      <View style={styles.sendButton}>
        <SendIcon size={20} color="#ffffff" />
      </View>
    </Send>
  );

  const renderActions = (props) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity style={styles.actionButton}>
        <ImageIcon size={24} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {recipientData?.displayName || recipientName}
          </Text>
          {isTyping && (
            <Text style={styles.typingText}>typing...</Text>
          )}
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Chat Interface */}
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={user ? {
          _id: user.uid,
          name: user.displayName || user.email,
          avatar: user.photoURL
        } : { _id: 'guest', name: 'Guest' }}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderAvatarOnTop
        showUserAvatar
        alwaysShowSend
        scrollToBottom
        scrollToBottomComponent={() => null}
        onInputTextChanged={onInputTextChanged}
        placeholder="Type a message..."
        textInputStyle={styles.textInput}
        timeTextStyle={styles.timeText}
        isLoadingEarlier={isLoading}
        renderLoading={() => (
          <View style={styles.loadingMore}>
            <ActivityIndicator color="#3b82f6" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  typingText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 8,
    backgroundColor: '#ffffff',
  },
  inputPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  textInput: {
    color: '#111827',
    fontSize: 15,
    paddingVertical: 8,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButton: {
    padding: 8,
  },
  timeContainer: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  timeTextRight: {
    color: '#e0e7ff',
  },
  statusIcon: {
    marginLeft: 4,
  },
  sendingIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9ca3af',
  },
  loadingMore: {
    paddingVertical: 16,
  },
});
