// Environment detection - handle both Expo and web environments
let __DEV__ = false
try {
  __DEV__ = process.env.NODE_ENV === "development"
} catch (error) {
  __DEV__ = true // Default to development mode
}

export { __DEV__ }
export const __PROD__ = !__DEV__

// Compute a cross-platform API base URL that works for Expo Web, Android emulator, iOS simulator, and physical devices.
const getBaseHost = () => {
  // 1) Respect explicit env override when provided
  const envUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL)
  if (envUrl) return { mode: 'env', url: envUrl.replace(/\/$/, '') }

  // 2) Try React Native Platform if available
  try {
    // Use require to avoid bundling issues in non-RN contexts
    const rn = require('react-native')
    const platform = rn?.Platform?.OS
    if (platform === 'android') {
      // Android emulator uses host loopback 10.0.2.2
      return { mode: 'android-emulator', url: 'http://10.0.2.2:5000' }
    }
    if (platform === 'ios') {
      // iOS simulator can access localhost
      return { mode: 'ios-simulator', url: 'http://localhost:5000' }
    }
  } catch (_) {}

  // 3) Web (expo web / react-native-web) – use current hostname
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname
    return { mode: 'web', url: `http://${host}:5000` }
  }

  // 4) Fallback
  return { mode: 'fallback', url: 'http://localhost:5000' }
}

const baseHost = getBaseHost()

// API Configuration
export const API_CONFIG = {
  BASE_URL: `${baseHost.url}/api`,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// App Configuration
export const APP_CONFIG = {
  NAME: "Iyaya",
  VERSION: "1.0.0",
  BUILD_NUMBER: "1",
}

// Feature Flags
export const FEATURES = {
  PUSH_NOTIFICATIONS: true,
  REAL_TIME_CHAT: true,
  BACKGROUND_CHECKS: true,
  PAYMENT_INTEGRATION: false,
}

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-()]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  BIO_MAX_LENGTH: 500,
  HOURLY_RATE_MIN: 10,
  HOURLY_RATE_MAX: 100,
}

// Storage Keys
export const STORAGE_KEYS = {
  USER_TOKEN: "@iyaya:userToken",
  USER_PROFILE: "@iyaya:userProfile",
  ONBOARDING_COMPLETE: "@iyaya:onboardingComplete",
  PUSH_TOKEN: "@iyaya:pushToken",
  THEME_PREFERENCE: "@iyaya:themePreference",
  LANGUAGE_PREFERENCE: "@iyaya:languagePreference",
}

// Error Codes
export const ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTH_ERROR: "AUTH_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
}

// Theme Colors
export const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  light: "#f8fafc",
  dark: "#1e293b",
  background: "#ffffff",
  text: "#000000",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
}
