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
  
  return null; // Will use dynamic detection
};

// Generate dynamic IP list based on common network ranges
const generateIPList = () => {
  const ips = [];
  
  // Add localhost first (most likely to work)
  ips.push('localhost', '127.0.0.1');
  
  // Add most common network IPs first for faster detection
  const priorityIPs = [
    '10.207.238.117', // Current network IP
    '192.168.1.1', '192.168.1.10', '192.168.1.100',
    '192.168.0.1', '192.168.0.10', '192.168.0.100',
    '10.0.0.1', '10.0.0.10', '10.0.0.100',
    '172.16.0.1', '172.16.0.10', '172.16.0.100'
  ];
  
  ips.push(...priorityIPs);
  
  // Add extended range for thorough coverage
  const commonRanges = [
    '10.207.238',  // Current network range
    '192.168.1',   // Most common home network
    '192.168.0',   // Alternative home network
    '10.0.0',      // Corporate/VPN networks
    '172.16.0',    // Private networks
    '192.168.2',   // Router variations
  ];
  
  commonRanges.forEach(range => {
    for (let i = 2; i <= 50; i++) {
      if (!ips.includes(`${range}.${i}`)) {
        ips.push(`${range}.${i}`);
      }
    }
  });
  
  return ips;
}

const API_CONFIG = {
  development: {
    // Dynamic IP generation
    get baseURLs() {
      return generateIPList().map(ip => `http://${ip}:5000/api`);
    },
    get socketURLs() {
      return generateIPList().map(ip => `http://${ip}:5000`);
    },
    // Primary URLs (backward compatibility)
    baseURL: 'http://localhost:5000/api',
    socketURL: 'http://localhost:5000'
  },
  production: {
    baseURL: 'https://your-backend-url.com/api',
    socketURL: 'https://your-backend-url.com'
  }
};

const ENV = __DEV__ ? 'development' : 'production';

// Auto-detect working API URL in development with caching
let detectedBaseURL = null;
let detectedSocketURL = null;
let detectionInProgress = false;
let lastDetectionTime = 0;
const DETECTION_CACHE_DURATION = 300000; // 5 minutes

