import { API_BASE_URL } from '../config/api';
import { getAuthToken } from '../utils/auth';
import { logger } from '../utils/logger';

/**
 * Messaging Service
 * Handles all messaging-related API calls
 */

class MessagingService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/messages`;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        ...options,
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error('MessagingService request failed:', { endpoint, error: error.message });
      throw error;
    }
  }

  // Get all conversations for current user
  async getConversations() {
    try {
      const response = await this.makeRequest('/conversations');
      return response.data || [];
    } catch (error) {
      logger.error('Get conversations failed:', error);
      throw new Error('Failed to load conversations');
    }
  }

  // Get messages for a specific conversation
  async getConversationMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await this.makeRequest(`/conversation/${conversationId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      logger.error('Get conversation messages failed:', error);
      throw new Error('Failed to load messages');
    }
  }

  // Send a new message
  async sendMessage(messageData) {
    try {
      const response = await this.makeRequest('/', {
        method: 'POST',
        body: messageData,
      });
      return response.data;
    } catch (error) {
      logger.error('Send message failed:', error);
      throw new Error('Failed to send message');
    }
  }

  // Start a new conversation
  async startConversation(recipientId, jobId = null, initialMessage = null) {
    try {
      const response = await this.makeRequest('/start', {
        method: 'POST',
        body: {
          recipientId,
          jobId,
          initialMessage,
        },
      });
      return response.data;
    } catch (error) {
      logger.error('Start conversation failed:', error);
      throw new Error('Failed to start conversation');
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId) {
    try {
      const response = await this.makeRequest(`/conversation/${conversationId}/read`, {
        method: 'POST',
      });
      return response.data;
    } catch (error) {
      logger.error('Mark messages as read failed:', error);
      throw new Error('Failed to mark messages as read');
    }
  }

  // Get conversation info
  async getConversationInfo(conversationId) {
    try {
      const response = await this.makeRequest(`/conversation/${conversationId}/info`);
      return response.data;
    } catch (error) {
      logger.error('Get conversation info failed:', error);
      throw new Error('Failed to load conversation info');
    }
  }

  // Delete a message
  async deleteMessage(messageId) {
    try {
      const response = await this.makeRequest(`/${messageId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      logger.error('Delete message failed:', error);
      throw new Error('Failed to delete message');
    }
  }

  // Upload attachment (convert to base64)
  async prepareAttachment(uri, mimeType, name) {
    try {
      // For React Native, we'll need to handle file reading
      // This is a placeholder - actual implementation depends on the file source
      return {
        base64: null, // Will be implemented based on file picker
        mimeType,
        name,
      };
    } catch (error) {
      logger.error('Prepare attachment failed:', error);
      throw new Error('Failed to prepare attachment');
    }
  }
}

export default new MessagingService();
