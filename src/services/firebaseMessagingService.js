import {
  firebaseRef as ref,
  firebaseOnValue as onValue,
  firebaseSet as set,
  firebaseGet as get,
  firebaseUpdate as update,
  firebasePush as push,
  firebaseQuery as query,
  firebaseOrderByChild as orderByChild,
  firebaseLimitToLast as limitToLast,
  firebaseEqualTo as equalTo,
  ensureFirebaseInitialized,
  safeDatabaseOperation,
  createRef,
  createQuery,
  safePush,
  safeSet,
  safeGet,
  safeUpdate
} from '../config/firebase';
import { Platform } from 'react-native';
import { getMessageQueue } from '../components/messaging/OfflineMessageQueue';
import { MessagingErrorHandler } from '../components/messaging/ErrorHandler';
import {
  getMessageStatusManager,
  getDeliveryConfirmationSystem,
  getMessageTrackingSystem,
  MESSAGE_STATUS,
} from '../components/messaging/MessageStatusSystem';
import {
  getMessagePaginationSystem,
  getFirebaseConnectionPool,
  getMessageLazyLoadingSystem,
} from '../components/messaging/MessagePerformanceSystem';
import { firebaseRealtimeService } from './firebaseRealtimeService';

const safeCreateConnection = safeDatabaseOperation('Create Connection', async (userId, caregiverId) => {
  const connectionRef = createRef(`connections/${userId}/${caregiverId}`);
  await safeSet(connectionRef, {
    createdAt: Date.now(),
    lastActivity: Date.now(),
  });
  return true;
});

const sortParticipantIds = (idA, idB) => {
  const [first, second] = [idA, idB].sort();
  return `${first}_${second}`;
};

class FirebaseMessagingService {
  constructor() {
    this.channelCache = new Map();
  }

  async ensureRealtimeSession() {
    const user = await firebaseRealtimeService.initializeRealtimeAuth();
    if (!user) {
      throw new Error('Firebase realtime session is unavailable.');
    }
    return user;
  }

