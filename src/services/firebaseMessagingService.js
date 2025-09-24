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
  getDatabaseSafely,
  withFirebaseCheck,
  safeDatabaseOperation
} from '../config/firebase';
import { getFirebaseDatabase } from '../config/firebase';
import { Platform } from 'react-native';
import { getMessageQueue } from '../components/messaging/OfflineMessageQueue';
import { MessagingErrorHandler } from '../components/messaging/ErrorHandler';
import {
  getMessageStatusManager,
  getDeliveryConfirmationSystem,
  getMessageTrackingSystem,
  MESSAGE_STATUS
} from '../components/messaging/MessageStatusSystem';
import {
  getMessagePaginationSystem,
  getFirebaseConnectionPool,
  getMessageLazyLoadingSystem
} from '../components/messaging/MessagePerformanceSystem';

// Mobile-specific: Create database reference using imported functions
const createRef = (path) => {
  // Ensure Firebase is initialized before database operations
  if (!ensureFirebaseInitialized()) {
    console.error('❌ Firebase not initialized, cannot create reference');
    return null;
  }

  try {
    const db = getFirebaseDatabase();
    return ref(db, path);
  } catch (error) {
    console.error('❌ Error creating Firebase reference:', error);
    return null;
  }
};

// Mobile-specific: Create query using imported functions
const createQuery = (ref, ...queryConstraints) => {
  // Ensure Firebase is initialized before database operations
  if (!ensureFirebaseInitialized()) {
    console.error('❌ Firebase not initialized, cannot create query');
    return null;
  }

  if (!ref) {
    console.error('❌ Cannot create query - reference is null');
    return null;
  }

  try {
    return query(ref, ...queryConstraints);
  } catch (error) {
    console.error('❌ Failed to create query:', error);
    return null;
  }
};

// Mobile-specific Firebase connection check
const checkFirebaseConnection = () => {
  console.log('🔍 Checking Firebase connection...');
  console.log('📱 Platform:', Platform.OS);
  console.log('🔥 Database object:', firebaseDatabase ? 'Available' : 'Not available');

  // Ensure Firebase is initialized before connection check
  if (!ensureFirebaseInitialized()) {
    console.error('❌ Firebase not initialized, cannot check connection');
    return () => {};
  }

  // Check if Firebase functions are available at runtime
  const checkFirebaseAvailability = () => {
    const db = getFirebaseDatabase();
    return !!(db && onValue && ref && set && get && update);
  };

  if (!checkFirebaseAvailability()) {
    console.warn('⚠️ Firebase not available, skipping connection check');
    return () => {};
  }

  if (Platform.OS !== 'web') {
    console.log('📱 Mobile Firebase - Checking connection...');
    try {
      // Check if database is available
      const db = getFirebaseDatabase();
      if (!db) {
        console.error('❌ Database object is null or undefined!');
        return () => {};
      }

      // For mobile platforms, use the imported ref function directly
      if (ref) {
        // Try to create a simple test reference instead of .info/connected
        // .info/connected requires a working Firebase Realtime Database connection
        const testRef = ref(db, 'test');

        if (onValue) {
          const unsubscribe = onValue(testRef, (snapshot) => {
            console.log('🔥 Firebase basic connection test: SUCCESS');
            console.log('📊 Test data received:', snapshot.val());
          }, (error) => {
            console.error('❌ Firebase connection test failed:', error);
            console.log('🔍 This might indicate:');
            console.log('   - Firebase Realtime Database not enabled');
            console.log('   - Network connectivity issues');
            console.log('   - Firebase security rules blocking access');
            console.log('   - Invalid Firebase project configuration');
          });

          return unsubscribe;
        } else {
          console.warn('⚠️ Firebase onValue method not available for connection check, but main functions are available');
          return () => {};
        }
      } else {
        console.error('❌ Firebase ref function not available for connection check');
        return () => {};
      }
    } catch (error) {
      console.error('❌ Firebase connection check failed:', error);
      console.log('🔍 Error details:', error.message);
      console.log('💡 Possible solutions:');
      console.log('   1. Check Firebase project configuration');
      console.log('   2. Verify Realtime Database is enabled');
      console.log('   3. Check network connectivity');
      console.log('   4. Review Firebase security rules');
      return () => {};
    }
  }

  return () => {};
};

