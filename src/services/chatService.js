import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove, 
  increment, 
  getDocs, 
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { 
  ref as storageRef, 
  getDownloadURL, 
  uploadBytes,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import * as FileSystem from 'expo-file-system';

// Constants
const MESSAGES_PER_PAGE = 30;
const MAX_FILE_SIZE_MB = 10; // 10MB max file size
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * Get a conversation ID between two users
 * @param {string} uid1 - First user ID
 * @param {string} uid2 - Second user ID
 * @returns {string} Conversation ID
 */
const getConversationId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

/**
 * Subscribe to conversation messages in real-time
 * @param {string} conversationId - ID of the conversation
 * @param {Function} onMessagesUpdate - Callback when messages update
 * @param {number} limitMessages - Number of messages to load initially
 * @returns {Function} Unsubscribe function
 */
const subscribeToConversation = (conversationId, onMessagesUpdate, limitMessages = MESSAGES_PER_PAGE) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(limitMessages)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          _id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          sent: true,
          received: true,
          read: data.read || false,
        });
      });
      onMessagesUpdate(messages);
    });
  } catch (error) {
    console.error('Error subscribing to conversation:', error);
    throw error;
  }
};

/**
 * Send a new message to a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} senderId - ID of the message sender
 * @param {Object} message - Message object
 * @param {string} [message.text] - Message text (optional if file is provided)
 * @param {Object} [message.file] - File object with uri, type, and name
 * @param {string} [message.replyTo] - ID of the message being replied to
 * @param {string} [message.forwardedFrom] - ID of the user who forwarded the message
 * @returns {Promise<Object>} { messageId, downloadUrl (if file was uploaded) }
 */
async function sendMessage(conversationId, senderId, { text, file, replyTo, forwardedFrom }) {
  try {
    const messageRef = collection(db, 'conversations', conversationId, 'messages');
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // Get conversation to find other participants
    const conversationDoc = await getDoc(conversationRef);
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }
    
    const conversation = conversationDoc.data();
    const otherParticipantId = conversation.participants.find(id => id !== senderId);
    
    // Upload file if provided
    let fileData = null;
    if (file) {
      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);
      
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      }
      
      // Check file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        throw new Error('File type not supported');
      }
      
      // Upload file to Firebase Storage
      fileData = await uploadFile(file, conversationId);
    }
    
    // Prepare message data
    const messageData = {
      text: text || '',
      senderId,
      createdAt: serverTimestamp(),
      readBy: { [senderId]: new Date().toISOString() }, // Sender has read their own message
      status: 'sent',
      ...(fileData && { 
        file: {
          url: fileData.url,
          type: fileData.type,
          name: fileData.name,
          size: fileData.size
        }
      }),
      ...(replyTo && { replyTo }),
      ...(forwardedFrom && { forwardedFrom })
    };
    
    // Start a batch write for atomic updates
    const batch = writeBatch(db);
    
    // Add message to messages subcollection
    const messageDocRef = doc(messageRef);
    batch.set(messageDocRef, messageData);
    
    // Update conversation last message and timestamp
    batch.update(conversationRef, {
      lastMessage: {
        text: text || (file ? `Sent a ${file.type?.split('/')[0] || 'file'}` : 'New message'),
        senderId,
        timestamp: serverTimestamp()
      },
      lastUpdated: serverTimestamp(),
      [`unreadCount.${senderId}`]: 0, // Reset unread count for sender
      [`unreadCount.${otherParticipantId}`]: increment(1) // Increment for recipient
    });
    
    // Commit the batch
    await batch.commit();
    
    return { 
      messageId: messageDocRef.id,
      ...(fileData && { downloadUrl: fileData.url })
    };
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user marking messages as read
 * @param {Array<string>} messageIds - Array of message IDs to mark as read
 * @param {boolean} [updateUnreadCount=true] - Whether to update the unread count
 */
