// messagingService.js - Firebase-based real-time messaging
import { database, ref, push, set, onValue, off, query, orderByChild } from '../config/firebase';
import { authService } from './authService';

class MessagingService {
  constructor() {
    // Only initialize Firebase references if database is available
    if (database) {
      this.conversationsRef = ref(database, 'conversations');
      this.messagesRef = ref(database, 'messages');
      this.messageSyncRef = ref(database, 'messageSync');
      this.connectionsRef = ref(database, 'connections');
    } else {
      console.warn('⚠️ Firebase database is null, messaging service will have limited functionality');
      this.conversationsRef = null;
      this.messagesRef = null;
      this.messageSyncRef = null;
      this.connectionsRef = null;
    }
  }

  // Listen to messages in a conversation
  listenToMessages(conversationId, callback) {
    if (!this.isFirebaseReady() || !this.messagesRef) {
      console.error('Firebase is not properly initialized');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    const messagesQuery = query(
      ref(database, `messages/${conversationId}`),
      orderByChild('timestamp')
    );

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    return unsubscribe;
  }

  // Generate conversation ID for two users
  generateConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
  }

  // Send a message
  async sendMessage(receiverId, text, type = 'text') {
    if (!this.isFirebaseReady() || !this.messagesRef) {
      throw new Error('Firebase is not properly initialized');
    }

    try {
      const senderId = authService.getCurrentUserId();
      if (!senderId) throw new Error('User not authenticated');

      const conversationId = this.generateConversationId(senderId, receiverId);
      const timestamp = Date.now();

      // Create message object
      const message = {
        text,
        type,
        senderId,
        timestamp,
        status: 'sent',
        edited: false
      };

      // Save message to messages collection
      const messageRef = push(ref(database, `messages/${conversationId}` ));
      const messageId = messageRef.key;

      await set(messageRef, {
        ...message,
        messageId
      });

      // Update conversation last activity
      await this.updateConversation(conversationId, senderId, receiverId, timestamp);

      // Update message sync for delivery tracking
      await this.updateMessageSync(conversationId, messageId, senderId, 'delivered');

      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Update conversation activity
  async updateConversation(conversationId, user1, user2, timestamp) {
    const connections = {
      [user1]: {
        [user2]: {
          createdAt: timestamp,
          lastActivity: timestamp
        }
      },
      [user2]: {
        [user1]: {
          createdAt: timestamp,
          lastActivity: timestamp
        }
      }
    };

    await set(ref(database, `connections/${user1}/${user2}` ), {
      createdAt: timestamp,
      lastActivity: timestamp
    });

    await set(ref(database, `connections/${user2}/${user1}` ), {
      createdAt: timestamp,
      lastActivity: timestamp
    });
  }

  // Update message sync status
  async updateMessageSync(conversationId, messageId, userId, status) {
    const syncData = {
      userId,
      status,
      timestamp: Date.now(),
      deviceId: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    await set(ref(database, `messageSync/${conversationId}/${messageId}/${userId}` ), syncData);
  }

  // Listen for messages in a conversation
  listenToMessages(conversationId, callback) {
    const messagesQuery = query(ref(database, `messages/${conversationId}` ), orderByChild('timestamp'));

    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(messages.sort((a, b) => a.timestamp - b.timestamp));
    });

    return unsubscribe;
  }

  // Listen for user conversations
  listenToUserConversations(userId, callback) {
    if (!this.isFirebaseReady() || !this.connectionsRef) {
      console.error('Firebase is not properly initialized');
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }

    const conversationsQuery = query(ref(database, 'connections/' + userId));

    const unsubscribe = onValue(conversationsQuery, (snapshot) => {
      const conversations = [];
      snapshot.forEach((childSnapshot) => {
        const otherUserId = childSnapshot.key;
        const conversationData = childSnapshot.val();

        conversations.push({
          id: this.generateConversationId(userId, otherUserId),
          otherUserId,
          lastActivity: conversationData.lastActivity,
          createdAt: conversationData.createdAt
        });
      });

      callback(conversations.sort((a, b) => b.lastActivity - a.lastActivity));
    });

    return unsubscribe;
  }

  // Mark message as delivered
  async markMessageAsDelivered(conversationId, messageId) {
    const userId = authService.getCurrentUserId();
    if (!userId) return;

    await this.updateMessageSync(conversationId, messageId, userId, 'delivered');
  }

  // Get conversation messages with pagination
  async getConversationMessages(conversationId, limit = 50, startAfter = null) {
    let messagesQuery = query(
      ref(database, `messages/${conversationId}`),
      orderByChild('timestamp')
    );

    if (startAfter) {
      messagesQuery = query(messagesQuery, startAfter);
    }

    return new Promise((resolve) => {
      onValue(messagesQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          if (messages.length < limit) {
            messages.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          }
        });
        resolve(messages.sort((a, b) => a.timestamp - b.timestamp));
      }, { onlyOnce: true });
    });
  }

  // Search messages in a conversation
  async searchMessages(conversationId, searchTerm) {
    return new Promise((resolve) => {
      const messagesQuery = query(ref(database, `messages/${conversationId}`), orderByChild('timestamp'));

      onValue(messagesQuery, (snapshot) => {
        const matchingMessages = [];
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (message.text && message.text.toLowerCase().includes(searchTerm.toLowerCase())) {
            matchingMessages.push({
              id: childSnapshot.key,
              ...message
            });
          }
        });
        resolve(matchingMessages.sort((a, b) => b.timestamp - a.timestamp));
      }, { onlyOnce: true });
    });
  }

  // Delete a message
  async deleteMessage(conversationId, messageId) {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const messageRef = ref(database, `messages/${conversationId}/${messageId}`);
    const messageSnapshot = await new Promise((resolve) => {
      onValue(messageRef, resolve, { onlyOnce: true });
    });

    const message = messageSnapshot.val();
    if (message.senderId !== userId) {
      throw new Error('Can only delete your own messages');
    }

    await set(ref(database, `messages/${conversationId}/${messageId}`), {
      ...message,
      text: '[Message deleted]',
      deleted: true,
      deletedAt: Date.now()
    });
  }

  // Edit a message
  async editMessage(conversationId, messageId, newText) {
    const userId = authService.getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const messageRef = ref(database, `messages/${conversationId}/${messageId}`);
    const messageSnapshot = await new Promise((resolve) => {
      onValue(messageRef, resolve, { onlyOnce: true });
    });

    const message = messageSnapshot.val();
    if (message.senderId !== userId) {
      throw new Error('Can only edit your own messages');
    }

    await set(ref(database, `messages/${conversationId}/${messageId}`), {
      ...message,
      text: newText,
      edited: true,
      editedAt: Date.now()
    });
  }

  // Get user typing status
  async setTypingStatus(conversationId, isTyping) {
    const userId = authService.getCurrentUserId();
    if (!userId) return;

    const typingRef = ref(database, `typing/${conversationId}/${userId}`);
    if (isTyping) {
      await set(typingRef, {
        userId,
        timestamp: Date.now()
      });
    } else {
      await set(typingRef, null);
    }
  }

  // Listen to typing indicators
  listenToTypingStatus(conversationId, callback) {
    const typingQuery = ref(database, `typing/${conversationId}`);

    const unsubscribe = onValue(typingQuery, (snapshot) => {
      const typingUsers = [];
      snapshot.forEach((childSnapshot) => {
        const typingData = childSnapshot.val();
        if (typingData && Date.now() - typingData.timestamp < 5000) { // 5 second timeout
          typingUsers.push(typingData.userId);
        }
      });
      callback(typingUsers);
    });

    return unsubscribe;
  }

  // Get the last message in a conversation
  async getLastMessage(conversationId) {
    if (!this.isFirebaseReady() || !this.messagesRef) {
      return null;
    }

    try {
      return new Promise((resolve) => {
        const messagesQuery = query(
          ref(database, `messages/${conversationId}`),
          orderByChild('timestamp')
        );

        onValue(messagesQuery, (snapshot) => {
          let lastMessage = null;
          let latestTimestamp = 0;

          snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            if (message.timestamp > latestTimestamp) {
              latestTimestamp = message.timestamp;
              lastMessage = {
                id: childSnapshot.key,
                ...message
              };
            }
          });

          resolve(lastMessage);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.warn('Error getting last message:', error);
      return null;
    }
  }

  // Get unread count for a conversation
  async getUnreadCount(conversationId, userId) {
    if (!this.isFirebaseReady() || !this.messagesRef) {
      return 0;
    }

    try {
      return new Promise((resolve) => {
        const messagesQuery = query(
          ref(database, `messages/${conversationId}`),
          orderByChild('timestamp')
        );

        onValue(messagesQuery, (snapshot) => {
          let unreadCount = 0;

          snapshot.forEach((childSnapshot) => {
            const message = childSnapshot.val();
            // Count messages that are not sent by current user and not marked as delivered to current user
            if (message.senderId !== userId) {
              const messageSyncRef = ref(database, `messageSync/${conversationId}/${childSnapshot.key}/${userId}`);
              onValue(messageSyncRef, (syncSnapshot) => {
                const syncData = syncSnapshot.val();
                if (!syncData || syncData.status !== 'delivered') {
                  unreadCount++;
                }
              }, { onlyOnce: true });
            }
          });

          // Use a timeout to resolve with current count
          setTimeout(() => resolve(unreadCount), 100);
        }, { onlyOnce: true });
      });
    } catch (error) {
      console.warn('Error getting unread count:', error);
      return 0;
    }
  }
}

export const messagingService = new MessagingService();
