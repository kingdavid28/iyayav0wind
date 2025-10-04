// Backend Firebase Realtime Service
// Independent Firebase service for backend messaging operations
const admin = require('firebase-admin');

class BackendFirebaseRealtimeService {
  constructor() {
    this.isInitialized = false;
    this.db = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Initialize Firebase Admin SDK for backend
      if (!admin.apps.length) {
        const serviceAccount = require('../serviceAccountKey.json');

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://iyayav0-default-rtdb.firebaseio.com'
        });
      }

      this.db = admin.database();
      this.isInitialized = true;

      console.log('🔥 Backend Firebase initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize backend Firebase:', error);
      return false;
    }
  }

  async sendMessageToFirebase(conversationId, messageData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const messagesRef = this.db.ref(`messages/${conversationId}`);
      const newMessageRef = messagesRef.push();

      const firebaseMessageData = {
        text: messageData.content,
        senderId: messageData.sender,
        timestamp: Date.now(),
        status: 'sent',
        type: messageData.messageType || 'text',
        conversationId: conversationId,
        sentAt: Date.now(),
        sentBy: messageData.sender,
      };

      await newMessageRef.set(firebaseMessageData);

      console.log('✅ Message sent to Firebase:', {
        conversationId,
        messageId: newMessageRef.key,
        senderId: messageData.sender,
        recipientId: messageData.recipient
      });

      return newMessageRef.key;
    } catch (error) {
      console.error('❌ Failed to send message to Firebase:', error);
      throw error;
    }
  }

  async updateMessageStatusInFirebase(conversationId, messageId, status, userId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const messageRef = this.db.ref(`messages/${conversationId}/${messageId}`);
      const statusData = {
        status: status,
        [`${status}At`]: Date.now(),
        [`${status}By`]: userId,
      };

      await messageRef.update(statusData);

      console.log('✅ Message status updated in Firebase:', {
        conversationId,
        messageId,
        status,
        userId
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update message status in Firebase:', error);
      throw error;
    }
  }

  async getMessagesFromFirebase(conversationId) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const messagesRef = this.db.ref(`messages/${conversationId}`);
      const snapshot = await messagesRef.once('value');

      if (snapshot.exists()) {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });

        console.log(`✅ Retrieved ${messages.length} messages from Firebase for conversation:`, conversationId);
        return messages;
      }

      console.log('ℹ️ No messages found in Firebase for conversation:', conversationId);
      return [];
    } catch (error) {
      console.error('❌ Failed to get messages from Firebase:', error);
      throw error;
    }
  }
}

const backendFirebaseRealtimeService = new BackendFirebaseRealtimeService();

module.exports = {
  backendFirebaseRealtimeService,
  initializeFirebase: () => backendFirebaseRealtimeService.initialize(),
  sendMessageToFirebase: (conversationId, messageData) => backendFirebaseRealtimeService.sendMessageToFirebase(conversationId, messageData),
  updateMessageStatusInFirebase: (conversationId, messageId, status, userId) => backendFirebaseRealtimeService.updateMessageStatusInFirebase(conversationId, messageId, status, userId),
  getMessagesFromFirebase: (conversationId) => backendFirebaseRealtimeService.getMessagesFromFirebase(conversationId),
};
