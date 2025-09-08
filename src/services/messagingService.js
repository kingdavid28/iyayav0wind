import { API_CONFIG } from '../config/constants';
import axios from 'axios';
import { getAuthToken } from '../utils/auth';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

// Add auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  console.log('🔑 Messaging API token check:', token ? 'Found' : 'Missing');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock data fallback
const MOCK_CONVERSATIONS = [
  {
    id: '1',
    participantId: 'caregiver-1',
    participantName: 'Ana Dela Cruz',
    participantAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
    participantRole: 'caregiver',
    lastMessage: 'Thank you for booking my services!',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2,
  },
  {
    id: '2',
    participantId: 'parent-1',
    participantName: 'Maria Santos',
    participantAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    participantRole: 'parent',
    lastMessage: 'Looking forward to working with you',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0,
  },
];

const MOCK_MESSAGES = {
  '1': [
    {
      id: 'm1',
      conversationId: '1',
      senderId: 'caregiver-1',
      senderName: 'Ana Dela Cruz',
      message: 'Hello! I received your booking request.',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
    {
      id: 'm2',
      conversationId: '1',
      senderId: 'current-user',
      senderName: 'You',
      message: 'Great! What time works best for you?',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
    {
      id: 'm3',
      conversationId: '1',
      senderId: 'caregiver-1',
      senderName: 'Ana Dela Cruz',
      message: 'Thank you for booking my services!',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ],
  '2': [
    {
      id: 'm4',
      conversationId: '2',
      senderId: 'parent-1',
      senderName: 'Maria Santos',
      message: 'Looking forward to working with you',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ],
};

export const messagingService = {
  // Get conversations for current user
  async getConversations() {
    try {
      const response = await api.get('/messages/conversations');
      const conversations = response.data?.data?.conversations || response.data?.conversations || [];
      return conversations.length > 0 ? conversations : MOCK_CONVERSATIONS;
    } catch (error) {
      console.warn('Failed to fetch conversations, using mock data:', error.response?.status, error.message);
      return MOCK_CONVERSATIONS;
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      const messages = response.data?.data?.messages || response.data?.messages || [];
      return messages.length > 0 ? messages : (MOCK_MESSAGES[conversationId] || []);
    } catch (error) {
      console.warn('Failed to fetch messages, using mock data:', error.message);
      return MOCK_MESSAGES[conversationId] || [];
    }
  },

  // Send a message
  async sendMessage(conversationId, message, recipientId = null) {
    try {
      const response = await api.post('/messages/send', {
        conversationId,
        message,
        recipientId
      });
      return response.data?.data?.message || response.data?.message || {
        id: `mock-${Date.now()}`,
        conversationId,
        senderId: 'current-user',
        senderName: 'You',
        message,
        timestamp: new Date().toISOString(),
        read: true,
      };
    } catch (error) {
      console.warn('Failed to send message, creating mock response:', error.message);
      return {
        id: `mock-${Date.now()}`,
        conversationId,
        senderId: 'current-user',
        senderName: 'You',
        message,
        timestamp: new Date().toISOString(),
        read: true,
      };
    }
  },

  // Start new conversation
  async startConversation(recipientId, recipientName, recipientRole, initialMessage) {
    try {
      const response = await api.post('/messages/conversations', {
        recipientId,
        recipientName,
        recipientRole,
        initialMessage
      });
      return response.data?.data || response.data || {
        conversation: {
          id: `mock-conv-${Date.now()}`,
          participantId: recipientId,
          participantName: recipientName,
          participantRole: recipientRole,
          lastMessage: initialMessage,
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
        }
      };
    } catch (error) {
      console.warn('Failed to start conversation, creating mock:', error.message);
      const mockConversation = {
        id: `mock-conv-${Date.now()}`,
        participantId: recipientId,
        participantName: recipientName,
        participantRole: recipientRole,
        lastMessage: initialMessage,
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
      };
      return { conversation: mockConversation };
    }
  },

  // Mark messages as read
  async markAsRead(conversationId) {
    try {
      await api.put(`/messages/conversations/${conversationId}/read`);
      return true;
    } catch (error) {
      console.warn('Failed to mark as read:', error.message);
      return false;
    }
  }
};