// Example of using the safe database operation wrapper
const safeCreateConnection = safeDatabaseOperation('Create Connection', async (userId, caregiverId) => {
  const db = getFirebaseDatabase();
  const connectionRef = ref(db, `connections/${userId}/${caregiverId}`);
  await set(connectionRef, {
    createdAt: Date.now(),
    lastActivity: Date.now()
  });
  return true;
});

class FirebaseMessagingService {
  // Enhanced createConnection with better error handling
  async createConnection(userId, caregiverId) {
    try {
      console.log('🔗 Creating connection between:', { userId, caregiverId });

      // Ensure Firebase is initialized before database operations
      if (!ensureFirebaseInitialized()) {
        console.error('❌ Firebase not initialized, cannot create connection');
        return false;
      }

      // Check if database is available
      const db = getFirebaseDatabase();
      if (!db) {
        console.error('❌ Database is not available for createConnection');
        return false;
      }

      // Check if set function is available
      if (!set) {
        console.error('❌ Firebase set function is not available');
        return false;
      }

      // Check if ref function is available
      if (!ref) {
        console.error('❌ Firebase ref function is not available');
        return false;
      }

      // Create connection reference with error handling
      let connectionRef;
      try {
        // Use the imported ref function instead of database.ref
        connectionRef = ref(db, `connections/${userId}/${caregiverId}`);

        if (!connectionRef) {
          console.error('❌ Failed to create connection reference');
          return false;
        }
        console.log('✅ Connection reference created successfully');
      } catch (refError) {
        console.error('❌ Error creating connection reference:', refError);
        console.log('🔍 This indicates Firebase may not be properly initialized or connected');
        return false;
      }

      // Set connection data with error handling
      try {
        await set(connectionRef, {
          createdAt: Date.now(),
          lastActivity: Date.now()
        });
        console.log('✅ Connection data set successfully');
      } catch (setError) {
        console.error('❌ Error setting connection data:', setError);
        console.log('🔍 Firebase write operation failed. Possible causes:');
        console.log('   - No network connectivity');
        console.log('   - Firebase security rules blocking write');
        console.log('   - Realtime Database not enabled');
        console.log('   - Firebase project quota exceeded');
        return false;
      }

      // Create reverse connection
      try {
        const reverseConnectionRef = ref(db, `connections/${caregiverId}/${userId}`);
        if (reverseConnectionRef) {
          await set(reverseConnectionRef, {
            createdAt: Date.now(),
            lastActivity: Date.now()
          });
          console.log('✅ Reverse connection data set successfully');
        } else {
          console.error('❌ Failed to create reverse connection reference');
        }
      } catch (reverseError) {
        console.error('❌ Error setting reverse connection data:', reverseError);
        console.log('⚠️ Reverse connection failed, but main connection succeeded');
        // Don't return false here as the main connection was successful
      }

      console.log('✅ Connection creation completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating connection:', error);
      console.log('🔍 Connection creation failed with error:', error.message);
      console.log('💡 The app will continue to work with local data');
      return false;
    }
  }

  // Send message with enhanced status tracking
  async sendMessage(userId, caregiverId, messageText, messageType = 'text', fileData = null, conversationId = null) {
    if ((!messageText?.trim() && !fileData) || !userId || !caregiverId) {
      throw new Error('Invalid message data');
    }

    try {
      const messageQueue = getMessageQueue();
      const finalConversationId = conversationId || (() => {
        const [id1, id2] = [userId, caregiverId].sort();
        return `${id1}_${id2}`;
      })();

      console.log('📨 Enhanced sendMessage with status tracking:', {
        userId,
        caregiverId,
        messageText,
        conversationId: finalConversationId
      });

      // Initialize tracking systems
      const statusManager = getMessageStatusManager();
      const deliverySystem = getDeliveryConfirmationSystem();
      const trackingSystem = getMessageTrackingSystem();

      // Ensure connection exists before sending message
      try {
        console.log('🔗 Ensuring Firebase connection exists for messaging:', { userId, caregiverId });
        await this.createConnection(userId, caregiverId);
        console.log('✅ Firebase connection ensured for messaging');
      } catch (connectionError) {
        console.warn('⚠️ Failed to ensure Firebase connection for messaging:', connectionError.message);
        // Continue with sending message even if connection creation fails
      }

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
          timestamp: Date.now()
        };
      }