async function markMessagesAsRead(conversationId, userId, messageIds, updateUnreadCount = true) {
  if (!messageIds.length) return;
  
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  
  // Mark specific messages as read
  messageIds.forEach(messageId => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    batch.update(messageRef, {
      [`readBy.${userId}`]: now,
      status: 'read',
      ...(updateUnreadCount && { lastRead: now })
    });
  });
  
  if (updateUnreadCount) {
    // Update unread count in conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0,
      lastRead: {
        [userId]: now
      }
    });
  }
  
  try {
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Mark all messages in a conversation as read
 * @param {string} conversationId - ID of the conversation
 * @param {string} userId - ID of the user marking messages as read
 * @returns {Promise<number>} Number of messages marked as read
 */
async function markAllMessagesAsRead(conversationId, userId) {
  try {
    // First mark all unread messages as read
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where(`readBy.${userId}`, '==', null),
      where('senderId', '!=', userId) // Only mark messages from others as read
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return 0;
    
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, {
        [`readBy.${userId}`]: now,
        status: 'read',
        lastRead: now
      });
    });
    
    // Update conversation unread count and last read timestamp
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0,
      lastRead: {
        [userId]: now
      }
    });
    
    await batch.commit();
    return querySnapshot.size; // Return number of messages marked as read
    
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    throw error;
  }
}

/**
 * Update message status (e.g., 'sent', 'delivered', 'read')
 * @param {string} conversationId - ID of the conversation
 * @param {string} messageId - ID of the message to update
 * @param {string} status - New status ('sent', 'delivered', 'read')
 * @param {string} [userId] - Required if status is 'read'
 */
async function updateMessageStatus(conversationId, messageId, status, userId) {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    const updateData = { status };
    
    if (status === 'read' && userId) {
      updateData[`readBy.${userId}`] = new Date().toISOString();
    }
    
    if (status === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
    }
    
    await updateDoc(messageRef, updateData);
    
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
};

/**
 * Upload a file to Firebase Storage
 * @param {Object} file - File object with uri, type, and name
 * @param {string} conversationId - ID of the conversation
 * @param {string} [customPath] - Custom storage path (optional)
 * @returns {Promise<{url: string, path: string, name: string, type: string, size: number}>} File metadata
 */
async function uploadFile(file, conversationId, customPath = null) {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(file.uri);
    const fileSizeMB = fileInfo.size / (1024 * 1024);
    
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not supported');
    }
    
    // Generate file path
    const fileExt = file.uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = customPath || `messages/${conversationId}/${fileName}`;
    
    // Upload file
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const fileRef = storageRef(storage, filePath);
    
    await uploadBytes(fileRef, blob);
    const downloadURL = await getDownloadURL(fileRef);
    
    return {
      url: downloadURL,
      path: filePath,
      name: file.name || fileName,
      type: file.type,
      size: fileInfo.size
    };
    
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 * @param {string} filePath - Path to the file in storage
 * @returns {Promise<void>}
 */
async function deleteFile(filePath) {
  try {
    const fileRef = storageRef(storage, filePath);
    await deleteObject(fileRef);
  } catch (error) {
    // If file doesn't exist, we can ignore the error
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

/**
 * Search messages in a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} searchTerm - Search term
 * @param {string} [userId] - Optional user ID to filter by sender
 * @param {Date} [startDate] - Optional start date for filtering
 * @param {Date} [endDate] - Optional end date for filtering
 * @param {number} [limit=50] - Maximum number of results to return
 * @returns {Promise<Array>} Array of matching messages with metadata
 */
async function searchMessages(conversationId, searchTerm, userId = null, startDate = null, endDate = null, limit = 50) {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    let q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(limit)
    );
    
    // Add text search filter
    if (searchTerm) {
      // Note: This is a client-side filter since Firestore doesn't support full-text search natively
      // For production, consider using a dedicated search service like Algolia or Elasticsearch
      const messagesSnapshot = await getDocs(q);
      const results = [];
      
      messagesSnapshot.forEach(doc => {
        const data = doc.data();
        const messageText = data.text?.toLowerCase() || '';
        
        // Check if message matches search term
        if (messageText.includes(searchTerm.toLowerCase())) {
          // Apply additional filters
          const matchesSender = !userId || data.senderId === userId;
          const messageDate = data.createdAt?.toDate();
          const matchesDate = (!startDate || messageDate >= startDate) && 
                            (!endDate || messageDate <= endDate);
          
          if (matchesSender && matchesDate) {
            results.push({
              id: doc.id,
              ...data,
              _doc: doc // Include the full document reference
            });
          }
        }
      });
      
      return results;
    }
    
    // If no search term, just apply filters
    if (userId) {
      q = query(q, where('senderId', '==', userId));
    }
    
    if (startDate) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }
    
    if (endDate) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _doc: doc
    }));
    
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

