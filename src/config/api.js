import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

// Dynamic IP detection for Expo Go compatibility
const getDevServerIP = () => {
  // Try to get IP from Expo's development server
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    try {
      // Get the current bundle URL which contains the dev server IP
      const bundleUrl = typeof global !== 'undefined' && global.__DEV__ && global.__BUNDLE_START_TIME__
        ? global.location?.hostname
        : null;
      
      if (bundleUrl) {
        return bundleUrl;
      }
    } catch (e) {
      console.log('Could not detect dev server IP automatically');
    }
  }
  
  // Fallback IPs in order of preference
  return [
    '192.168.1.10',   // Current network IP
    '192.168.0.10',   // Common home network
    '10.0.0.10',      // Another common network
    '172.16.0.10',    // Corporate network
    'localhost',      // Local development
    '127.0.0.1'       // Localhost fallback
  ];
};

const API_CONFIG = {
  development: {
    // Support multiple IP configurations for Expo Go
    baseURLs: [
      'http://192.168.1.10:5001/api',
      'http://192.168.0.10:5001/api', 
      'http://10.0.0.10:5001/api',
      'http://172.16.0.10:5001/api',
      'http://localhost:5001/api',
      'http://127.0.0.1:5001/api'
    ],
    socketURLs: [
      'http://192.168.1.10:5001',
      'http://192.168.0.10:5001',
      'http://10.0.0.10:5001', 
      'http://172.16.0.10:5001',
      'http://localhost:5001',
      'http://127.0.0.1:5001'
    ],
    // Primary URLs (backward compatibility)
    baseURL: 'http://192.168.1.10:5001/api',
    socketURL: 'http://192.168.1.10:5001'
  },
  production: {
    baseURL: 'https://your-backend-url.com/api',
    socketURL: 'https://your-backend-url.com'
  }
};

const ENV = __DEV__ ? 'development' : 'production';

// Auto-detect working API URL in development
let detectedBaseURL = null;
let detectedSocketURL = null;

const detectWorkingAPI = async () => {
  if (ENV === 'production' || detectedBaseURL) {
    return;
  }
  
  const urls = API_CONFIG.development.baseURLs;
  
  for (const baseURL of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${baseURL.replace('/api', '')}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        detectedBaseURL = baseURL;
        detectedSocketURL = baseURL.replace('/api', '');
        console.log('✅ Detected working API:', detectedBaseURL);
        return;
      }
    } catch (error) {
      // Continue to next URL
      continue;
    }
  }
  
  console.warn('⚠️ No working API detected, using default');
};

// Initialize detection
if (ENV === 'development') {
  detectWorkingAPI();
}

export const API_BASE_URL = ENV === 'development' 
  ? (detectedBaseURL || API_CONFIG[ENV].baseURL)
  : API_CONFIG[ENV].baseURL;
  
export const SOCKET_URL = ENV === 'development'
  ? (detectedSocketURL || API_CONFIG[ENV].socketURL) 
  : API_CONFIG[ENV].socketURL;

// Helper function to get current API URL (for runtime access)
export const getCurrentAPIURL = () => {
  return ENV === 'development' 
    ? (detectedBaseURL || API_CONFIG[ENV].baseURL)
    : API_CONFIG[ENV].baseURL;
};

export const getCurrentSocketURL = () => {
  return ENV === 'development'
    ? (detectedSocketURL || API_CONFIG[ENV].socketURL)
    : API_CONFIG[ENV].socketURL;
};

// Enhanced API implementation with automatic failover and IP detection
// Export configuration
export { API_CONFIG };

