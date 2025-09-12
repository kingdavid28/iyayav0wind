import { Platform } from 'react-native';

// CSRF Token Management
class CSRFManager {
  constructor() {
    this.token = null;
    this.expiry = null;
  }

  async getCSRFToken() {
    // Check if token is still valid
    if (this.token && this.expiry && Date.now() < this.expiry) {
      return this.token;
    }

    // Fetch new token from server
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.expiry = Date.now() + (data.expiresIn || 3600000); // 1 hour default
        return this.token;
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error);
    }

    return null;
  }

  clearToken() {
    this.token = null;
    this.expiry = null;
  }
}

export const csrfManager = new CSRFManager();

// Secure request wrapper with CSRF protection
export const secureRequest = async (url, options = {}) => {
  const csrfToken = await csrfManager.getCSRFToken();
  
  const secureOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...(csrfToken && { 'X-CSRF-Token': csrfToken })
    }
  };

  return fetch(url, secureOptions);
};

// Input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Generate secure random string
export const generateSecureId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (Platform.OS === 'web' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for React Native
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

// Rate limiting helper
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const userRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    this.requests.set(key, validRequests);
    
    // Check if under limit
    if (validRequests.length < this.maxRequests) {
      validRequests.push(now);
      return true;
    }
    
    return false;
  }

  reset(key) {
    this.requests.delete(key);
  }
}

// Default rate limiter instance
export const defaultRateLimiter = new RateLimiter();