// Enhanced logger for mobile debugging
export const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
    // Also show alert in development
    if (__DEV__) {
      console.warn('ERROR OCCURRED:', message);
    }
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  }
};