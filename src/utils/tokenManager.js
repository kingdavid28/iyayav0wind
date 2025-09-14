import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { STORAGE_KEYS } from '../config/constants';
import { performanceMonitor } from './performanceMonitor';

class TokenManager {
  constructor() {
    this.tokenCache = null;
    this.tokenPromise = null;
    this.lastRefresh = 0;
    this.REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  }

  async getValidToken(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached token if recent and not forcing refresh
    if (!forceRefresh && this.tokenCache && (now - this.lastRefresh) < this.REFRESH_THRESHOLD) {
      console.log('💾 Valid token obtained and stored');
      return this.tokenCache;
    }

    // If already refreshing, wait for that promise
    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Start token refresh
    this.tokenPromise = this._refreshToken();
    
    try {
      const token = await this.tokenPromise;
      this.tokenCache = token;
      this.lastRefresh = now;
      console.log('💾 Valid token obtained and stored');
      return token;
    } finally {
      this.tokenPromise = null;
    }
  }

  async _refreshToken() {
    console.log('🔄 Getting Firebase token, force refresh: false');
    performanceMonitor.trackTokenRefresh();
    performanceMonitor.startTimer('token-refresh');
    
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const token = await currentUser.getIdToken(false); // Don't force refresh
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      performanceMonitor.endTimer('token-refresh');
      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      performanceMonitor.endTimer('token-refresh');
      this.clearCache();
      throw error;
    }
  }

  clearCache() {
    this.tokenCache = null;
    this.tokenPromise = null;
    this.lastRefresh = 0;
  }

  async logout() {
    this.clearCache();
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

export const tokenManager = new TokenManager();