import { database as db, firebaseRef as ref, firebaseOnValue as onValue, firebaseSet as set, firebaseGet as get, firebaseUpdate as update, firebaseQuery as query, firebaseOrderByChild as orderByChild, firebaseEqualTo as equalTo } from '../../config/firebaseConfig.js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check if Firebase functions are available at runtime
const checkFirebaseAvailability = () => {
  const isAvailable = !!(db && onValue && ref && set && get && update);
  console.log('🔍 MessageStatusSystem - Firebase runtime check:', {
    hasDb: !!db,
    hasOnValue: !!onValue,
    hasRef: !!ref,
    hasSet: !!set,
    hasGet: !!get,
    hasUpdate: !!update,
    isAvailable
  });
  return isAvailable;
};

// Message status constants
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
  QUEUED: 'queued',
  PENDING: 'pending'
};

// Status priority for conflict resolution
const STATUS_PRIORITY = {
  [MESSAGE_STATUS.FAILED]: 0,
  [MESSAGE_STATUS.QUEUED]: 1,
  [MESSAGE_STATUS.SENDING]: 2,
  [MESSAGE_STATUS.SENT]: 3,
  [MESSAGE_STATUS.DELIVERED]: 4,
  [MESSAGE_STATUS.READ]: 5
};

// Message status manager to handle race conditions
class MessageStatusManager {
  constructor() {
    this.statusListeners = new Map();
    this.pendingUpdates = new Map();
    this.isUpdating = new Set();
  }

  // Thread-safe status update with conflict resolution
  async updateMessageStatus(conversationId, messageId, newStatus, userId, options = {}) {
    if (!checkFirebaseAvailability()) {
      console.warn('⚠️ Firebase not available, skipping message status update');
      return false;
    }

    const updateKey = `${conversationId}_${messageId}`;
    const { force = false, timestamp = Date.now() } = options;

    // Prevent concurrent updates for the same message
    if (this.isUpdating.has(updateKey) && !force) {
      console.log(`📨 Status update already in progress for ${updateKey}, queuing`);
      this.pendingUpdates.set(updateKey, { newStatus, userId, timestamp, options });
      return false;
    }

    this.isUpdating.add(updateKey);

    try {
      console.log(`📨 Updating message status: ${messageId} -> ${newStatus} in ${conversationId}`);

      const messageRef = ref(db, `messages/${conversationId}/${messageId}`);

      // Get current message data
      const snapshot = await get(messageRef);
      if (!snapshot.exists()) {
        console.warn(`📨 Message ${messageId} not found`);
        return false;
      }

      const currentMessage = snapshot.val();
      const currentStatus = currentMessage.status;

      // Check if update is necessary based on priority
      if (!force && STATUS_PRIORITY[currentStatus] >= STATUS_PRIORITY[newStatus]) {
        console.log(`📨 Status update skipped - current: ${currentStatus}, new: ${newStatus}`);
        return false;
      }

      // Prepare status update with timestamp and user info
      const statusUpdate = {
        status: newStatus,
        [`${newStatus}At`]: timestamp,
        [`${newStatus}By`]: userId
      };

      // Add additional metadata for read status
      if (newStatus === MESSAGE_STATUS.READ) {
        statusUpdate.readBy = userId;
        statusUpdate.readAt = timestamp;
      }

      // Add delivery info for delivered status
      if (newStatus === MESSAGE_STATUS.DELIVERED) {
        statusUpdate.deliveredAt = timestamp;
        statusUpdate.deliveredTo = userId;
      }

      // Update Firebase
      await update(messageRef, statusUpdate);

      console.log(`✅ Message status updated: ${messageId} -> ${newStatus}`);

      // Process any pending updates for this message
      await this.processPendingUpdates(updateKey, conversationId, messageId);

      return true;
    } catch (error) {
      console.error(`❌ Failed to update message status:`, error);
      throw error;
    } finally {
      this.isUpdating.delete(updateKey);
    }
  }

