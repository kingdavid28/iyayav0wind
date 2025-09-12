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



export const messagingService = {
  // Get conversations for current user
  async getConversations() {
    const response = await api.get('/messages/conversations');
    return response.data?.data?.conversations || response.data?.conversations || [];
  },

  // Get messages for a conversation
  async getMessages(conversationId) {
    const response = await api.get(`/messages/conversations/${conversationId}/messages`);
    return response.data?.data?.messages || response.data?.messages || [];
  },

  // Send a message
  async sendMessage(conversationId, message, recipientId = null) {
    const response = await api.post('/messages/send', {
      conversationId,
      message,
      recipientId
    });
    return response.data?.data?.message || response.data?.message;
  },

  // Start new conversation
  async startConversation(recipientId, recipientName, recipientRole, initialMessage) {
    const response = await api.post('/messages/conversations', {
      recipientId,
      recipientName,
      recipientRole,
      initialMessage
    });
    return response.data?.data || response.data;
  },

  // Mark messages as read
  async markAsRead(conversationId) {
    await api.put(`/messages/conversations/${conversationId}/read`);
    return true;
  }
};