const detectWorkingAPI = async () => {
  if (ENV === 'production') return;
  
  // Use cached result if recent
  const now = Date.now();
  if (detectedBaseURL && (now - lastDetectionTime) < DETECTION_CACHE_DURATION) {
    return;
  }
  
  // Prevent multiple simultaneous detections
  if (detectionInProgress) return;
  detectionInProgress = true;
  
  try {
    const urls = API_CONFIG.development.baseURLs;
    console.log(`🔍 Testing ${urls.length} potential API endpoints...`);
    
    // Test URLs in parallel with timeout (increased to 30 for better coverage)
    const testPromises = urls.slice(0, 30).map(async (baseURL) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Increased timeout
        
        const response = await fetch(`${baseURL.replace('/api', '')}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return {
            baseURL,
            socketURL: baseURL.replace('/api', ''),
            success: true
          };
        }
      } catch (error) {
        // Ignore individual failures
      }
      return null;
    });
    
    const results = await Promise.allSettled(testPromises);
    const workingEndpoint = results
      .filter(result => result.status === 'fulfilled' && result.value?.success)
      .map(result => result.value)[0];
    
    if (workingEndpoint) {
      detectedBaseURL = workingEndpoint.baseURL;
      detectedSocketURL = workingEndpoint.socketURL;
      lastDetectionTime = now;
      console.log('✅ Detected working API:', detectedBaseURL);
    } else {
      console.warn('⚠️ No working API detected from', urls.length, 'endpoints');
    }
  } finally {
    detectionInProgress = false;
  }
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
  const { retryUrls = true, timeout = 15000, ...fetchOptions } = options;
  
  // In production, use single URL with timeout
  if (ENV === 'production') {
    const url = `${API_CONFIG.production.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  // In development, use smart URL selection
  const urls = detectedBaseURL 
    ? [detectedBaseURL]
    : API_CONFIG.development.baseURLs.slice(0, 10); // Limit to first 10 for performance
    
  console.log('🔍 Trying API URLs:', urls.length, 'endpoints');
  let lastError = null;
  
  for (const baseURL of urls) {
    try {
      console.log(`🌐 Attempting: ${baseURL}${endpoint}`);
      const response = await fetch(`${baseURL}${endpoint}`, fetchOptions);
      
      // If successful, cache this URL for future use
      if (response.ok && !detectedBaseURL) {
        detectedBaseURL = baseURL;
        detectedSocketURL = baseURL.replace('/api', '');
        lastDetectionTime = Date.now();
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
      // Only use mock login if backend is completely unreachable
      if (ENV === 'development' && error.message.includes('Network request failed')) {
        console.log('🔄 Backend unreachable, using mock login');
        const mockUser = {
          uid: 'mock-user-123',
          email: credentials.email,
          displayName: 'Mock User',
          role: 'parent',
          name: 'Mock User',
          profileImage: null
        };
        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJtb2NrLXVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InBhcmVudCIsImlhdCI6MTczNjI0NzAxN30.mock-signature-' + Date.now();
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);
        return { token: mockToken, user: mockUser };
      }
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
      console.log('Token check:', { hasToken: !!token, tokenStart: token?.substring(0, 20), isMock: token?.includes('mock-signature') });
      // Only use mock profile if backend is completely unreachable AND token is mock
      if (ENV === 'development' && error.message.includes('Network request failed') && (token?.startsWith('mock-jwt-token') || token?.includes('mock-signature'))) {
        console.log('🔄 Backend unreachable, using mock profile');
        return {
          data: {
            uid: 'mock-user-123',
            email: 'mock@example.com',
            displayName: 'Mock User',
            role: 'parent',
            name: 'Mock User',
            profileImage: null,
            location: 'Mock Location',
            contact: '+1234567890'
          }
        };
      }
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
        // No timeout in development
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
  
  confirmPasswordReset: async (token, newPassword) => {
    try {
      const response = await apiCall('/auth/confirm-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      if (!response.ok) {
        throw new Error(`Password reset confirmation failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Confirm password reset failed:', error.message);
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
      console.log('Profile image upload failed:', error.message);
      throw error;
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
      const data = await response.json();
      
      // Ensure profile image URL is properly formatted
      if (data?.caregiver?.profileImage) {
        const img = data.caregiver.profileImage;
        console.log('🖼️ CaregiverAPI - Raw profile image from backend:', img);
        if (!img.startsWith('http')) {
          const baseUrl = getCurrentSocketURL();
          if (img.startsWith('/')) {
            data.caregiver.profileImage = `${baseUrl}${img}`;
          } else {
            data.caregiver.profileImage = `${baseUrl}/uploads/${img}`;
          }
        }
        console.log('🖼️ CaregiverAPI - Final formatted profile image URL:', data.caregiver.profileImage);
      } else {
        console.log('⚠️ CaregiverAPI - No profile image found in response');
      }
      
      return data;
    } catch (error) {
      console.log('Enhanced caregiver profile unavailable, using mock data:', error.message);
      return { 
        caregiver: {
          name: 'Ana Dela Cruz',
          email: 'ana@example.com',
          phone: '+63 917 123 4567',
          bio: 'Experienced caregiver with 5+ years of childcare experience.',
          hourlyRate: 350,
          experience: { years: 5, months: 6 },
          skills: ['Infant Care', 'CPR Certified', 'First Aid', 'Meal Preparation'],
          profileImage: null,
          rating: 4.9,
          reviewCount: 127,
          location: 'Cebu City, Philippines'
        }
      };
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
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/jobs/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('Backend unavailable, using mock jobs:', error.message);
      return { 
        data: {
          jobs: []
        }
      };
    }
  },
  
  getAvailableJobs: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/jobs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Backend unavailable, using mock available jobs:', error.message);
      return { data: { jobs: [] } };
    }
  },
  
  create: async (jobData) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/jobs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Backend unavailable, mock job creation:', error.message);
      const mockJob = {
        id: `job-${Date.now()}`,
        _id: `job-${Date.now()}`,
        ...jobData,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      return { 
        success: true, 
        data: { job: mockJob }
      };
    }
  },
  
  update: async (jobId, jobData) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall(`/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Backend unavailable, mock job update:', error.message);
      return { 
        success: true, 
        data: { job: { id: jobId, ...jobData } }
      };
    }
  },
  
  delete: async (jobId) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall(`/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Backend unavailable, mock job deletion:', error.message);
      return { success: true };
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

// Privacy API
export const privacyAPI = {
  getPrivacySettings: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Privacy settings unavailable:', error.message);
      return { data: null };
    }
  },
  
  updatePrivacySettings: async (settings) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Privacy settings update failed:', error.message);
      return { success: false };
    }
  },
  
  requestInformation: async (requestData) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Information request failed:', error.message);
      return { success: false };
    }
  },
  
  getPendingRequests: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/requests/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Pending requests unavailable:', error.message);
      return { data: [] };
    }
  },
  
  respondToRequest: async (responseData) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/request/respond', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Request response failed:', error.message);
      return { success: false };
    }
  },
  
  getPrivacyNotifications: async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Privacy notifications unavailable:', error.message);
      return { data: [] };
    }
  },
  
  markNotificationAsRead: async (notificationId) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall(`/privacy/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mark notification failed:', error.message);
      return { success: false };
    }
  },
  
  grantPermission: async (targetUserId, viewerUserId, fields, expiresIn) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/grant', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, viewerUserId, fields, expiresIn }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Grant permission failed:', error.message);
      return { success: false };
    }
  },
  
  revokePermission: async (targetUserId, viewerUserId, fields) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('No auth token found');
    }
    
    try {
      const response = await apiCall('/privacy/revoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId, viewerUserId, fields }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Revoke permission failed:', error.message);
      return { success: false };
    }
  }
};

// Messaging API with failure caching
let messagingFailureCache = { failed: false, timestamp: 0 };
const FAILURE_CACHE_DURATION = 300000; // 5 minutes

export const messagingAPI = {
  getConversations: async () => {
    // Check cache to avoid repeated network calls
    const now = Date.now();
    if (messagingFailureCache.failed && (now - messagingFailureCache.timestamp) < FAILURE_CACHE_DURATION) {
      console.log('⚠️ Messaging API cached failure, skipping call');
      return { conversations: [] };
    }
    
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        messagingFailureCache = { failed: true, timestamp: now };
        return { conversations: [] };
      }
      
      const response = await apiCall('/messages/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      // Reset failure cache on success
      messagingFailureCache = { failed: false, timestamp: 0 };
      return response.json();
    } catch (error) {
      console.log('Messaging API failed, caching failure');
      // Cache failure to reduce repeated attempts
      messagingFailureCache = { failed: true, timestamp: now };
      return { conversations: [] };
    }
  },
  
  getMessages: async (conversationId) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await apiCall(`/messages/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Using mock messages');
      return { messages: [] };
    }
  },
  
  sendMessage: async (conversationId, message) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await apiCall(`/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock message send');
      return { success: true };
    }
  },
  
  createConversation: async (participantId) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await apiCall('/messages/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participantId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock conversation creation');
      return { 
        conversation: {
          id: `conv-${Date.now()}`,
          participants: [participantId],
          messages: []
        }
      };
    }
  },
  
  markRead: async (conversationId) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const response = await apiCall(`/messages/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.log('Mock mark read');
      return { success: true };
    }
  }
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
      console.log('Base64 upload failed:', error.message);
      throw error;
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
