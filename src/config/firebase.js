// firebase.js - Enhanced with better synchronization
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { endBefore, equalTo, get, getDatabase, limitToLast, off, onValue, orderByChild, push, query, ref, set, startAfter, update } from 'firebase/database';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};
console.log('🔍 Firebase config', firebaseConfig);
// Validate configuration
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'projectId', 'databaseURL'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field] || firebaseConfig[field] === 'undefined');

  if (missingFields.length > 0) {
    console.error('❌ Missing required Firebase environment variables:', missingFields);
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
  }

  console.log('✅ Firebase configuration loaded successfully');
};

// State management
let app = null;
let database = null;
let auth = null;
let isInitializing = false;
let initializationPromise = null;

const ensureDatabaseGuard = (dbInstance) => {
  if (!dbInstance) {
    throw new Error('Firebase database instance is not available');
  }
  return dbInstance;
};

const getDatabaseInstanceOrThrow = () => {
  if (!database) {
    throw new Error('Firebase database not initialized. Call initializeFirebase() first.');
  }

  if (typeof database._checkNotDeleted === 'function') {
    database._checkNotDeleted('firebaseDatabaseAccess');
  }

  return ensureDatabaseGuard(database);
};

// Core initialization function
const initializeFirebaseCore = async () => {
  if (isInitializing) {
    console.log('⏳ Firebase initialization already in progress...');
    return initializationPromise;
  }

  isInitializing = true;
  console.log('🔥 Starting Firebase initialization...');

  initializationPromise = (async () => {
    try {
      // Validate config first
      validateFirebaseConfig();

      // Check for existing apps
      const existingApps = getApps();
      if (existingApps.length > 0) {
        app = existingApps[0];
        console.log('✅ Using existing Firebase app');
      } else {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase app initialized successfully');
      }

      // Initialize database
      try {
        database = getDatabase(app);
        console.log('✅ Firebase database initialized successfully');
      } catch (dbError) {
        console.error('❌ Firebase database initialization failed:', dbError);
        throw dbError;
      }

      // Initialize auth with proper platform detection
      try {
        if (Platform.OS === 'web') {
          auth = getAuth(app);
          console.log('✅ Firebase Auth initialized for web');
        } else {
          // For React Native, use initializeAuth with persistence
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('✅ Firebase Auth initialized for React Native with persistence');
        }
        console.log('✅ Firebase Auth initialized successfully');
      } catch (authError) {
        console.error('❌ Firebase Auth initialization failed:', authError);
        // Fallback to getAuth if initializeAuth fails
        try {
          auth = getAuth(app);
          console.log('✅ Fallback to basic Firebase Auth');
        } catch (fallbackError) {
          console.error('❌ Fallback auth also failed:', fallbackError);
          throw fallbackError;
        }
      }

      isInitializing = false;
      console.log('🎉 Firebase initialization completed successfully');
      return { app, database, auth };
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      isInitializing = false;
      throw error;
    }
  })();

  return initializationPromise;
};

// Public initialization function
export const initializeFirebase = async () => {
  try {
    if (app && database && auth) {
      console.log('✅ Firebase already initialized');
      return { app, database, auth };
    }
    return await initializeFirebaseCore();
  } catch (error) {
    console.error('❌ initializeFirebase failed:', error);
    throw error;
  }
};

// Ensure Firebase is initialized
export const ensureFirebaseInitialized = async () => {
  try {
    if (app && database && auth) {
      return true;
    }

    await initializeFirebase();
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization check failed:', error);
    return false;
  }
};

// Safe database getter
export const getDatabaseSafely = async () => {
  try {
    const isInitialized = await ensureFirebaseInitialized();
    if (!isInitialized) {
      throw new Error('Firebase database not initialized');
    }
    return getDatabaseInstanceOrThrow();
  } catch (error) {
    console.error('❌ Error getting database safely:', error);
    return null;
  }
};

// Test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    const isInitialized = await ensureFirebaseInitialized();
    if (!isInitialized) {
      console.log('❌ Firebase not initialized');
      return false;
    }

    // Test database connection
    const testRef = ref(database, '.info/connected');
    return new Promise((resolve) => {
      const unsubscribe = onValue(testRef, (snapshot) => {
        const connected = snapshot.val();
        unsubscribe();
        if (connected) {
          console.log('✅ Firebase connection test passed');
          resolve(true);
        } else {
          console.log('❌ Firebase not connected');
          resolve(false);
        }
      }, (error) => {
        console.error('❌ Firebase connection test failed:', error);
        unsubscribe();
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        console.log('❌ Firebase connection test timeout');
        resolve(false);
      }, 5000);
    });
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
};

// Safe getters with initialization
export const getFirebaseApp = async () => {
  if (!app) {
    await initializeFirebase();
  }
  return app;
};

export const getFirebaseDatabase = async () => {
  if (!database) {
    await initializeFirebase();
  }
  return getDatabaseInstanceOrThrow();
};

export const getFirebaseAuth = async () => {
  if (!auth) {
    await initializeFirebase();
  }
  return auth;
};

