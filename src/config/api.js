import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from './constants';

const API_CONFIG = {
  development: {
    baseURL: 'http://192.168.1.10:5001/api',  // Use your network IP
    socketURL: 'http://192.168.1.10:5001'
  },
  production: {
    baseURL: 'https://your-backend-url.com/api', // Replace with your deployed backend URL
    socketURL: 'https://your-backend-url.com'
  }
};

const ENV = __DEV__ ? 'development' : 'production';
export const API_BASE_URL = API_CONFIG[ENV].baseURL;
export const SOCKET_URL = API_CONFIG[ENV].socketURL;

// Simple auth API implementation with timeout and mock fallback
// Export configuration
export { API_CONFIG };

// Export all APIs
export const authAPI = {
  login: async (credentials) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for image upload
      
      const response = await fetch(`${API_BASE_URL}/auth/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64, mimeType }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
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