// Firebase configuration with proper v9+ modular imports
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  update,
  push,
  query,
  orderByChild,
  limitToLast,
  startAt,
  startAfter,
  endAt,
  endBefore,
  equalTo
} from 'firebase/database';

// Global Firebase instance to prevent multiple initialization
let firebaseInstance = null;

const initializeFirebase = () => {
  // Return existing instance if already initialized and has database
  if (firebaseInstance && firebaseInstance.database) {
    console.log('🔄 Firebase already initialized, returning existing instance');
    return firebaseInstance;
  }

  console.log('🚀 Initializing Firebase...');

  const firebaseConfig = {
    apiKey: "AIzaSyC7Flwhydbq1qV3tw_QchXr8_5Wg0wOshk",
    authDomain: "iyayav0.firebaseapp.com",
    projectId: "iyayav0",
    storageBucket: "iyayav0.firebasestorage.app",
    messagingSenderId: "433110030942",
    appId: "1:433110030942:web:831e0450381ef9b318f2cf",
    measurementId: "G-N952TEZFY9",
    databaseURL: "https://iyayav0-default-rtdb.asia-southeast1.firebasedatabase.app/"
  };

  let app;
  try {
    // Try to get existing app first
    if (getApps().length > 0) {
      app = getApp();
      console.log('✅ Using existing Firebase app');
    } else {
      console.log('🔥 No existing Firebase app found, creating new one...');
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase app initialized successfully');
    }
  } catch (error) {
    console.error('❌ Firebase app initialization failed:', error);
    // If it's an "already exists" error, try to get the existing app
    if (error.code === 'app/duplicate-app') {
      try {
        app = getApp();
        console.log('✅ Using existing Firebase app after duplicate error');
      } catch (getError) {
        console.error('❌ Could not get existing Firebase app:', getError);
        throw error;
      }
    } else {
      throw error;
    }
  }

  let database;
  try {
    database = getDatabase(app);
    console.log('✅ Firebase database initialized successfully');

    // Test database object - check for ref function availability
    if (database) {
      console.log('🔍 Database object details:', {
        type: typeof database,
        hasRef: typeof database.ref,
        constructor: database?.constructor?.name
      });

      // For mobile platforms, the ref function might not be available on the database object
      // but the imported ref function should work with the database
      if (typeof database.ref === 'undefined') {
        console.log('📱 Mobile platform detected - ref function is imported separately');
      }
    } else {
      console.error('❌ Database object is null after getDatabase call');
    }
  } catch (error) {
    console.error('❌ Firebase database initialization failed:', error);
    database = null;
  }

  let auth;
  try {
    const { Platform } = require('react-native');

    if (Platform.OS === 'web') {
      auth = getAuth(app);
      console.log('✅ Firebase auth initialized for web');
    } else {
      // Try to import AsyncStorage dynamically
      let AsyncStorage;
      try {
        const asyncStorageModule = require('@react-native-async-storage/async-storage');
        AsyncStorage = asyncStorageModule.default || asyncStorageModule;
        console.log('✅ AsyncStorage imported successfully');
      } catch (asyncError) {
        console.warn('⚠️ AsyncStorage not available, using default auth persistence');
      }

      try {
        if (AsyncStorage) {
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('✅ Firebase auth initialized with AsyncStorage persistence');
        } else {
          auth = getAuth(app);
          console.log('✅ Firebase auth initialized with default persistence');
        }
      } catch (authInitError) {
        console.error('❌ Firebase auth initialization failed:', authInitError);
        // Check if it's an "already initialized" error
        if (authInitError.code === 'auth/already-initialized' || authInitError.message?.includes('already-in')) {
          try {
            auth = getAuth(app);
            console.log('✅ Using existing Firebase auth instance after already-initialized error');
          } catch (fallbackError) {
            console.error('❌ Firebase auth fallback failed:', fallbackError);
          }
        } else {
          // Fallback: try to get existing auth
          try {
            auth = getAuth(app);
            console.log('✅ Using existing Firebase auth instance');
          } catch (fallbackError) {
            console.error('❌ Firebase auth fallback failed:', fallbackError);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Firebase auth setup failed:', error);
    // Final fallback: try to get auth from any existing app
    try {
      auth = getAuth(app);
    } catch (fallbackError) {
      console.error('❌ Firebase auth final fallback failed:', fallbackError);
    }
  }

  // Store Firebase instance with all functions
  firebaseInstance = {
    app,
    auth,
    database,
    config: firebaseConfig
  };

  console.log('✅ Firebase initialization complete');
  return firebaseInstance;
};

// Initialize Firebase immediately
console.log('🔥 Initializing Firebase...');
const firebase = initializeFirebase();

console.log('🔍 Firebase initialization result:', {
  hasAuth: !!firebase?.auth,
  hasDatabase: !!firebase?.database,
  isNull: firebase === null,
  isUndefined: firebase === undefined,
  firebaseKeys: firebase ? Object.keys(firebase) : 'null/undefined'
});

// Export Firebase components with null checks
export const auth = firebase?.auth || null;
export const database = firebase?.database || null;

// Export Firebase functions directly from the imported functions
// This ensures they're always available even if initialization fails
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
  startAt as firebaseStartAt,
  startAfter as firebaseStartAfter,
  endAt as firebaseEndAt,
  endBefore as firebaseEndBefore,
  equalTo as firebaseEqualTo
};

// Export the initialized firebase instance for advanced usage
export default firebase;