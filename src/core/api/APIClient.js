import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

// Environment-based configuration
const Config = {
  API_BASE_URL: __DEV__ 
    ? 'http://192.168.1.9:5000/api'  // Match the network IP and backend port
    : 'https://api.iyaya.com/api',
  TIMEOUT: 15000,  // Increased timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: Config.API_BASE_URL,
      timeout: Config.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            const newToken = await SecureStore.getItemAsync('auth_token');
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  async refreshToken() {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await axios.post(`${Config.API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const { token, refreshToken: newRefreshToken } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('refresh_token', newRefreshToken);
      
      return token;
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  async logout() {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('refresh_token');
    // Navigate to login screen
  }

  handleError(error) {
    if (!error.response) {
      // Handle specific network errors
      if (error.name === 'AbortError' || error.code === 'ECONNABORTED') {
        return {
          message: 'Request timeout. Please try again.',
          type: 'TIMEOUT_ERROR',
          originalError: error,
          retryable: true
        };
      }
      // General network error
      return {
        message: 'Network error. Please check your connection.',
        type: 'NETWORK_ERROR',
        originalError: error,
        retryable: true
      };
    }

    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { message: data.message || 'Invalid request', type: 'VALIDATION_ERROR' };
      case 401:
        return { message: 'Authentication required', type: 'AUTH_ERROR' };
      case 403:
        return { message: 'Access denied', type: 'PERMISSION_ERROR' };
      case 404:
        return { message: 'Resource not found', type: 'NOT_FOUND_ERROR' };
      case 500:
        return { message: 'Server error. Please try again later.', type: 'SERVER_ERROR' };
      default:
        return { message: data.message || 'An error occurred', type: 'UNKNOWN_ERROR' };
    }
  }

  // Retry wrapper for network requests
  async withRetry(requestFn, attempts = Config.RETRY_ATTEMPTS) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        const shouldRetry = error.type === 'NETWORK_ERROR' || error.type === 'TIMEOUT_ERROR' || error.retryable;
        if (i === attempts - 1 || !shouldRetry) {
          throw error;
        }
        console.log(`Network error, retrying... (${attempts - i - 1} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, Config.RETRY_DELAY * (i + 1)));
      }
    }
  }

  // HTTP Methods
  async get(url, config = {}) {
    return this.withRetry(() => this.client.get(url, config));
  }

  async post(url, data, config = {}) {
    return this.withRetry(() => this.client.post(url, data, config));
  }

  async put(url, data, config = {}) {
    return this.withRetry(() => this.client.put(url, data, config));
  }

  async delete(url, config = {}) {
    return this.withRetry(() => this.client.delete(url, config));
  }
}

export default new APIClient();