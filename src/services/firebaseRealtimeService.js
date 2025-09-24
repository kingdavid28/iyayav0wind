// firebaseRealtimeService.js - Firebase for real-time features only
import { database, auth, ref, onValue, off, push, set, query, orderByChild, onAuthStateChanged, signInAnonymously } from '../config/firebase';

class FirebaseRealtimeService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.databaseListeners = new Map();
  }

  async initializeRealtimeAuth() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.currentUser = user;
          this.notifyAuthStateChange(true);
          resolve(user);
        } else {
          try {
            const result = await signInAnonymously(auth);
            this.currentUser = result.user;
            this.notifyAuthStateChange(true);
            resolve(result.user);
          } catch (error) {
            console.error('Firebase realtime auth error:', error);
            reject(error);
          }
        }
      });
    });
  }

  addAuthStateListener(listener) {
    this.authStateListeners.push(listener);
  }

  notifyAuthStateChange(isAuthenticated) {
    this.authStateListeners.forEach(listener => listener(isAuthenticated));
  }

  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  // Real-time database methods for messaging
  async sendMessage(chatId, messageData) {
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, {
        ...messageData,
        timestamp: Date.now(),
        senderId: this.getCurrentUserId()
      });
      return newMessageRef.key;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  listenToMessages(chatId, callback) {
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));

    const listener = onValue(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((childSnapshot) => {
        messages.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      callback(messages);
    });

    // Store listener for cleanup
    this.databaseListeners.set(`messages_${chatId}`, listener);
    return listener;
  }

  stopListening(chatId) {
    const listener = this.databaseListeners.get(`messages_${chatId}`);
    if (listener) {
      off(listener.ref, listener);
      this.databaseListeners.delete(`messages_${chatId}`);
    }
  }

  // Listen to user presence/status
  listenToUserStatus(userId, callback) {
    const userStatusRef = ref(database, `users/${userId}/status`);

    const listener = onValue(userStatusRef, (snapshot) => {
      callback(snapshot.val());
    });

    this.databaseListeners.set(`status_${userId}`, listener);
    return listener;
  }

  updateUserStatus(status) {
    if (!this.currentUser) return;

    const userStatusRef = ref(database, `users/${this.currentUser.uid}/status`);
    set(userStatusRef, {
      ...status,
      lastSeen: Date.now()
    });
  }

  // Clean up all listeners
  cleanup() {
    this.databaseListeners.forEach((listener, key) => {
      off(listener.ref, listener);
    });
    this.databaseListeners.clear();
  }
}

export const firebaseRealtimeService = new FirebaseRealtimeService();