  // Process pending status updates
  async processPendingUpdates(updateKey, conversationId, messageId) {
    const pendingUpdate = this.pendingUpdates.get(updateKey);
    if (pendingUpdate) {
      this.pendingUpdates.delete(updateKey);
      console.log(`📨 Processing pending update for ${updateKey}`);

      // Retry the pending update
      return await this.updateMessageStatus(
        conversationId,
        messageId,
        pendingUpdate.newStatus,
        pendingUpdate.userId,
        pendingUpdate.options
      );
    }
  }

  // Batch status updates for efficiency
  async batchUpdateStatus(updates) {
    const updatePromises = updates.map(({ conversationId, messageId, status, userId }) =>
      this.updateMessageStatus(conversationId, messageId, status, userId)
    );

    return Promise.allSettled(updatePromises);
  }

  // Real-time status listener
  listenToMessageStatus(conversationId, messageId, callback) {
    if (!checkFirebaseAvailability()) {
      console.warn('⚠️ Firebase not available, cannot listen to message status');
      return () => {}; // Return empty unsubscribe function
    }

    const listenerKey = `${conversationId}_${messageId}`;
    const messageRef = ref(db, `messages/${conversationId}/${messageId}`);

    const unsubscribe = onValue(messageRef, (snapshot) => {
      if (snapshot.exists()) {
        const message = snapshot.val();
        callback(message.status, message);
      }
    }, (error) => {
      console.error(`❌ Error listening to message status:`, error);
    });

    // Store listener for cleanup
    this.statusListeners.set(listenerKey, unsubscribe);

    return () => {
      const listener = this.statusListeners.get(listenerKey);
      if (listener) {
        listener();
        this.statusListeners.delete(listenerKey);
      }
    };
  }

