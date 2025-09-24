// Consolidated API - Uses new service layer with enhanced features
// Provides backward compatibility while using improved architecture

import {
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
export const caregiversAPI = {
  getProfile: () => authAPI.getProfile(),
  updateProfile: (data) => authAPI.updateProfile(data),
  createProfile: (data) => authAPI.updateProfile(data)
};

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
  uploadDocument: authAPI.uploadProfileImage
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

// Remove apiService export to prevent circular dependencies
// export { apiService };
// export default apiService;

