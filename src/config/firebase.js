import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  getReactNativePersistence, 
  browserLocalPersistence, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase credentials (env-based)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app only once
let app;
let auth;
let db;
let storage;
let functions;
let messaging;

// Initialize Firebase
const initFirebase = () => {
  try {
    // Initialize Firebase app if not already initialized
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    // Initialize Auth
    if (Platform.OS === 'web') {
      auth = initializeAuth(app, {
        persistence: browserLocalPersistence,
      });
    } else {
      // For React Native, use AsyncStorage persistence
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }

    // Determine if Firebase should be enabled (prefer backend REST, disable Firestore on web by default)
    const hasFirebaseEnv = Boolean(
      firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.authDomain
    );

    const FIREBASE_ENABLED = hasFirebaseEnv && Platform.OS !== 'web';

    if (!FIREBASE_ENABLED) {
      // Skip Firestore (and Messaging) initialization to avoid web calls and 400s
      db = undefined;
      messaging = undefined;
      console.warn('[Firebase] Skipping Firestore/Messaging initialization (using backend REST).');
    } else {
      // Configure and initialize Firestore with settings
      const firestoreSettings = {
        cache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
          cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        }),
        experimentalAutoDetectLongPolling: true,
      };

      // Initialize Firestore with settings
      db = initializeFirestore(app, firestoreSettings);

      // Enable offline persistence (native only now)
      // Note: We deliberately skip IndexedDB persistence on web in this setup
    }

    // Initialize other Firebase services
    storage = getStorage(app);
    functions = getFunctions(app);
    
    // Initialize Cloud Messaging only when Firebase is enabled and not on web
    if (FIREBASE_ENABLED && Platform.OS !== 'web') {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.warn('Failed to initialize Firebase Messaging', error);
      }
    }

    console.log('Firebase initialized successfully');
    return { app, auth, db, storage, functions, messaging };
  } catch (error) {
    console.error('Firebase initialization error', error);
    // Fallback to basic initialization if there's an error
    if (!app) app = getApp();
    if (!auth) auth = getAuth(app);
    if (!db) db = getFirestore(app);
    return { app, auth, db };
  }
};

// Initialize Firebase
const { app: initializedApp, auth: initializedAuth, db: firestore, storage: firebaseStorage, functions: firebaseFunctions, messaging: firebaseMessaging } = initFirebase();

// Export initialized services
export { 
  initializedApp as app, 
  initializedAuth as auth, 
  firestore as db, 
  firebaseStorage as storage, 
  firebaseFunctions as functions, 
  firebaseMessaging as messaging,
  firebaseConfig, 
  onAuthStateChanged 
};

// Export Firestore types and utilities
export { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDocs,
  writeBatch,
  runTransaction
} from 'firebase/firestore';

// Export Storage utilities
export { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Export Functions utilities
export { httpsCallable } from 'firebase/functions';

// Export Auth utilities
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  fetchSignInMethodsForEmail
} from 'firebase/auth';