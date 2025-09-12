// ⚠️ DEPRECATED: Use new API client from '../core/api'
// This file is kept for backward compatibility only

// Legacy API implementations - kept for backward compatibility

// Environment detection
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

// Legacy API_BASE_URL for compatibility
let API_BASE_URL = isDev 
  ? 'http://192.168.1.10:5000/api'  // Use network IP for device access
  : 'https://api.iyaya.com/api';

// Export API_BASE_URL for backward compatibility
export { API_BASE_URL };

console.log('⚠️ Using legacy API config. Migrate to core/api for better features.');
console.log('🔗 API URL set to:', API_BASE_URL);

export const getCurrentAPIURL = () => API_BASE_URL;
export const getCurrentSocketURL = () => API_BASE_URL.replace('/api', '');

// Function to update API URL dynamically
export const setAPIBaseURL = (newURL) => {
  // This would require app restart to take effect
  console.log('API URL should be updated to:', newURL);
};

// Auth API
export const authAPI = {
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  async getProfile() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/firebase-profile`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.status}`);
    }
    
    return response.json();
  },

  async updateProfile(updateData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/firebase-profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      throw new Error(`Profile update failed: ${response.status}`);
    }
    
    return response.json();
  },

  async uploadProfileImageBase64(imageBase64, mimeType) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ imageBase64, mimeType })
    });
    
    if (!response.ok) {
      throw new Error(`Image upload failed: ${response.status}`);
    }
    
    return response.json();
  },

  async resetPassword(email) {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ email })
    });
    return response.json();
  },

  async setRole(role) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    const response = await fetch(`${API_BASE_URL}/auth/role`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ role })
    });
    return response.json();
  },
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Email verification failed');
      }

      return data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }
};

// Caregivers API
export const caregiversAPI = {
  async getCaregivers() {
    const response = await fetch(`${API_BASE_URL}/caregivers`);
    
    if (!response.ok) {
      throw new Error(`Caregivers fetch failed: ${response.status}`);
    }
    
    return response.json();
  },

  async getMyProfile() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Caregiver profile fetch failed: ${response.status}`);
    }
    
    return response.json();
  },

  async updateMyProfile(profileData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Caregiver profile update failed: ${response.status}`);
    }
    
    return response.json();
  },

  async createProfile(profileData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/caregivers/profile`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(profileData)
    });
    
    if (!response.ok) {
      throw new Error(`Caregiver profile creation failed: ${response.status}`);
    }
    
    return response.json();
  },

  async getMyChildren() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/profile/children`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Children fetch failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// Jobs API
export const jobsAPI = {
  async getMyJobs() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/jobs/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async getAvailableJobs() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async create(jobData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(jobData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  }
};

// Bookings API
export const bookingsAPI = {
  async create(bookingData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(bookingData)
    });
    return response.json();
  },

  async getMy() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/bookings/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async uploadPaymentProof(bookingId, imageBase64, mimeType) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/payment-proof`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ imageBase64, mimeType })
    });
    return response.json();
  }
};

// Applications API
export const applicationsAPI = {
  async getMyApplications() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/applications/my`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  async apply(jobId, applicationData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ jobId, ...applicationData })
    });
    return response.json();
  }
};

// Children API
export const childrenAPI = {
  async getMyChildren() {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/children`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error(`Children fetch failed: ${response.status}`);
    }
    
    return response.json();
  },

  async create(childData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/children`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(childData)
    });
    
    if (!response.ok) {
      throw new Error(`Child creation failed: ${response.status}`);
    }
    
    return response.json();
  },

  async update(childId, childData) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) throw new Error('No auth token found');
    
    const response = await fetch(`${API_BASE_URL}/children/${childId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(childData)
    });
    
    if (!response.ok) {
      throw new Error(`Child update failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// Uploads API
export const uploadsAPI = {
  async base64Upload({ imageBase64, mimeType, folder = 'uploads', name }) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ imageBase64, mimeType, folder, name })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    return response.json();
  },

  async uploadDocument({ documentBase64, mimeType, documentType, name }) {
    const token = await import('@react-native-async-storage/async-storage').then(m => m.default.getItem('@auth_token'));
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/upload-profile-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        imageBase64: documentBase64, 
        mimeType, 
        folder: 'documents',
        name: name || `${documentType}_${Date.now()}`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Document upload failed: ${response.status}`);
    }
    
    return response.json();
  }
};

// Privacy API (stub implementation to prevent errors)
export const privacyAPI = {
  async getPrivacySettings() {
    return { data: null };
  },
  
  async getPendingRequests() {
    return { data: [] };
  },
  
  async getPrivacyNotifications() {
    return { data: [] };
  },
  
  async updatePrivacySettings(settings) {
    return { success: true };
  },
  
  async requestInformation(requestData) {
    return { success: true };
  },
  
  async respondToRequest(responseData) {
    return { success: true };
  },
  
  async grantPermission(targetUserId, viewerUserId, fields, expiresIn) {
    return { success: true };
  },
  
  async revokePermission(targetUserId, viewerUserId, fields) {
    return { success: true };
  },
  
  async markNotificationAsRead(notificationId) {
    return { success: true };
  }
};

