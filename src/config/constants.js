// config/constants.js

// Environment detection - handle both Expo and web environments
let __DEV__ = false;
try {
  __DEV__ = process.env.NODE_ENV === "development";
} catch (error) {
  // In React Native/Expo, we can check __DEV__ directly
  if (typeof global.__DEV__ !== "undefined") {
    __DEV__ = global.__DEV__;
  } else {
    __DEV__ = true; // Default to development mode
  }
}

export { __DEV__ };
export const __PROD__ = !__DEV__;

// ⚠️ SECURITY: Never hardcode credentials in source code
// Use environment variables for all sensitive configuration
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Validate required environment variables in development
if (__DEV__ && (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId)) {
  console.warn('⚠️ Missing required Firebase environment variables');
  console.warn('Please set EXPO_PUBLIC_FIREBASE_API_KEY and EXPO_PUBLIC_FIREBASE_PROJECT_ID');
}

// Compute a cross-platform API base URL that works for Expo Web, Android emulator, iOS simulator, and physical devices.
const getBaseHost = () => {
  try {
    // 1) Environment variable takes priority
    const envUrl = process.env?.EXPO_PUBLIC_API_URL || process.env?.REACT_APP_API_URL;
    if (envUrl) {
      const cleaned = envUrl.replace(/\/$/, "").replace(/\/api$/i, "");
      return { mode: "env", url: cleaned };
    }

    // 2) Platform-specific defaults
    try {
      const { Platform } = require("react-native");
      if (Platform.OS === "android") {
        // Android emulator and devices
        return { mode: "android", url: "http://10.0.2.2:5000" };
      }
      if (Platform.OS === "ios") {
        // iOS simulator and devices
        return { mode: "ios", url: "http://localhost:5000" };
      }
    } catch (_) {
      // Ignore require errors for react-native in web environments
    }

    // 3) Web fallback
    if (typeof window !== "undefined") {
      return { mode: "web", url: "http://localhost:5000" };
    }

    // 4) Default fallback
    return { mode: "fallback", url: "http://localhost:5000" };
  } catch (error) {
    console.error("Error determining base host:", error);
    return { mode: "error-fallback", url: "http://localhost:5000" };
  }
};

const baseHost = getBaseHost();
if (__DEV__) {
  console.log('🔗 Base host configuration:', baseHost);
}

// API Configuration with enhanced timeout and retry settings
export const API_CONFIG = {
  BASE_URL: `${baseHost.url}/api`,
  TIMEOUT: {
    DEFAULT: 15000, // 15 seconds default
    AUTH: 20000, // 20 seconds for auth
    UPLOAD: 45000, // 45 seconds for uploads
    DOWNLOAD: 30000, // 30 seconds for downloads
    HEALTH_CHECK: 5000, // 5 seconds for health checks
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000, // Start with 1 second
    MAX_DELAY: 10000, // Max 10 seconds between retries
    JITTER: 500,
    STATUS_CODES: [408, 429, 500, 502, 503, 504],
    METHODS: ["GET", "POST", "PUT", "DELETE"],
  },
  CONNECTION: {
    CHECK_URL: "/health",
    CHECK_TIMEOUT: 5000,
    CHECK_INTERVAL: 30000,
    RECONNECT_ATTEMPTS: 3,
  },
};

// Token Management Configuration
export const TOKEN_CONFIG = {
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  AUTO_REFRESH: true,
};

// Storage Keys - Consolidated and organized
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: "@iyaya:auth_token",
  REFRESH_TOKEN: "@iyaya:refresh_token",
  TOKEN_EXPIRY: "@iyaya:token_expiry",
  
  // User Data
  USER_PROFILE: "@iyaya:userProfile",
  USER_EMAIL: "@iyaya:userEmail",
  USER_PREFERENCES: "@iyaya:userPreferences",
  
  // App State
  ONBOARDING_COMPLETE: "@iyaya:onboardingComplete",
  THEME_PREFERENCE: "@iyaya:themePreference",
  LANGUAGE_PREFERENCE: "@iyaya:languagePreference",
  
  // Notifications
  PUSH_TOKEN: "@iyaya:pushToken",
  NOTIFICATION_SETTINGS: "@iyaya:notificationSettings",
  
  // Cache
  API_CACHE_PREFIX: "@iyaya:cache:",
  LAST_SYNC_TIMESTAMP: "@iyaya:lastSyncTimestamp",
};

// Connection States
export const CONNECTION_STATES = {
  CHECKING: "CHECKING",
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  RECONNECTING: "RECONNECTING",
};

// Comprehensive Error Codes
export const ERROR_CODES = {
  // Network Errors
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  NETWORK_REQUEST_FAILED: "NETWORK_REQUEST_FAILED",
  
  // Authentication Errors
  AUTH_ERROR: "AUTH_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  
  // Client Errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMIT: "RATE_LIMIT",
  
  // Server Errors
  SERVER_ERROR: "SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  BAD_GATEWAY: "BAD_GATEWAY",
  
  // Application Errors
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  OPERATION_FAILED: "OPERATION_FAILED",
  RETRY_FAILED: "RETRY_FAILED",
  REQUEST_ABORTED: "REQUEST_ABORTED",
};

// Debug configuration
export const DEBUG_CONFIG = {
  ENABLED: __DEV__,
  LOG_LEVEL: __DEV__ ? "debug" : "error",
  API_LOGGING: __DEV__,
  SHOW_TIMEOUTS: __DEV__,
  RETRY_LOGGING: __DEV__,
  NETWORK_LOGGING: __DEV__,
};

