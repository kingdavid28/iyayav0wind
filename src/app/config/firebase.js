import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyC7Flwhydbq1qV3tw_QchXr8_5Wg0wOshk",
  authDomain: "iyayav0.firebaseapp.com",
  projectId: "iyayav0",
  storageBucket: "iyayav0.firebasestorage.app",
  messagingSenderId: "433110030942",
  appId: "1:433110030942:web:831e0450381ef9b318f2cf",
  measurementId: "G-N952TEZFY9"
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
export default app;