// Environment configuration
const isDev = __DEV__;

export const Config = {
  // API Configuration
  API_BASE_URL: isDev 
    ? 'http://192.168.1.10:3000/api'
    : 'https://api.iyaya.com/api',
  
  SOCKET_URL: isDev
    ? 'http://192.168.1.10:3000'
    : 'https://api.iyaya.com',

  // App Configuration
  APP_NAME: 'Iyaya',
  APP_VERSION: '1.0.0',
  ENVIRONMENT: isDev ? 'development' : 'production',

  // Network Configuration
  REQUEST_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    ONBOARDING: 'has_seen_onboarding'
  },

  // Feature Flags
  FEATURES: {
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
    ANALYTICS: !isDev,
    DEBUG_LOGS: isDev
  }
};

export default Config;