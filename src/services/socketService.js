import { getCurrentSocketURL } from '../config/api';

let io = null;

// Try to import socket.io-client, but handle gracefully if not available
try {
  const socketIO = require('socket.io-client');
  io = socketIO.io || socketIO.default;
} catch (error) {
  console.warn('socket.io-client not available, realtime features disabled');
}

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (!io) {
      console.warn('Socket.IO not available, skipping connection');
      return null;
    }
    
    if (this.socket?.connected) return this.socket;

    const url = getCurrentSocketURL();
    this.socket = io(url, {
      auth: { token },
      transports: ['websocket'],
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('🔌 Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Messaging events
  joinConversation(conversationId) {
    this.emit('join:conversation', { conversationId });
  }

  leaveConversation(conversationId) {
    this.emit('leave:conversation', { conversationId });
  }

  sendMessage(messageData) {
    this.emit('message:send', messageData);
  }

  onNewMessage(callback) {
    this.on('message:new', callback);
  }

  onTypingStart(callback) {
    this.on('typing:start', callback);
  }

  onTypingStop(callback) {
    this.on('typing:stop', callback);
  }

  startTyping(conversationId) {
    this.emit('typing:start', { conversationId });
  }

  stopTyping(conversationId) {
    this.emit('typing:stop', { conversationId });
  }

  // Notification events
  onNotification(callback) {
    this.on('notification', callback);
  }

  onBookingUpdate(callback) {
    this.on('booking:update', callback);
  }

  onJobUpdate(callback) {
    this.on('job:update', callback);
  }
}

export default new SocketService();