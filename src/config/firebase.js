// firebase.js - Consolidated Firebase configuration with best practices
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, push, set, query, orderByChild } from 'firebase/database';
import { getAuth, initializeAuth, getReactNativePersistence, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Validate required Firebase configuration
const requiredFields = ['apiKey', 'projectId', 'databaseURL'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('❌ Missing required Firebase environment variables:', missingFields);
  console.error('Please check your .env file and ensure all Firebase variables are set');
} else {
  console.log('✅ Firebase configuration loaded successfully');
}

let app;
let database;
let auth;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Provide fallback values to prevent runtime errors
  app = null;
  database = null;
}

// React Native compatible auth setup
try {
  if (Platform.OS === 'web') {
    if (app) {
      auth = getAuth(app);
    } else {
      console.warn('⚠️ Firebase app is null, skipping auth initialization');
      auth = null;
    }
  } else {
    if (app) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      console.warn('⚠️ Firebase app is null, skipping auth initialization');
      auth = null;
    }
  }
  console.log('✅ Firebase Auth initialized successfully');
} catch (error) {
  console.error('❌ Firebase Auth initialization failed:', error);
  auth = null;
}

export {
  database,
  auth,
  app,
  ref,
  onValue,
  off,
  push,
  set,
  query,
  orderByChild,
  onAuthStateChanged,
  signInAnonymously
};
