import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/constants';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { logger } from './logger';

/**
 * Token Manager - Handles Firebase token refresh and validation
 */
class TokenManager {
  constructor() {
    this.refreshPromise = null;
  }

  /**
   * Get a valid token, refreshing if necessary
   */
  async getValidToken(forceRefresh = false) {
    try {
      // If already refreshing, wait for that to complete
      if (this.refreshPromise) {
        return await this.refreshPromise;
      }

      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        logger.warn('No current user found');
        return null;
      }

      // Get stored token first
      let token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      // If no token or force refresh, get fresh token
      if (!token || forceRefresh || this.isTokenExpired(token)) {
        logger.info('Getting fresh Firebase token...');
        
        this.refreshPromise = this.refreshToken(currentUser);
        token = await this.refreshPromise;
        this.refreshPromise = null;
      }

      return token;
    } catch (error) {
      logger.error('Failed to get valid token:', error);
      this.refreshPromise = null;
      return null;
    }
  }

  /**
   * Refresh Firebase token
   */
  async refreshToken(currentUser) {
    try {
      const freshToken = await currentUser.getIdToken(true);
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, freshToken);
      logger.info('✅ Token refreshed successfully');
      return freshToken;
    } catch (error) {
      logger.error('Failed to refresh token:', error);
      throw error;
    }
  }

  /**
   * Check if token is expired (basic check)
   */
  isTokenExpired(token) {
    try {
      if (!token) return true;
      
      // Decode JWT payload (Firebase tokens are JWT)
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      
      // Check if token expires within next 5 minutes
      return payload.exp && (payload.exp - now) < 300;
    } catch (error) {
      logger.error('Error checking token expiration:', error);
      return true; // Assume expired if can't parse
    }
  }

  /**
   * Clear stored token
   */
  async clearToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      logger.info('Token cleared');
    } catch (error) {
      logger.error('Failed to clear token:', error);
    }
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;