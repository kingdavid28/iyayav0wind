// Environment configuration
const isDev = __DEV__;

let expoConstants;
try {
  const module = require('expo-constants');
  expoConstants = module?.default ?? module;
} catch (error) {
  expoConstants = null;
}

const expoExtra = expoConstants?.expoConfig?.extra
  ?? expoConstants?.manifest?.extra
  ?? {};

const envVars = (typeof process !== 'undefined' && process?.env) ? process.env : {};

const getEnvVar = (key) => {
  return envVars[key] ?? expoExtra[key];
};

const normalizeUrl = (url, { ensureApiSuffix = false } = {}) => {
  if (!url) {
    return null;
  }

  const trimmed = url.trim().replace(/\/$/, '');
  if (!ensureApiSuffix) {
    return trimmed;
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const envApiHost = getEnvVar('EXPO_PUBLIC_API_URL');
const envSocket = getEnvVar('EXPO_PUBLIC_SOCKET_URL');

const defaultHost = isDev ? 'http://192.168.1.9:5000' : 'https://api.iyaya.com';

const apiHost = normalizeUrl(envApiHost || defaultHost);
const socketHost = normalizeUrl(envSocket || apiHost?.replace(/\/api$/, ''));

export const Config = {
  // API Configuration
  API_BASE_URL: normalizeUrl(apiHost, { ensureApiSuffix: true }),

  SOCKET_URL: socketHost || (isDev
    ? 'http://192.168.1.9:5000'
    : 'https://api.iyaya.com'),

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