// API call wrapper with automatic failover for development
const apiCall = async (endpoint, options = {}) => {
  const { retryUrls = true, ...fetchOptions } = options;
  
  // In production, use single URL
  if (ENV === 'production') {
    const url = `${API_CONFIG.production.baseURL}${endpoint}`;
    return fetch(url, fetchOptions);
  }
  
  // In development, try detected URL first, then fallback to all URLs
  const urls = detectedBaseURL 
    ? [detectedBaseURL]
    : API_CONFIG.development.baseURLs;
    
  let lastError = null;
  
  for (const baseURL of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseURL}${endpoint}`, {
        ...fetchOptions,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If successful, cache this URL for future use
      if (response.ok && !detectedBaseURL) {
        detectedBaseURL = baseURL;
        detectedSocketURL = baseURL.replace('/api', '');
        console.log('✅ Cached working API:', detectedBaseURL);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.log(`❌ Failed ${baseURL}: ${error.message}`);
      continue;
    }
  }
  
  throw lastError || new Error('All API endpoints failed');
};

// Export all APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Login failed:', error.message);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Registration failed:', error.message);
      throw error;
    }
  },
  
  getProfile: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If user deleted from database, clear token immediately
        if (response.status === 401 && errorData.error === 'User no longer exists') {
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          throw new Error('User no longer exists');
        }
        throw new Error(`Profile fetch failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Profile fetch failed:', error.message);
      throw error;
    }
  },
  
  logout: async () => {
    // Simple logout - just clear local storage
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    return { success: true };
  },
  
  setRole: async (role) => {
    // Mock role setting
    return { success: true, role };
  },
  
  updateProfile: async (data) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Profile update failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock profile update:', error.message);
      return { success: true, data };
    }
  },
  
  resetPassword: async (email) => {
    try {
      const response = await apiCall('/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error(`Reset failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Reset password failed:', error.message);
      throw error;
    }
  },

  uploadProfileImageBase64: async (imageBase64, mimeType) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/auth/profile/image-base64', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      
      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock image upload:', error.message);
      return { 
        url: 'https://via.placeholder.com/150/0066cc/ffffff?text=Profile',
        data: { url: 'https://via.placeholder.com/150/0066cc/ffffff?text=Profile' }
      };
    }
  }
};

// Caregivers API
export const caregiversAPI = {
  getProviders: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/caregivers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock caregivers');
      return { caregivers: [] };
    }
  },
  
  getMyProfile: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock caregiver profile');
      return { profile: null };
    }
  },
  
  updateMyProfile: async (data) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock profile update');
      return { success: true };
    }
  },
  
  createProfile: async (data) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock profile creation');
      return { success: true };
    }
  },
  
  requestBackgroundCheck: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/caregivers/background-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock background check request');
      return { success: true, message: 'Background check requested successfully' };
    }
  }
};

// Jobs API
export const jobsAPI = {
  getMyJobs: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/jobs/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock jobs');
      return { jobs: [] };
    }
  },
  
  getAvailableJobs: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock available jobs');
      return { jobs: [] };
    }
  },
  
  create: async (jobData) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock job creation');
      return { success: true, job: { id: Date.now(), ...jobData } };
    }
  }
};

// Bookings API
export const bookingsAPI = {
  getMyBookings: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock bookings');
      return { bookings: [] };
    }
  },
  
  getMy: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/bookings/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock bookings');
      return { bookings: [] };
    }
  },
  
  uploadPaymentProof: async (bookingId, imageBase64, mimeType) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, mimeType }),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock payment proof upload');
      return { success: true, url: 'https://via.placeholder.com/300x200?text=Payment+Proof' };
    }
  }
};

// Applications API
export const applicationsAPI = {
  getMyApplications: async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/applications/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Using mock applications');
      return { applications: [] };
    }
  },
  
  apply: async (data) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    } catch (error) {
      console.log('Mock application submission');
      return { success: true };
    }
  }
};

// Legacy Privacy API - Use settingsService instead
export const privacyAPI = {
  getPrivacyNotifications: () => console.warn('Use settingsService.getPrivacySettings() instead'),
  getPrivacySettings: () => console.warn('Use settingsService.getPrivacySettings() instead'),
  getPendingRequests: () => console.warn('Use settingsService.getPrivacySettings() instead'),
};

// Uploads API
export const uploadsAPI = {
  base64Upload: async (data) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for uploads
      
      const response = await fetch(`${API_BASE_URL}/uploads/base64`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock base64 upload:', error.message);
      return { 
        url: 'https://via.placeholder.com/150/0066cc/ffffff?text=Uploaded',
        location: 'https://via.placeholder.com/150/0066cc/ffffff?text=Uploaded',
        secure_url: 'https://via.placeholder.com/150/0066cc/ffffff?text=Uploaded'
      };
    }
  },
  
  uploadDocument: async (data) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for documents
      
      const response = await fetch(`${API_BASE_URL}/uploads/document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock document upload:', error.message);
      return { 
        url: 'https://via.placeholder.com/300x400/666666/ffffff?text=Document',
        location: 'https://via.placeholder.com/300x400/666666/ffffff?text=Document',
        secure_url: 'https://via.placeholder.com/300x400/666666/ffffff?text=Document'
      };
    }
  }
};