// Synchronous getters (use with caution)
export const getDatabaseSync = () => {
  return getDatabaseInstanceOrThrow();
};

export const getAuthSync = () => {
  if (!auth) {
    throw new Error('Auth not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

// Safe operation wrappers
export const withDatabase = async (operation) => {
  const db = await getFirebaseDatabase();
  if (!db) {
    throw new Error('Database not available');
  }
  return operation(db);
};

export const withAuth = async (operation) => {
  const authInstance = await getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Auth not available');
  }
  return operation(authInstance);
};

export const createRef = (path) => {
  try {
    const dbInstance = getDatabaseInstanceOrThrow();
    const reference = ref(dbInstance, path);
    console.log(`✅ Reference created for path: ${path}`);
    return reference;
  } catch (error) {
    console.error('❌ Error creating reference:', error);
    throw error;
  }
};

export const createQuery = (targetRef, ...constraints) => {
  try {
    if (!targetRef) {
      throw new Error('Target reference is required to create a query');
    }
    return query(targetRef, ...constraints);
  } catch (error) {
    console.error('❌ Error creating query:', error);
    return null;
  }
};

export const safeSet = async (target, data) => {
  const dbInstance = await getFirebaseDatabase();
  if (!dbInstance) {
    throw new Error('Database not available for set');
  }

  if (typeof dbInstance._checkNotDeleted === 'function') {
    dbInstance._checkNotDeleted('safeSet');
  }

  const targetRef = typeof target === 'string' ? ref(dbInstance, target) : target;
  return set(targetRef, data);
};

export const safePush = async (target, data) => {
  const dbInstance = await getFirebaseDatabase();
  if (!dbInstance) {
    throw new Error('Database not available for push');
  }

  if (typeof dbInstance._checkNotDeleted === 'function') {
    dbInstance._checkNotDeleted('safePush');
  }

  const parentRef = typeof target === 'string' ? ref(dbInstance, target) : target;
  const newRef = push(parentRef);
  await set(newRef, data);
  return newRef;
};

export const safeGet = async (target) => {
  const dbInstance = await getFirebaseDatabase();
  if (!dbInstance) {
    throw new Error('Database not available for get');
  }

  if (typeof dbInstance._checkNotDeleted === 'function') {
    dbInstance._checkNotDeleted('safeGet');
  }

  const targetRef = typeof target === 'string' ? ref(dbInstance, target) : target;
  return get(targetRef);
};

export const safeUpdate = async (updates) => {
  const dbInstance = await getFirebaseDatabase();
  if (!dbInstance) {
    throw new Error('Database not available for update');
  }

  if (typeof dbInstance._checkNotDeleted === 'function') {
    dbInstance._checkNotDeleted('safeUpdate');
  }

  return update(ref(dbInstance), updates);
};

export const createConnectionsRef = () => createRef('connections');

export const withFirebaseCheck = async (operation) => {
  try {
    await ensureFirebaseInitialized();
    return await operation();
  } catch (error) {
    console.error('❌ Firebase operation failed:', error);
    throw error;
  }
};

export const safeDatabaseOperation = (operationName, operation) => {
  return async (...args) => {
    console.log(`🔄 Executing ${operationName}...`);
    try {
      await ensureFirebaseInitialized();
      const result = await operation(...args);
      console.log(`✅ ${operationName} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ ${operationName} failed:`, error);
      throw error;
    }
  };
};

// Initialize Firebase immediately but don't block exports
let initializationStarted = false;

export const initializeFirebaseAsync = () => {
  if (!initializationStarted) {
    initializationStarted = true;
    // Don't auto-initialize to prevent multiple initialization issues
    console.log('🔥 Firebase will be initialized on first use');
  }
};

// Export Firebase methods
export {
  endBefore,
  equalTo, get, limitToLast, off, onAuthStateChanged, onValue, orderByChild, push, query, ref, set, signInAnonymously, startAfter, update
};

// Export aliases for backward compatibility
export {
  ref as firebaseRef,
  onValue as firebaseOnValue,
  set as firebaseSet,
  get as firebaseGet,
  update as firebaseUpdate,
  push as firebasePush,
  query as firebaseQuery,
  orderByChild as firebaseOrderByChild,
  limitToLast as firebaseLimitToLast,
  equalTo as firebaseEqualTo
};

// Export instances with clear naming
export const getFirebaseAppInstance = () => app;
export const getFirebaseAuthInstance = () => auth;
export const getFirebaseDatabaseInstance = () => database;

// Export initialization state
export const isFirebaseInitialized = () => !!(app && database && auth);

// Start initialization (commented out to prevent auto-init issues)
// initializeFirebaseAsync();

const firebaseHelpers = {
  initializeFirebase,
  ensureFirebaseInitialized,
  getFirebaseApp,
  getFirebaseDatabase,
  getFirebaseAuth,
  createRef,
  safePush,
  safeGet,
  safeUpdate,
  createConnectionsRef,
  isFirebaseInitialized
};

export default firebaseHelpers;

export const firebaseService = firebaseHelpers;

export const safeDatabaseHelpers = {
  safePush,
  safeGet,
  safeUpdate,
  createConnectionsRef
};