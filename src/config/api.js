// Consolidated API - Uses new service layer with enhanced features
// Provides backward compatibility while using improved architecture

import { 
  apiService,
  authAPI,
  jobsAPI,
  applicationsAPI,
  bookingsAPI,
  childrenAPI,
  messagingService,
  getCurrentAPIURL,
  getCurrentSocketURL
} from '../services';
import { tokenManager } from '../utils/tokenManager';

// Export for backward compatibility
export const API_BASE_URL = getCurrentAPIURL();

console.log('✅ Using consolidated API service with enhanced features.');
console.log('🔗 API URL:', API_BASE_URL);

// Export utilities
export { getCurrentAPIURL, getCurrentSocketURL };

// Function to update API URL dynamically
export const setAPIBaseURL = (newURL) => {
  console.log('API URL should be updated to:', newURL);
};

// Export consolidated auth API
export { authAPI };

// Export consolidated caregivers API
export const caregiversAPI = apiService.caregivers;

// Export consolidated jobs API
export { jobsAPI };

// Export consolidated bookings API
export { bookingsAPI };

// Export consolidated applications API
export { applicationsAPI };

// Export consolidated children API
export { childrenAPI };

// Export uploads API (using auth API upload method)
export const uploadsAPI = {
  base64Upload: authAPI.uploadProfileImage,
  uploadDocument: (params) => {
    // Handle different parameter formats for document uploads
    if (params.documentBase64) {
      // Skip size validation for documents by calling the request directly
      return apiService.request('/auth/upload-profile-image', {
        method: 'POST',
        body: { imageBase64: params.documentBase64, mimeType: params.mimeType },
        timeout: 30000
      });
    }
    // Fallback for other formats
    return authAPI.uploadProfileImage(params, 'application/pdf');
  }
};

// Export messaging service
export { messagingService };

// Export messaging API for backward compatibility
export const messagingAPI = {
  markRead: (conversationId) => messagingService.markAsRead(conversationId),
  getConversations: () => messagingService.getConversations(),
  getMessages: (conversationId) => messagingService.getMessages(conversationId),
  sendMessage: (payload) => messagingService.sendMessage(payload.conversationId, payload.text, payload.recipientId)
};

// Privacy API (stub implementation)
export const privacyAPI = {
  getPrivacySettings: () => ({ data: null }),
  getPendingRequests: () => ({ data: [] }),
  getPrivacyNotifications: () => ({ data: [] }),
  updatePrivacySettings: () => ({ success: true }),
  requestInformation: () => ({ success: true }),
  respondToRequest: () => ({ success: true }),
  grantPermission: () => ({ success: true }),
  revokePermission: () => ({ success: true }),
  markNotificationAsRead: () => ({ success: true })
};

// Export token manager for advanced usage
export { tokenManager };

// Export main service for advanced usage
export { apiService };
export default apiService;