// Request priority levels
export const REQUEST_PRIORITY = {
  HIGH: {
    timeout: API_CONFIG.TIMEOUT.DEFAULT,
    retries: API_CONFIG.RETRY.MAX_ATTEMPTS,
    priority: 1,
  },
  NORMAL: {
    timeout: API_CONFIG.TIMEOUT.DEFAULT,
    retries: 2,
    priority: 2,
  },
  LOW: {
    timeout: API_CONFIG.TIMEOUT.DEFAULT,
    retries: 1,
    priority: 3,
  },
  BACKGROUND: {
    timeout: API_CONFIG.TIMEOUT.DEFAULT * 2,
    retries: 0,
    priority: 4,
  },
};

// Theme Colors - Consistent design system
export const COLORS = {
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    contrast: "#ffffff",
  },
  secondary: {
    main: "#8b5cf6",
    light: "#a78bfa",
    dark: "#7c3aed",
    contrast: "#ffffff",
  },
  status: {
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
  background: {
    default: "#ffffff",
    paper: "#f8fafc",
    dark: "#1e293b",
  },
  text: {
    primary: "#000000",
    secondary: "#4b5563",
    disabled: "#9ca3af",
    inverse: "#ffffff",
  },
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
};

// App Configuration
export const APP_CONFIG = {
  NAME: "Iyaya",
  VERSION: "1.0.0",
  BUILD_NUMBER: "1",
  SUPPORT_EMAIL: "support@iyaya.com",
  PRIVACY_POLICY_URL: "https://iyaya.com/privacy",
  TERMS_URL: "https://iyaya.com/terms",
};

// Feature Flags
export const FEATURES = {
  PUSH_NOTIFICATIONS: true,
  REAL_TIME_CHAT: true,
  BACKGROUND_SYNC: true,
  PAYMENT_INTEGRATION: false, // Disabled until ready
  PROFILE_VERIFICATION: true,
  PORTFOLIO_GALLERY: true,
  AVAILABILITY_CALENDAR: true,
  EMERGENCY_CONTACTS: true,
  OFFLINE_MODE: true,
  DARK_MODE: true,
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-()]{10,}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: false,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  BIO: {
    MAX_LENGTH: 500,
  },
  
  // Childcare-specific validation
  EXPERIENCE: {
    MIN_MONTHS: 6,
    MAX_YEARS: 50,
  },
  AGE_CARE_RANGES: {
    INFANT: { min: 0, max: 12, label: "Infants (0-12 months)" },
    TODDLER: { min: 13, max: 36, label: "Toddlers (1-3 years)" },
    PRESCHOOL: { min: 37, max: 60, label: "Preschoolers (3-5 years)" },
    SCHOOL_AGE: { min: 61, max: 144, label: "School Age (5-12 years)" },
    TEEN: { min: 145, max: 216, label: "Teenagers (12-18 years)" },
  },
  CERTIFICATIONS: {
    REQUIRED: ["CPR", "First Aid"],
    OPTIONAL: ["Early Childhood Education", "Child Development"],
  },
  PORTFOLIO: {
    MAX_IMAGES: 10,
    MAX_SIZE_MB: 5,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg"],
  },
  EMERGENCY_CONTACTS: {
    MIN: 1,
    MAX: 3,
  },
};

// Currency Configuration
export const CURRENCY = {
  SYMBOL: "₱",
  CODE: "PHP",
  NAME: "Philippine Peso",
  DECIMAL_PLACES: 2,
  LOCALE: "en-PH",
};

// Network Configuration
export const NETWORK = {
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3,
  TIMEOUT_INCREMENT: 1.5,
  CHECK_INTERVAL: 10000,
  OFFLINE_TIMEOUT: 5000,
  CONNECTION_TYPES: {
    WIFI: "WIFI",
    CELLULAR: "CELLULAR",
    ETHERNET: "ETHERNET",
    UNKNOWN: "UNKNOWN",
    NONE: "NONE",
  },
};

// Helper function to calculate retry delay with exponential backoff
export const calculateRetryDelay = (attempt, customConfig = {}) => {
  const config = { ...API_CONFIG.RETRY, ...customConfig };
  const baseDelay = config.DELAY;
  const maxDelay = config.MAX_DELAY;
  const jitter = Math.random() * config.JITTER;

  const delay = Math.min(baseDelay * Math.pow(2, attempt) + jitter, maxDelay);

  return Math.floor(delay);
};

// Platform detection
export const PLATFORM = {
  IS_IOS: typeof navigator !== 'undefined' ? /iPad|iPhone|iPod/.test(navigator.userAgent) : false,
  IS_ANDROID: typeof navigator !== 'undefined' ? /Android/.test(navigator.userAgent) : false,
  IS_WEB: typeof document !== 'undefined',
  IS_MOBILE: typeof navigator !== 'undefined' ? /Mobi/.test(navigator.userAgent) : false,
};

// Export default for easier imports
export default {
  __DEV__,
  __PROD__,
  FIREBASE_CONFIG,
  API_CONFIG,
  TOKEN_CONFIG,
  STORAGE_KEYS,
  CONNECTION_STATES,
  ERROR_CODES,
  DEBUG_CONFIG,
  REQUEST_PRIORITY,
  COLORS,
  APP_CONFIG,
  FEATURES,
  VALIDATION,
  CURRENCY,
  NETWORK,
  PLATFORM,
  calculateRetryDelay,
};