      // If online, try to send immediately
      const messageRef = createRef(`messages/${finalConversationId}`);
      if (!messageRef) {
        throw new Error('Cannot create message reference');
      }

      if (!push) {
        throw new Error('Push function not available');
      }

      const newMessageRef = push(messageRef);

      const firebaseMessageData = {
        text: messageData.messageText,
        senderId: userId,
        timestamp: messageData.timestamp,
        status: MESSAGE_STATUS.SENDING,
        type: messageType,
        edited: false,
        editedAt: null,
        sendingAt: Date.now(),
        sendingBy: userId
      };

      if (fileData) {
        firebaseMessageData.file = {
          name: fileData.name,
          size: fileData.size,
          type: fileData.type,
          base64: fileData.base64
        };
      }

      // Set initial message data
      await set(newMessageRef, firebaseMessageData);

      // Track the message
      trackingSystem.trackMessage(finalConversationId, newMessageRef.key, MESSAGE_STATUS.SENDING);

      // Update status to sent
      await statusManager.updateMessageStatus(
        finalConversationId,
        newMessageRef.key,
        MESSAGE_STATUS.SENT,
        userId,
        { timestamp: Date.now() }
      );

      // Sync status across devices
      await deliverySystem.syncMessageStatus(finalConversationId, newMessageRef.key, userId, MESSAGE_STATUS.SENT);

      // Start delivery confirmation tracking
      deliverySystem.startDeliveryTracking(finalConversationId, newMessageRef.key, userId, caregiverId);

      // Update message status to delivered after a delay
      setTimeout(async () => {
        try {
          await statusManager.updateMessageStatus(
            finalConversationId,
            newMessageRef.key,
            MESSAGE_STATUS.DELIVERED,
            userId,
            { timestamp: Date.now() }
          );

          // Sync delivery status
          await deliverySystem.syncMessageStatus(finalConversationId, newMessageRef.key, userId, MESSAGE_STATUS.DELIVERED);
        } catch (error) {
          console.error('❌ Error updating delivery status:', error);
        }
      }, 1000);