  async createConnection(userId, caregiverId) {
    try {
      await this.ensureRealtimeSession();
      if (!ensureFirebaseInitialized()) {
        return false;
      }

      await safeCreateConnection(userId, caregiverId);
      await safeCreateConnection(caregiverId, userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  formatConversationId(userId, caregiverId, conversationId) {
    if (conversationId) return conversationId;
    return sortParticipantIds(userId, caregiverId);
  }

  async sendMessage(userId, caregiverId, messageText, messageType = 'text', fileData = null, conversationId = null) {
    if ((!messageText?.trim() && !fileData) || !userId || !caregiverId) {
      throw new Error('Invalid message data');
    }

    try {
      await this.ensureRealtimeSession();

      const messageQueue = getMessageQueue();
      const finalConversationId = this.formatConversationId(userId, caregiverId, conversationId);

      console.log('📨 Enhanced sendMessage with status tracking:', {
        userId,
        caregiverId,
        messageText,
        conversationId: finalConversationId,
      });

      // Initialize tracking systems
      const statusManager = getMessageStatusManager();
      const deliverySystem = getDeliveryConfirmationSystem();
      const trackingSystem = getMessageTrackingSystem();

      // Ensure connection exists before sending message
      await this.createConnection(userId, caregiverId);

      // Create message data for both online and offline scenarios
      const messageData = {
        conversationId: finalConversationId,
        userId,
        caregiverId,
        messageText: messageText?.trim() || '',
        messageType,
        fileData,
        timestamp: Date.now(),
      };

      // If offline, queue the message
      if (!messageQueue.isOnline) {
        console.log('📱 Device is offline - queuing message');
        const queuedMessageId = await messageQueue.addMessage(messageData);

        // Track the queued message
        trackingSystem.trackMessage(finalConversationId, queuedMessageId, MESSAGE_STATUS.QUEUED);

        // Return a mock message ID for UI consistency
        return {
          id: queuedMessageId,
          status: MESSAGE_STATUS.QUEUED,
          timestamp: Date.now(),
        };
      }

      // If online, try to send immediately using imported createRef
      const messagesPath = `messages/${finalConversationId}`;

      // Define firebaseMessageData before using it
      const firebaseMessageData = {
        conversationId: finalConversationId,
        userId,
        caregiverId,
        messageText: messageText?.trim() || '',
        messageType,
        timestamp: Date.now(),
        status: MESSAGE_STATUS.SENDING,
        type: messageType,
        edited: false,
        editedAt: null,
        sendingAt: Date.now(),
        sendingBy: userId,
      };

      if (fileData) {
        firebaseMessageData.file = {
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          base64: fileData.base64,
        };
      }

      // Use safePush to create the message and get the reference
      const newMessageRef = await safePush(messagesPath, firebaseMessageData);
      if (!newMessageRef) {
        throw new Error('Cannot create message reference');
      }

      // Track the message
      trackingSystem.trackMessage(finalConversationId, newMessageRef.key, MESSAGE_STATUS.SENDING);

      // Update status to sent
      await statusManager.updateMessageStatus(finalConversationId, newMessageRef.key, MESSAGE_STATUS.SENT, userId, {
        timestamp: Date.now(),
      });

      // Sync status across devices
      await deliverySystem.syncMessageStatus(finalConversationId, newMessageRef.key, userId, MESSAGE_STATUS.SENT);

      // Start delivery confirmation tracking
      deliverySystem.startDeliveryTracking(finalConversationId, newMessageRef.key, userId, caregiverId);

      // Update message status to delivered after a delay
      setTimeout(async () => {
        try {
          await statusManager.updateMessageStatus(finalConversationId, newMessageRef.key, MESSAGE_STATUS.DELIVERED, userId, {
            timestamp: Date.now(),
          });
          await deliverySystem.syncMessageStatus(finalConversationId, newMessageRef.key, userId, MESSAGE_STATUS.DELIVERED);
        } catch (error) {
          console.error('❌ Error updating delivery status:', error);
        }
      }, 1000);

      return {
        id: newMessageRef.key,
        status: MESSAGE_STATUS.SENT,
        timestamp: Date.now(),
      };
    } catch (error) {
      const errorConfig = MessagingErrorHandler.getUserFriendlyError(error);
      MessagingErrorHandler.logError(error, 'sendMessage');

      throw new Error(errorConfig.message);
    }
  }

  getConversations(userId, callback, userType = 'parent') {
    if (!userId || typeof callback !== 'function') {
      console.warn('getConversations called without valid userId or callback');
      return () => {};
    }

    if (!ensureFirebaseInitialized()) {
      console.warn('Firebase not initialized. Cannot subscribe to conversations.');
      callback([]);
      return () => {};
    }

    const connectionsRef = createRef(`connections/${userId}`);

    if (!connectionsRef || !onValue) {
      console.warn('Unable to create connections reference for conversations');
      callback([]);
      return () => {};
    }

    const processSnapshot = async (snapshot) => {
      try {
        const connectionsData = snapshot?.val() || {};
        const connectionIds = Object.keys(connectionsData);

        if (connectionIds.length === 0) {
          callback([]);
          return;
        }

        const conversationPromises = connectionIds.map((connectionId) =>
          this.getConversationData(userId, connectionId, userType)
        );

        const conversationResults = await Promise.all(conversationPromises);
        callback(conversationResults.filter(Boolean));
      } catch (error) {
        console.error('Error processing conversations snapshot:', error);
        callback([]);
      }
    };

    const unsubscribe = onValue(
      connectionsRef,
      (snapshot) => {
        processSnapshot(snapshot).catch((error) => {
          console.error('Error handling conversations update:', error);
          callback([]);
        });
      },
      (error) => {
        console.error('Firebase conversations listener error:', error);
        callback([]);
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('Error unsubscribing from conversations:', error);
      }
    };
  }

  // Get conversation data
  async getConversationData(userId, connectionId, userType = 'parent') {
    try {
      // Create consistent conversation ID: always use smaller ID first
      const [id1, id2] = [userId, connectionId].sort();
      const conversationId = `${id1}_${id2}`;

      console.log('📨 Getting conversation data for:', { userId, connectionId, conversationId, userType });

      // Get latest message - try both old and new conversation ID formats using imported createRef
      const messagesRef = createRef(`messages/${conversationId}`);
      const oldMessagesRef = createRef(`messages/${userId}_${connectionId}`);

      if (!messagesRef) {
        console.error('❌ Cannot create messages reference');
        return null;
      }

      let messageSnapshot = null;

      // Use imported createQuery helper
      if (messagesRef) {
        const messagesQuery = createQuery(messagesRef, orderByChild('timestamp'), limitToLast(1));
        if (messagesQuery) {
          messageSnapshot = await safeGet(messagesQuery);
        }
      }

      // If no messages found with new format, try old format
      if (!messageSnapshot || !messageSnapshot.exists()) {
        console.log('📨 No messages found with new format, trying old format');

        if (oldMessagesRef) {
          const oldMessagesQuery = createQuery(oldMessagesRef, orderByChild('timestamp'), limitToLast(1));
          if (oldMessagesQuery) {
            messageSnapshot = await safeGet(oldMessagesQuery);
          }
        }
      }

      let lastMessage = null;
      if (messageSnapshot && messageSnapshot.exists()) {
        const messageData = messageSnapshot.val();
        const messageKey = Object.keys(messageData)[0];
        lastMessage = messageData[messageKey];
      }

      // Get user info for the other party in the conversation using imported createRef
      const userRef = createRef(`users/${connectionId}`);
      if (!userRef) {
        console.error('❌ Cannot create user reference');
        return null;
      }

      let userSnapshot = await safeGet(userRef);
      const userData = userSnapshot ? (userSnapshot.val() || {}) : {};

      // Return conversation data based on user type
      if (userType === 'caregiver') {
        // For caregiver dashboard: return parent information
        return {
          id: connectionId, // Parent ID
          parentId: connectionId,
          parentName: userData.name || 'Parent',
          parentAvatar: userData.profileImage || null,
          lastMessage: lastMessage?.text || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || Date.now(),
          isRead: lastMessage?.senderId === userId || lastMessage?.read || false,
          conversationId: conversationId
        };
      } else {
        // For parent dashboard: return caregiver information
        return {
          id: connectionId, // Caregiver ID
          caregiverId: connectionId,
          caregiverName: userData.name || 'Caregiver',
          caregiverAvatar: userData.profileImage || null,
          lastMessage: lastMessage?.text || 'No messages yet',
          lastMessageTime: lastMessage?.timestamp || Date.now(),
          isRead: lastMessage?.senderId === userId || lastMessage?.read || false,
          conversationId: conversationId
        };
      }
    } catch (error) {
      console.error('Error getting conversation data:', error);
      return null;
    }
  }

  // Enhanced getMessages with pagination, caching, and connection pooling
  getMessages(userId, caregiverId, callback, conversationId = null) {
    if (!userId || !caregiverId) return () => {};

    // Create consistent conversation ID if not provided
    const finalConversationId = conversationId || (() => {
      const [id1, id2] = [userId, caregiverId].sort();
      return `${id1}_${id2}`;
    })();

    console.log('📨 Enhanced getMessages with performance optimizations for:', finalConversationId);

    // Use imported createRef helpers
    const messagesRef = createRef(`messages/${finalConversationId}`);
    const oldMessagesRef = createRef(`messages/${userId}_${caregiverId}`);

    if (!messagesRef) {
      console.error('❌ Cannot create messages reference for listener');
      return () => {};
    }

    // Use integrated performance system
    const paginationSystem = getMessagePaginationSystem();
    const connectionPool = getFirebaseConnectionPool();

    let messagesFound = false;
    let allMessages = [];

    const processMessages = async (snapshot) => {
      if (!messagesFound && snapshot && snapshot.exists()) {
        messagesFound = true;

        // Get connection from pool
        try {
          await connectionPool.getConnection(finalConversationId);
        } catch (error) {
          console.error('❌ Error getting connection from pool:', error);
        }

        const messagesData = [];

        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          const messageId = childSnapshot.key;

          // Enhanced message with performance tracking
          const enhancedMessage = {
            id: messageId,
            text: message.text || '',
            senderId: message.senderId,
            timestamp: message.timestamp,
            status: message.status || MESSAGE_STATUS.SENT,
            type: message.type || 'text',
            edited: message.edited || false,
            editedAt: message.editedAt,
            read: message.status === MESSAGE_STATUS.READ,
            // Add status timestamps
            sentAt: message.sentAt || message.timestamp,
            deliveredAt: message.deliveredAt,
            readAt: message.readAt,
            // Add user tracking
            sentBy: message.sentBy || message.senderId,
            deliveredTo: message.deliveredTo,
            readBy: message.readBy,
            // Add file support
            file: message.file,
            // Add metadata
            conversationId: finalConversationId,
            // Add status indicators for UI
            isCurrentUser: message.senderId === userId,
            statusText: getStatusText(message.status || MESSAGE_STATUS.SENT)
          };

          messagesData.push(enhancedMessage);
        });

        // Cache messages for better performance
        await paginationSystem.cacheMessages(finalConversationId, messagesData);

        // Sort messages by timestamp (oldest first for proper pagination)
        allMessages = messagesData.sort((a, b) => a.timestamp - b.timestamp);

        console.log('📨 Enhanced messages found and cached:', allMessages.length);
        callback(allMessages);
      }
    };

    // Helper function to get user-friendly status text
    function getStatusText(status) {
      switch (status) {
        case MESSAGE_STATUS.SENDING:
          return 'Sending...';
        case MESSAGE_STATUS.SENT:
          return 'Sent';
        case MESSAGE_STATUS.DELIVERED:
          return 'Delivered';
        case MESSAGE_STATUS.READ:
          return 'Read';
        case MESSAGE_STATUS.FAILED:
          return 'Failed to send';
        case MESSAGE_STATUS.QUEUED:
          return 'Sending...';
        default:
          return 'Unknown';
      }
    }

    const handleNewFormat = (snapshot) => {
      console.log('📨 New format listener triggered');
      processMessages(snapshot);
    };

    const handleOldFormat = (snapshot) => {
      console.log('📨 Old format listener triggered');
      processMessages(snapshot);
    };

    // Enhanced error handling for mobile with connection pooling
    let unsubscribeNew = () => {};
    let unsubscribeOld = () => {};

    try {
      // Use imported createQuery helper with connection pooling for better performance
      const newMessagesQuery = createQuery(messagesRef, orderByChild('timestamp'));
      const oldMessagesQuery = createQuery(oldMessagesRef, orderByChild('timestamp'));

      if (newMessagesQuery && onValue) {
        unsubscribeNew = onValue(newMessagesQuery, handleNewFormat, (error) => {
          console.error('❌ Firebase new format listener error:', error);
          connectionPool.releaseConnection(finalConversationId);
        });
      }

      if (oldMessagesQuery && onValue) {
        unsubscribeOld = onValue(oldMessagesQuery, handleOldFormat, (error) => {
          console.error('❌ Firebase old format listener error:', error);
          connectionPool.releaseConnection(finalConversationId);
        });
      }
    } catch (error) {
      console.error('❌ Failed to set up enhanced listeners:', error);
    }

    // Return cleanup function with connection pool cleanup
    return () => {
      console.log('📨 Cleaning up enhanced message listeners');
      try {
        unsubscribeNew();
        unsubscribeOld();
        connectionPool.releaseConnection(finalConversationId);
      } catch (error) {
        console.error('❌ Error cleaning up listeners:', error);
      }
    };
  }

  // The rest of the methods remain the same as they use the integrated systems
  // Get paginated messages (directly integrated)
  async getPaginatedMessages(conversationId, page = 0, limit = 50) {
    const paginationSystem = getMessagePaginationSystem();
    return await paginationSystem.getMessagesPaginated(conversationId, page, limit);
  }

  async setTypingStatus(conversationId, userId, isTyping) {
    if (!conversationId || !userId) {
      return;
    }

    try {
      await this.ensureRealtimeSession();

      const typingRef = createRef(`typing/${conversationId}/${userId}`);
      if (!typingRef) {
        console.warn('firebaseMessagingService: unable to create typing reference', {
          conversationId,
          userId,
        });
        return;
      }

      if (isTyping) {
        await safeSet(typingRef, {
          isTyping: true,
          updatedAt: Date.now(),
        });
      } else {
        await safeSet(typingRef, null);
      }
    } catch (error) {
      console.error('firebaseMessagingService: setTypingStatus failed', error);
    }
  }

  listenToTypingStatus(conversationId, callback) {
    if (!conversationId || typeof callback !== 'function') {
      return () => {};
    }

    if (!ensureFirebaseInitialized()) {
      callback([]);
      return () => {};
    }

    const typingRef = createRef(`typing/${conversationId}`);
    if (!typingRef || !onValue) {
      callback([]);
      return () => {};
    }

    const unsubscribe = onValue(
      typingRef,
      (snapshot) => {
        const typingData = snapshot?.val() || {};
        const typingUsers = Object.entries(typingData)
          .filter(([, value]) => value?.isTyping)
          .map(([userId]) => userId);
        callback(typingUsers);
      },
      (error) => {
        console.error('firebaseMessagingService: typing listener error', error);
        callback([]);
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('firebaseMessagingService: failed to unsubscribe typing listener', error);
      }
    };
  }

  async updateCurrentUserPresence(status = {}) {
    try {
      await this.ensureRealtimeSession();
      await firebaseRealtimeService.updateUserStatus({
        ...status,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('firebaseMessagingService: updateCurrentUserPresence failed', error);
    }
  }

  listenToUserPresence(userId, callback) {
    if (!userId || typeof callback !== 'function') {
      return () => {};
    }

    if (!ensureFirebaseInitialized()) {
      callback(null);
      return () => {};
    }

    const statusRef = createRef(`users/${userId}/status`);
    if (!statusRef || !onValue) {
      callback(null);
      return () => {};
    }

    const unsubscribe = onValue(
      statusRef,
      (snapshot) => {
        callback(snapshot?.val() || null);
      },
      (error) => {
        console.error('firebaseMessagingService: presence listener error', error);
        callback(null);
      }
    );

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('firebaseMessagingService: failed to unsubscribe presence listener', error);
      }
    };
  }

  // Get next page of messages (directly integrated)
  async getNextMessagePage(conversationId, lastMessageId) {
    const paginationSystem = getMessagePaginationSystem();
    return await paginationSystem.getNextPage(conversationId, lastMessageId);
  }

  // Get previous page of messages (directly integrated)
  async getPreviousMessagePage(conversationId, firstMessageId) {
    const paginationSystem = getMessagePaginationSystem();
    return await paginationSystem.getPreviousPage(conversationId, firstMessageId);
  }

  // Clear message cache (directly integrated)
  async clearMessageCache() {
    const paginationSystem = getMessagePaginationSystem();
    await paginationSystem.clearAllCache();
  }

  getConnectionPoolStats() {
    const connectionPool = getFirebaseConnectionPool();
    return connectionPool.getPoolStats();
  }

  async markMessagesAsRead(userId, caregiverId, conversationId = null) {
    if (!userId || !caregiverId) return;

    try {
      const finalConversationId = this.formatConversationId(userId, caregiverId, conversationId);

      console.log('👁️ Enhanced mark messages as read for conversation:', finalConversationId);

      const statusManager = getMessageStatusManager();
      const deliverySystem = getDeliveryConfirmationSystem();

      // Use imported createRef helper
      const messagesRef = createRef(`messages/${finalConversationId}`);
      if (!messagesRef) {
        console.error('❌ Cannot create messages reference for mark as read');
        return;
      }

      // Use imported createQuery helper
      let messagesQuery = createQuery(messagesRef, orderByChild('timestamp'));
      let snapshot = await safeGet(messagesQuery);

      if (!snapshot || !snapshot.exists()) {
        console.log('👁️ No messages found to mark as read');
        return;
      }

      const unreadMessages = [];
      const readConfirmations = [];

      // Find unread messages and prepare batch update
      snapshot.forEach((childSnapshot) => {
        const message = childSnapshot.val();
        if (message.senderId !== userId && message.status !== MESSAGE_STATUS.READ) {
          unreadMessages.push({
            id: childSnapshot.key,
            ...message
          });

          readConfirmations.push({
            conversationId: finalConversationId,
            messageId: childSnapshot.key,
            status: MESSAGE_STATUS.READ,
            userId: userId
          });
        }
      });

      if (unreadMessages.length === 0) {
        console.log('👁️ No unread messages found');
        return;
      }

      console.log(`👁️ Marking ${unreadMessages.length} messages as read`);

      // Batch update all messages to read status
      const batchResults = await statusManager.batchUpdateStatus(readConfirmations);

      // Confirm read status for each message
      for (let i = 0; i < unreadMessages.length; i++) {
        const message = unreadMessages[i];
        const result = batchResults[i];

        if (result.status === 'fulfilled') {
          // Confirm read with delivery system
          await deliverySystem.confirmRead(finalConversationId, message.id, userId);

          // Sync read status across devices
          await deliverySystem.syncMessageStatus(finalConversationId, message.id, userId, MESSAGE_STATUS.READ);

          console.log(`✅ Confirmed read and synced for message: ${message.id}`);
        } else {
          console.error(`❌ Failed to mark message as read: ${message.id}`, result.reason);
        }
      }

      console.log(`✅ Marked ${unreadMessages.length} messages as read successfully`);
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
      throw error;
    }
  }

  async updateMessageStatus(conversationId, messageId, newStatus, userId, options = {}) {
    const statusManager = getMessageStatusManager();
    const result = await statusManager.updateMessageStatus(conversationId, messageId, newStatus, userId, options);
    if (result.status === 'fulfilled') {
      console.log(`✅ Updated message status for message: ${messageId}`);
    } else {
      console.error(`❌ Failed to update message status: ${messageId}`, result.reason);
    }
    return result;
  }

  // Get message status with caching
  async getMessageStatus(conversationId, messageId) {
    const statusManager = getMessageStatusManager();
    const status = await statusManager.getMessageStatus(conversationId, messageId);
    console.log(`📝 Retrieved message status for message: ${messageId}`, status);
    return status;
  }

  // Track message for analytics
  trackMessage(conversationId, messageId, initialStatus = MESSAGE_STATUS.SENDING) {
    const trackingSystem = getMessageTrackingSystem();
    return trackingSystem.trackMessage(conversationId, messageId, initialStatus);
  }

  // Get tracking statistics
  getTrackingStats() {
    const trackingSystem = getMessageTrackingSystem();
    return trackingSystem.getTrackingStats();
  }
}

export default new FirebaseMessagingService();