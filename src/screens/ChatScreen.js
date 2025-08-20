import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import { GiftedChat, Bubble, InputToolbar, Send, Time } from 'react-native-gifted-chat';
import { useApp } from '../context/AppContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, doc, onSnapshot, query, orderBy, updateDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { ArrowLeft, Send as SendIcon, Check, CheckCheck, MoreVertical, Image as ImageIcon } from 'lucide-react-native';

export default function ChatScreen() {
  const { user } = useApp().state || {};
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, recipientId, recipientName } = route.params;
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [recipientData, setRecipientData] = useState({});
  const typingTimeoutRef = useRef(null);

  // Fetch recipient data
  useEffect(() => {
    const fetchRecipientData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', recipientId));
        if (userDoc.exists()) {
          setRecipientData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching recipient data:', error);
      }
    };

    fetchRecipientData();
  }, [recipientId]);

  // Load chat history and subscribe to real-time updates
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        _id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setMessages(messagesData);
      setIsLoading(false);
      
      // Mark messages as read
      markMessagesAsRead(messagesData);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Mark messages as read
  const markMessagesAsRead = async (msgs) => {
    const unreadMessages = msgs.filter(
      msg => msg.user._id !== user.uid && !msg.read
    );

    if (unreadMessages.length > 0) {
      const batch = [];
      unreadMessages.forEach(msg => {
        const messageRef = doc(db, 'conversations', conversationId, 'messages', msg._id);
        batch.push(updateDoc(messageRef, { read: true }));
      });
      
      try {
        await Promise.all(batch);
        // Update conversation's unread count
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
          [`unreadCount.${user.uid}`]: 0,
          lastUpdated: serverTimestamp()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  };

  // Handle sending a new message
  const onSend = useCallback(async (newMessages = []) => {
    if (newMessages.length === 0) return;
    if (!user || !user.uid) {
      Alert.alert('Sign in required', 'Please sign in to send messages.');
      return;
    }

    const message = newMessages[0];
    const messageData = {
      _id: message._id,
      text: message.text,
      createdAt: serverTimestamp(),
      user: {
        _id: user.uid,
        name: user.displayName || '',
        avatar: user.photoURL
      },
      read: false
    };

    try {
      // Add message to Firestore
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, messageData);
      
      // Update conversation's last message
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          text: message.text,
          sentAt: serverTimestamp()
        },
        lastUpdated: serverTimestamp(),
        [`unreadCount.${recipientId}`]: (await getDoc(conversationRef)).data()?.unreadCount?.[recipientId] + 1 || 1
      });
      
      // Update local state
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [{
          ...messageData,
          createdAt: new Date(),
          sent: true
        }])
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  }, [conversationId, recipientId, user]);

  // Handle typing indicator
  const onInputTextChanged = useCallback((text) => {
    // Implement typing indicator logic here
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set a timeout to indicate user stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      // Update typing status in Firestore
      // This would require a separate collection for typing indicators
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