      // Update connection activity
      // TODO: Implement updateConnectionActivity method if needed
      // await this.updateConnectionActivity(userId, caregiverId);
    } catch (error) {
      console.error('❌ Enhanced sendMessage error:', error);

      // Use error handler to provide user-friendly error
      const errorConfig = MessagingErrorHandler.getUserFriendlyError(error);
      MessagingErrorHandler.logError(error, 'sendMessage');

      throw new Error(errorConfig.message);
    }
  }

  // Get conversations for user with mobile-specific handling
  getConversations(userId, callback, userType = 'parent') {
    if (!userId) return () => {};

    const connectionsRef = createRef(`connections/${userId}`);

    if (!connectionsRef) {
      console.error('❌ Cannot create connections reference');
      callback([]);
      return () => {};
    }

    console.log('📨 Setting up conversations listener for user:', userId, 'userType:', userType);

    const handleConnections = async (snapshot) => {
      try {
        const connectionsData = snapshot.val() || {};
        const connectionIds = Object.keys(connectionsData);

        console.log('📨 Found connections:', connectionIds.length);

        if (connectionIds.length === 0) {
          console.log('📨 No connections found');
          callback([]);
          return;
        }

        const conversations = [];

        for (const connectionId of connectionIds) {
          try {
            const conversation = await this.getConversationData(userId, connectionId, userType);
            if (conversation) {
              conversations.push(conversation);
            }
          } catch (error) {
            console.error('❌ Error getting conversation for', connectionId, error);
          }
        }

        const sortedConversations = conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
        console.log('📨 Returning conversations:', sortedConversations.length);
        callback(sortedConversations);
      } catch (error) {
        console.error('❌ Error processing connections:', error);
        callback([]);
      }
    };

    // Enhanced error handling for mobile
    try {
      const unsubscribe = onValue(connectionsRef, handleConnections, (error) => {
        console.error('❌ Firebase connections listener error:', error);
        // Retry with delay for mobile stability
        setTimeout(() => {
          try {
            console.log('🔄 Retrying conversations listener');
            onValue(connectionsRef, handleConnections, (retryError) => {
              console.error('❌ Retry failed for conversations:', retryError);
            });
          } catch (retryError) {
            console.error('❌ Retry setup failed for conversations:', retryError);
          }
        }, 2000);
      });

      return () => {
        console.log('📨 Cleaning up conversations listener');
        try {
          unsubscribe();
        } catch (error) {
          console.error('❌ Error cleaning up conversations listener:', error);
        }
      };
    } catch (error) {
      console.error('❌ Failed to set up conversations listener:', error);
      return () => {};
    }
  }

  // Get conversation data
  async getConversationData(userId, connectionId, userType = 'parent') {
    try {
      // Create consistent conversation ID: always use smaller ID first
      const [id1, id2] = [userId, connectionId].sort();
      const conversationId = `${id1}_${id2}`;

      console.log('📨 Getting conversation data for:', { userId, connectionId, conversationId, userType });

      // Get latest message - try both old and new conversation ID formats
      const messagesRef = createRef(`messages/${conversationId}`);
      const oldMessagesRef = createRef(`messages/${userId}_${connectionId}`);

      if (!messagesRef) {
        console.error('❌ Cannot create messages reference');
        return null;
      }

      let messageSnapshot = null;

      if (messagesRef && get && orderByChild && limitToLast) {
        const messagesQuery = createQuery(messagesRef, orderByChild('timestamp'), limitToLast(1));
        if (messagesQuery) {
          messageSnapshot = await get(messagesQuery);
        }
      }

      // If no messages found with new format, try old format
      if (!messageSnapshot || !messageSnapshot.exists()) {
        console.log('📨 No messages found with new format, trying old format');

        if (oldMessagesRef && get && orderByChild && limitToLast) {
          const oldMessagesQuery = createQuery(oldMessagesRef, orderByChild('timestamp'), limitToLast(1));
          if (oldMessagesQuery) {
            messageSnapshot = await get(oldMessagesQuery);
          }
        }
      }

      let lastMessage = null;
      if (messageSnapshot && messageSnapshot.exists()) {
        const messageData = messageSnapshot.val();
        const messageKey = Object.keys(messageData)[0];
        lastMessage = messageData[messageKey];
      }

      // Get user info for the other party in the conversation
      const userRef = createRef(`users/${connectionId}`);
      if (!userRef) {
        console.error('❌ Cannot create user reference');
        return null;
      }

      let userSnapshot = null;
      if (get) {
        userSnapshot = await get(userRef);
      }

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
      // Use connection pooling for better performance
      const newMessagesQuery = query(messagesRef, orderByChild('timestamp'));
      const oldMessagesQuery = query(oldMessagesRef, orderByChild('timestamp'));

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

  // Get paginated messages (directly integrated)
  async getPaginatedMessages(conversationId, page = 0, limit = 50) {
    const paginationSystem = getMessagePaginationSystem();
    return await paginationSystem.getMessagesPaginated(conversationId, page, limit);
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

  // Get connection pool statistics (directly integrated)
  getConnectionPoolStats() {
    const connectionPool = getFirebaseConnectionPool();
    return connectionPool.getPoolStats();
  }

  // Enhanced mark messages as read with race condition prevention
  async markMessagesAsRead(userId, caregiverId, conversationId = null) {
    if (!userId || !caregiverId) return;

    try {
      const finalConversationId = conversationId || (() => {
        const [id1, id2] = [userId, caregiverId].sort();
        return `${id1}_${id2}`;
      })();

      console.log('👁️ Enhanced mark messages as read for conversation:', finalConversationId);

      const statusManager = getMessageStatusManager();
      const deliverySystem = getDeliveryConfirmationSystem();

      // Get all unread messages in the conversation
      const messagesRef = createRef(`messages/${finalConversationId}`);
      if (!messagesRef) {
        console.error('❌ Cannot create messages reference for mark as read');
        return;
      }

      let messagesQuery = null;
      if (messagesRef && orderByChild && query) {
        messagesQuery = createQuery(messagesRef, orderByChild('timestamp'));
      }

      let snapshot = null;
      if (messagesQuery && get) {
        snapshot = await get(messagesQuery);
      }

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

  // Enhanced update message status with conflict resolution
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