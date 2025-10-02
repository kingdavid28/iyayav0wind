// firebaseRealtimeService.js - Firebase for real-time features only
import { getFirebaseDatabase, getAuthSync, ref, onValue, off, push, set, query, orderByChild, onAuthStateChanged } from '../config/firebase';

class FirebaseRealtimeService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.databaseListeners = new Map();
    this.initializationPromise = null;
  }

  async initializeRealtimeAuth({ requireAuthenticatedUser = true } = {}) {
    if (this.currentUser) {
      return this.currentUser;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = new Promise((resolve, reject) => {
      try {
        const auth = getAuthSync();

        const cleanup = () => {
          this.initializationPromise = null;
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Realtime auth initialization timed out waiting for Firebase user.'));
        }, 15000);

        const unsubscribe = onAuthStateChanged(
          auth,
          (user) => {
            if (user) {
              clearTimeout(timeoutId);
              unsubscribe();
              this.currentUser = user;
              this.notifyAuthStateChange(true);
              cleanup();
              resolve(user);
            } else if (!requireAuthenticatedUser) {
              clearTimeout(timeoutId);
              unsubscribe();
              cleanup();
              resolve(null);
            }
          },
          (error) => {
            console.error('Firebase realtime auth state listener error:', error);
            clearTimeout(timeoutId);
            unsubscribe();
            cleanup();
            reject(error);
          }
        );
      } catch (error) {
        console.error('Firebase realtime auth sync error:', error);
        this.initializationPromise = null;
        reject(error);
      }
    });

    return this.initializationPromise;
  }

  addAuthStateListener(listener) {
    if (typeof listener !== 'function') {
      return () => {};
    }

    this.authStateListeners.push(listener);
    return () => {
      this.authStateListeners = this.authStateListeners.filter((registered) => registered !== listener);
    };
  }

  notifyAuthStateChange(isAuthenticated) {
    this.authStateListeners.forEach(listener => listener(isAuthenticated));
  }

  getCurrentUserId() {
    return this.currentUser ? this.currentUser.uid : null;
  }

  resetAuthSession() {
    this.currentUser = null;
    this.initializationPromise = null;
    this.cleanup();
    this.notifyAuthStateChange(false);
  }

  // Real-time database methods for messaging
  async sendMessage(chatId, messageData) {
    try {
      const database = await getFirebaseDatabase();
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

  async listenToMessages(chatId, callback) {
    const database = await getFirebaseDatabase();
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
  async listenToUserStatus(userId, callback) {
    const database = await getFirebaseDatabase();
    const userStatusRef = ref(database, `users/${userId}/status`);

    const listener = onValue(userStatusRef, (snapshot) => {
      callback(snapshot.val());
    });

    this.databaseListeners.set(`status_${userId}`, listener);
    return listener;
  }

  async updateUserStatus(status) {
    if (!this.currentUser) return;

    const database = await getFirebaseDatabase();
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
