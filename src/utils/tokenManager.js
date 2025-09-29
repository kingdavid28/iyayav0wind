// utils/tokenManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuthService } from '../services/firebaseAuthService';
import { STORAGE_KEYS, TOKEN_CONFIG } from '../config/constants';
import { logger } from './logger';
import { performanceMonitor } from './performanceMonitor';

class TokenManager {
  constructor() {
    this.tokenCache = null;
    this.tokenPromise = null;
    this.lastRefresh = 0;
    this.refreshThreshold = TOKEN_CONFIG.REFRESH_THRESHOLD || 5 * 60 * 1000; // 5 minutes
    this.maxRetries = TOKEN_CONFIG.MAX_RETRIES || 3;
    this.retryCount = 0;
  }

  /**
   * Get a valid authentication token
   * @param {boolean} forceRefresh - Whether to force token refresh
   * @returns {Promise<string|null>} The token or null if not available
   */
  async getValidToken(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached token if recent and not forcing refresh
    if (!forceRefresh && 
        this.tokenCache && 
        (now - this.lastRefresh) < this.refreshThreshold) {
      logger.debug('💾 Using cached token');
      return this.tokenCache;
    }

    // If already refreshing, wait for that promise to avoid duplicate requests
    if (this.tokenPromise) {
      logger.debug('⏳ Token refresh already in progress, waiting...');
      return this.tokenPromise;
    }

    try {
      // Start token refresh process
      this.tokenPromise = this._refreshToken(forceRefresh);
      const token = await this.tokenPromise;
      
      // Cache the successful result
      this.tokenCache = token;
      this.lastRefresh = now;
      this.retryCount = 0; // Reset retry count on success
      
      logger.debug('✅ Token obtained successfully');
      return token;
    } catch (error) {
      this.retryCount++;
      logger.error('❌ Token refresh failed:', error);
      
      // Clear cache on auth failures
      if (this._isAuthError(error)) {
        this.clearCache();
        await this._clearStoredToken();
      }
      
      throw error;
    } finally {
      this.tokenPromise = null;
    }
  }

  /**
   * Internal method to refresh the token
   */
  async _refreshToken(forceRefresh = false) {
    logger.debug(`🔄 Refreshing token, force: ${forceRefresh}`);
    
    performanceMonitor.trackTokenRefresh();
    const timerId = performanceMonitor.startTimer('token-refresh');

    try {
      // Check if user is authenticated
      const currentUser = firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        logger.debug('👤 No authenticated user found');
        performanceMonitor.endTimer(timerId, { success: false, reason: 'no_user' });
        return null;
      }

      // Get ID token from Firebase
      const token = await currentUser.getIdToken(forceRefresh);
      
      if (!token) {
        throw new Error('Empty token received from Firebase');
      }

      // Store token securely
      await this._storeToken(token);
      
      performanceMonitor.endTimer(timerId, { 
        success: true, 
        forced: forceRefresh 
      });
      
      logger.debug('✅ Token refreshed and stored successfully');
      return token;

    } catch (error) {
      performanceMonitor.endTimer(timerId, { 
        success: false, 
        error: error.message 
      });
      
      logger.error('❌ Token refresh error:', {
        error: error.message,
        code: error.code,
        forceRefresh
      });

      // Handle specific Firebase auth errors
      if (this._shouldClearTokens(error)) {
        await this._clearStoredToken();
      }

      throw this._enhanceError(error);
    }
  }

  /**
   * Store token securely with validation
   */
  async _storeToken(token) {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      logger.debug('💾 Token stored securely');
    } catch (storageError) {
      logger.error('❌ Failed to store token:', storageError);
      // Don't throw here - we still have the token in memory
    }
  }

  /**
   * Clear stored token from storage
   */
  async _clearStoredToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      logger.debug('🧹 Stored token cleared');
    } catch (error) {
      logger.error('❌ Failed to clear stored token:', error);
    }
  }

  /**
   * Get stored token from AsyncStorage (for cold starts)
   */
  async getStoredToken() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        logger.debug('💾 Retrieved stored token');
        this.tokenCache = token;
        this.lastRefresh = Date.now();
      }
      return token;
    } catch (error) {
      logger.error('❌ Failed to retrieve stored token:', error);
      return null;
    }
  }

  /**
   * Check if token is about to expire
   */
  isTokenExpiring() {
    if (!this.tokenCache || !this.lastRefresh) return true;
    
    const timeUntilExpiry = Date.now() - this.lastRefresh;
    return timeUntilExpiry >= this.refreshThreshold;
  }

  /**
   * Force refresh token (for critical operations)
   */
  async forceRefresh() {
    logger.warn('🔄 Force refreshing token');
    this.clearCache();
    return this.getValidToken(true);
  }

  /**
   * Clear all token cache and state
   */
  clearCache() {
    this.tokenCache = null;
    this.tokenPromise = null;
    this.lastRefresh = 0;
    this.retryCount = 0;
    logger.debug('🧹 Token cache cleared');
  }

  /**
   * Complete logout cleanup
   */
  async logout() {
    logger.info('👋 Logging out - clearing all token data');
    this.clearCache();
    await this._clearStoredToken();
  }

  /**
   * Error enhancement and classification
   */
  _enhanceError(error) {
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.isAuthError = this._isAuthError(error);
    enhancedError.isNetworkError = this._isNetworkError(error);
    
    return enhancedError;
  }

  /**
   * Check if error is authentication-related
   */
  _isAuthError(error) {
    const authErrorCodes = [
      'auth/user-not-found',
      'auth/wrong-password', 
      'auth/invalid-email',
      'auth/user-disabled',
      'auth/operation-not-allowed',
      'auth/invalid-credential'
    ];
    
    return authErrorCodes.includes(error?.code);
  }

  /**
   * Check if error is network-related
   */
  _isNetworkError(error) {
    return error?.code === 'auth/network-request-failed' || 
           error?.message?.includes('network');
  }

  /**
   * Determine if tokens should be cleared based on error
   */
  _shouldClearTokens(error) {
    const clearErrorCodes = [
      'auth/user-not-found',
      'auth/user-disabled',
      'auth/invalid-credential',
      'auth/operation-not-allowed'
    ];
    
    return clearErrorCodes.includes(error?.code);
  }

  /**
   * Get current token state for debugging
   */
  getTokenState() {
    return {
      hasToken: !!this.tokenCache,
      lastRefresh: this.lastRefresh,
      isRefreshing: !!this.tokenPromise,
      timeSinceRefresh: this.lastRefresh ? Date.now() - this.lastRefresh : null,
      isExpiring: this.isTokenExpiring(),
      retryCount: this.retryCount
    };
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Also export the class for testing
export { TokenManager };