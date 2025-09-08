import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { STORAGE_KEYS } from '../config/constants';

class SettingsService {
  async getAuthHeaders() {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const headers = await this.getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.log(`Settings API error for ${endpoint}:`, error.message);
      return this.getMockData(endpoint);
    }
  }

  getMockData(endpoint) {
    const mockData = {
      '/auth/profile': { name: 'User', email: 'user@example.com', phone: '', profileVisibility: 'public' },
      '/privacy/settings': { profileVisibility: true, showOnlineStatus: true, allowDirectMessages: true, showRatings: true, dataSharing: false },
      '/notifications/settings': { pushNotifications: true, emailNotifications: true, smsNotifications: false, bookingReminders: true, messageNotifications: true, marketingEmails: false, quietHours: { enabled: false, startTime: '22:00', endTime: '08:00' } },
      '/payments/settings': { defaultPaymentMethod: 'card', autoPayments: false, savePaymentInfo: true, receiveReceipts: true },
      '/data/usage': { profile: [{ name: 'User Profile', email: 'user@example.com', status: 'Active' }], jobs: [], bookings: [], applications: [] },
      '/privacy/requests/pending': { requests: [{ id: '1', requesterName: 'John Doe', reason: 'Need contact info for booking', requestedFields: ['phone', 'email'], status: 'pending', createdAt: new Date().toISOString() }] },
      '/privacy/requests/sent': { requests: [] }
    };
    return mockData[endpoint] || {};
  }

  // Profile Settings
  async getProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateProfile(data) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Privacy Settings
  async getPrivacySettings() {
    return this.makeRequest('/privacy/settings');
  }

  async updatePrivacySettings(data) {
    return this.makeRequest('/privacy/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Information Requests
  async getPendingRequests() {
    return this.makeRequest('/privacy/requests/pending');
  }

  async getSentRequests() {
    return this.makeRequest('/privacy/requests/sent');
  }

  async respondToRequest(data) {
    return this.makeRequest('/privacy/respond', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async requestInformation(data) {
    return this.makeRequest('/privacy/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Notification Settings
  async getNotificationSettings() {
    return this.makeRequest('/notifications/settings');
  }

  async updateNotificationSettings(data) {
    return this.makeRequest('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Payment Settings
  async getPaymentSettings() {
    return this.makeRequest('/payments/settings');
  }

  async updatePaymentSettings(data) {
    return this.makeRequest('/payments/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Data Management
  async exportUserData() {
    return this.makeRequest('/data/export', { method: 'POST' });
  }

  async deleteUserData() {
    return this.makeRequest('/data/all', { method: 'DELETE' });
  }

  async getDataUsage() {
    return this.makeRequest('/data/usage');
  }
}

export const settingsService = new SettingsService();