/**
 * Get or create a conversation between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<string>} Conversation ID
 */
const getOrCreateConversation = async (userId1, userId2) => {
  const conversationId = getConversationId(userId1, userId2);
  const conversationRef = doc(db, 'conversations', conversationId);
  
  try {
    await runTransaction(db, async (transaction) => {
      const conversationDoc = await transaction.get(conversationRef);
      
      if (!conversationDoc.exists()) {
        // Create new conversation
        transaction.set(conversationRef, {
          participants: [userId1, userId2],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          unreadCount: {
            [userId1]: 0,
            [userId2]: 0
          },
          lastMessage: null
        });
      }
    });
    
    return conversationId;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

/**
 * Get all conversations for a user
 * @param {string} userId - ID of the user
 * @param {Function} onConversationsUpdate - Callback when conversations update
 * @returns {Function} Unsubscribe function
 */
const subscribeToUserConversations = (userId, onConversationsUpdate) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastUpdated', 'desc')
    );

    return onSnapshot(q, async (snapshot) => {
      const conversations = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const otherParticipantId = data.participants.find(id => id !== userId);
        
        // Get other participant's data
        let participantData = {};
        try {
          const userDoc = await getDoc(doc(db, 'users', otherParticipantId));
          if (userDoc.exists()) {
            participantData = userDoc.data();
          }
        } catch (error) {
          console.error('Error fetching participant data:', error);
        }
        
        conversations.push({
          id: doc.id,
          ...data,
          lastUpdated: data.lastUpdated?.toDate() || new Date(),
          participant: {
            id: otherParticipantId,
            name: participantData.displayName || 'Unknown User',
            avatar: participantData.photoURL || null
          },
          unreadCount: data.unreadCount?.[userId] || 0
        });
      }
      
      onConversationsUpdate(conversations);
    });
  } catch (error) {
    console.error('Error subscribing to conversations:', error);
    throw error;
  }
};

/**
 * Delete a message (soft delete)
 * @param {string} conversationId - ID of the conversation
 * @param {string} messageId - ID of the message to delete
 * @param {string} userId - ID of the user deleting the message
 */
const deleteMessage = async (conversationId, messageId, userId) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Search messages in a conversation
 * @param {string} conversationId - ID of the conversation
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} Array of matching messages
 */
const searchMessages = async (conversationId, searchTerm) => {
  try {
    // Note: Full-text search requires a Firebase Cloud Function
    // This is a simplified version that searches in the client
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('text', '>=', searchTerm),
      where('text', '<=', searchTerm + '\uf8ff'),
      orderBy('text'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

// Export all functions
export {
  getConversationId,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  uploadFile,
  getOrCreateConversation,
  subscribeToUserConversations,
  deleteMessage,
  searchMessages
};

export default {
  getConversationId,
  subscribeToConversation,
  sendMessage,
  markMessagesAsRead,
  uploadFile,
  getOrCreateConversation,
  subscribeToUserConversations,
  deleteMessage,
  searchMessages
};
