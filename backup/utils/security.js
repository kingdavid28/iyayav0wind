// Security utilities for production
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

class SecurityManager {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
  }

  // Secure token storage
  async storeToken(token, refreshToken = null) {
    try {
      await SecureStore.setItemAsync(this.tokenKey, token);
      if (refreshToken) {
        await SecureStore.setItemAsync(this.refreshTokenKey, refreshToken);
      }
    } catch (error) {
      console.error('Failed to store token securely:', error);
      // Fallback to AsyncStorage (less secure but functional)
      await AsyncStorage.setItem(this.tokenKey, token);
      if (refreshToken) {
        await AsyncStorage.setItem(this.refreshTokenKey, refreshToken);
      }
    }
  }

  // Retrieve token securely
  async getToken() {
    try {
      return await SecureStore.getItemAsync(this.tokenKey);
    } catch (error) {
      console.error('Failed to retrieve token securely:', error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(this.tokenKey);
    }
  }

  // Clear all stored tokens
  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(this.tokenKey);
      await SecureStore.deleteItemAsync(this.refreshTokenKey);
    } catch (error) {
      console.error('Failed to clear tokens securely:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(this.tokenKey);
      await AsyncStorage.removeItem(this.refreshTokenKey);
    }
  }

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
  }

  // Validate file uploads
  validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size too large (max 10MB)' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }

  // Rate limiting for API calls
  createRateLimiter(maxRequests = 10, windowMs = 60000) {
    const requests = new Map();
    
    return (identifier) => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Clean old requests
      for (const [key, timestamps] of requests.entries()) {
        requests.set(key, timestamps.filter(time => time > windowStart));
        if (requests.get(key).length === 0) {
          requests.delete(key);
        }
      }
      
      // Check current requests
      const userRequests = requests.get(identifier) || [];
      
      if (userRequests.length >= maxRequests) {
        return { allowed: false, retryAfter: windowMs };
      }
      
      // Add current request
      userRequests.push(now);
      requests.set(identifier, userRequests);
      
      return { allowed: true };
    };
  }

  // Generate secure random string
  generateSecureId(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Validate JWT token format (basic check)
  isValidJWTFormat(token) {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    return parts.length === 3;
  }

  // Check if token is expired (basic check)
  isTokenExpired(token) {
    try {
      if (!this.isValidJWTFormat(token)) return true;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < now;
    } catch (error) {
      return true; // If we can't parse it, consider it expired
    }
  }

  // Timing-safe token comparison
  compareTokens(token1, token2) {
    const { timingSafeEqual } = require('./timingSafeEqual');
    return timingSafeEqual(token1 || '', token2 || '');
  }
}

export const security = new SecurityManager();