  // Get message status with caching
  async getMessageStatus(conversationId, messageId) {
    if (!checkFirebaseAvailability()) {
      console.warn('⚠️ Firebase not available, cannot get message status');
      return null;
    }

    try {
      const messageRef = ref(db, `messages/${conversationId}/${messageId}`);
      const snapshot = await get(messageRef);

      if (snapshot.exists()) {
        return snapshot.val().status || MESSAGE_STATUS.SENT;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error getting message status:`, error);
      return null;
    }
  }

  // Clean up all listeners
  cleanup() {
    this.statusListeners.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
      } catch (error) {
        console.error(`❌ Error cleaning up listener ${key}:`, error);
      }
    });
    this.statusListeners.clear();
    this.pendingUpdates.clear();
    this.isUpdating.clear();
  }
}

// Delivery confirmation system
class DeliveryConfirmationSystem {
  constructor() {
    this.confirmationTimeouts = new Map();
    this.maxDeliveryTime = 30000; // 30 seconds
    this.maxReadTime = 300000; // 5 minutes
  }

  // Start delivery confirmation tracking
  startDeliveryTracking(conversationId, messageId, senderId, recipientId) {
    const timeoutKey = `${conversationId}_${messageId}`;

    // Set timeout for delivery confirmation
    const deliveryTimeout = setTimeout(async () => {
      try {
        const statusManager = new MessageStatusManager();
        const currentStatus = await statusManager.getMessageStatus(conversationId, messageId);

        if (currentStatus === MESSAGE_STATUS.SENT) {
          console.log(`📨 Delivery timeout reached for ${messageId}, marking as delivered`);
          await statusManager.updateMessageStatus(
            conversationId,
            messageId,
            MESSAGE_STATUS.DELIVERED,
            senderId,
            { timestamp: Date.now() }
          );
        }
      } catch (error) {
        console.error(`❌ Error in delivery timeout:`, error);
      }
    }, this.maxDeliveryTime);

    this.confirmationTimeouts.set(timeoutKey, {
      deliveryTimeout,
      messageId,
      conversationId,
      senderId,
      recipientId
    });

    console.log(`⏱️ Started delivery tracking for ${messageId}`);
  }

  // Confirm delivery
  async confirmDelivery(conversationId, messageId, userId) {
    try {
      const statusManager = new MessageStatusManager();
      await statusManager.updateMessageStatus(
        conversationId,
        messageId,
        MESSAGE_STATUS.DELIVERED,
        userId,
        { timestamp: Date.now(), force: true }
      );

      this.clearTimeout(conversationId, messageId);
      console.log(`✅ Delivery confirmed for ${messageId}`);
    } catch (error) {
      console.error(`❌ Error confirming delivery:`, error);
    }
  }

  // Confirm read status
  async confirmRead(conversationId, messageId, userId) {
    try {
      const statusManager = new MessageStatusManager();
      await statusManager.updateMessageStatus(
        conversationId,
        messageId,
        MESSAGE_STATUS.READ,
        userId,
        { timestamp: Date.now(), force: true }
      );

      this.clearTimeout(conversationId, messageId);
      console.log(`👁️ Read confirmed for ${messageId}`);
    } catch (error) {
      console.error(`❌ Error confirming read:`, error);
    }
  }

  // Clear timeouts
  clearTimeout(conversationId, messageId) {
    const timeoutKey = `${conversationId}_${messageId}`;
    const timeoutData = this.confirmationTimeouts.get(timeoutKey);

    if (timeoutData) {
      clearTimeout(timeoutData.deliveryTimeout);
      this.confirmationTimeouts.delete(timeoutKey);
      console.log(`🧹 Cleared timeout for ${messageId}`);
    }
  }

  // Sync message status across devices
  async syncMessageStatus(conversationId, messageId, userId, status) {
    if (!checkFirebaseAvailability()) {
      console.warn('⚠️ Firebase not available, cannot sync message status');
      return;
    }

    try {
      console.log(`📱 Syncing status ${status} for ${messageId} across devices`);

      // Create a sync reference for cross-device updates
      const syncRef = ref(db, `messageSync/${conversationId}/${messageId}/${userId}`);
      await set(syncRef, {
        status: status,
        timestamp: Date.now(),
        userId: userId,
        deviceId: this.getDeviceId()
      });

      console.log(`✅ Synced status ${status} for ${messageId}`);
    } catch (error) {
      console.error(`❌ Failed to sync status:`, error);
    }
  }

  // Listen for cross-device status updates
  listenForStatusSync(conversationId, userId, callback) {
    if (!checkFirebaseAvailability()) {
      console.warn('⚠️ Firebase not available, cannot listen for status sync');
      return () => {}; // Return empty unsubscribe function
    }

    const syncRef = ref(db, `messageSync/${conversationId}`);

    const unsubscribe = onValue(syncRef, (snapshot) => {
      if (snapshot.exists()) {
        const syncData = snapshot.val();

        // Process sync updates from other devices
        Object.keys(syncData).forEach((messageId) => {
          const messageSync = syncData[messageId];
          Object.keys(messageSync).forEach((deviceUserId) => {
            if (deviceUserId !== userId) { // Don't process own updates
              const statusUpdate = messageSync[deviceUserId];
              console.log(`📱 Received sync update for ${messageId}: ${statusUpdate.status}`);

              // Notify callback with the status update
              callback(messageId, statusUpdate.status, {
                userId: deviceUserId,
                timestamp: statusUpdate.timestamp,
                fromDevice: statusUpdate.deviceId
              });
            }
          });
        });
      }
    }, (error) => {
      console.error(`❌ Error listening for status sync:`, error);
    });

    return unsubscribe;
  }

  // Get unique device ID (using a simple hash for demo)
  getDeviceId() {
    // In production, use a proper device ID library
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Enhanced message tracking system
class MessageTrackingSystem {
  constructor() {
    this.trackedMessages = new Map();
    this.statusHistory = new Map();
  }

  // Track a new message
  trackMessage(conversationId, messageId, initialStatus = MESSAGE_STATUS.SENDING) {
    const messageData = {
      id: messageId,
      conversationId,
      status: initialStatus,
      statusHistory: [{
        status: initialStatus,
        timestamp: Date.now()
      }],
      createdAt: Date.now()
    };

    this.trackedMessages.set(messageId, messageData);
    this.updateStatusHistory(messageId, initialStatus);

    console.log(`📊 Started tracking message ${messageId} with status ${initialStatus}`);
  }

  // Update message status
  updateMessageStatus(messageId, newStatus, metadata = {}) {
    const message = this.trackedMessages.get(messageId);
    if (!message) {
      console.warn(`📊 Message ${messageId} not found for status update`);
      return;
    }

    const oldStatus = message.status;
    message.status = newStatus;
    message.lastUpdated = Date.now();
    message.metadata = { ...message.metadata, ...metadata };

    this.updateStatusHistory(messageId, newStatus, metadata);

    console.log(`📊 Updated message ${messageId}: ${oldStatus} -> ${newStatus}`);
  }

  // Update status history
  updateStatusHistory(messageId, status, metadata = {}) {
    const historyEntry = {
      status,
      timestamp: Date.now(),
      ...metadata
    };

    if (!this.statusHistory.has(messageId)) {
      this.statusHistory.set(messageId, []);
    }

    const history = this.statusHistory.get(messageId);
    history.push(historyEntry);

    // Keep only last 10 status changes to prevent memory leaks
    if (history.length > 10) {
      history.shift();
    }
  }

  // Get message status with full history
  getMessageStatus(messageId) {
    const message = this.trackedMessages.get(messageId);
    const history = this.statusHistory.get(messageId) || [];

    return {
      currentStatus: message?.status || MESSAGE_STATUS.UNKNOWN,
      history: history,
      createdAt: message?.createdAt,
      lastUpdated: message?.lastUpdated
    };
  }

  // Get messages by status
  getMessagesByStatus(status) {
    const messages = [];

    this.trackedMessages.forEach((message, messageId) => {
      if (message.status === status) {
        messages.push({
          id: messageId,
          ...message
        });
      }
    });

    return messages;
  }

  // Clean up old messages
  cleanup(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoffTime = Date.now() - maxAge;

    this.trackedMessages.forEach((message, messageId) => {
      if (message.createdAt < cutoffTime) {
        this.trackedMessages.delete(messageId);
        this.statusHistory.delete(messageId);
      }
    });

    console.log(`🧹 Cleaned up old tracked messages`);
  }

  // Get tracking statistics
  getTrackingStats() {
    const stats = {
      totalTracked: this.trackedMessages.size,
      byStatus: {},
      oldestMessage: null,
      newestMessage: null
    };

    let oldestTime = Date.now();
    let newestTime = 0;

    this.trackedMessages.forEach((message) => {
      // Count by status
      stats.byStatus[message.status] = (stats.byStatus[message.status] || 0) + 1;

      // Track oldest/newest
      if (message.createdAt < oldestTime) {
        oldestTime = message.createdAt;
        stats.oldestMessage = message;
      }

      if (message.createdAt > newestTime) {
        newestTime = message.createdAt;
        stats.newestMessage = message;
      }
    });

    return stats;
  }
}

// Singleton instances
let messageStatusManager = null;
let deliveryConfirmationSystem = null;
let messageTrackingSystem = null;

export const getMessageStatusManager = () => {
  if (!messageStatusManager) {
    messageStatusManager = new MessageStatusManager();
  }
  return messageStatusManager;
};

export const getDeliveryConfirmationSystem = () => {
  if (!deliveryConfirmationSystem) {
    deliveryConfirmationSystem = new DeliveryConfirmationSystem();
  }
  return deliveryConfirmationSystem;
};

export const getMessageTrackingSystem = () => {
  if (!messageTrackingSystem) {
    messageTrackingSystem = new MessageTrackingSystem();
  }
  return messageTrackingSystem;
};

// Cleanup function
export const cleanupAllSystems = () => {
  if (messageStatusManager) {
    messageStatusManager.cleanup();
  }
  if (deliveryConfirmationSystem) {
    deliveryConfirmationSystem.cleanup();
  }
  if (messageTrackingSystem) {
    messageTrackingSystem.cleanup();
  }
};

export default {
  MessageStatusManager,
  DeliveryConfirmationSystem,
  MessageTrackingSystem,
  MESSAGE_STATUS,
  getMessageStatusManager,
  getDeliveryConfirmationSystem,
  getMessageTrackingSystem,
  cleanupAllSystems
};
