import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Core imports
import AppProvider from '../core/providers/AppProvider';
import AppIntegration from './AppIntegration';
import PrivacyProvider from '../components/features/privacy/PrivacyManager';
import ProfileDataProvider from '../components/features/privacy/ProfileDataManager';
import { ErrorBoundary, LoadingSpinner } from '../shared/ui';

// Auth Context
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { MessagingProvider } from '../contexts/MessagingContext';

// Firebase - Direct import for initialization
import { initializeFirebase, getAuthSync } from '../config/firebase';

// Log filter
import '../utils/logFilter';

// Navigation
import AppNavigator from './navigation/AppNavigator';

LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "Setting a timer",
  "Non-serializable values",
]);

SplashScreen.preventAutoHideAsync();

// Enhanced Firebase Provider that ensures Auth is ready
const FirebaseAuthProvider = ({ children }) => {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        console.log('🔥 Initializing Firebase with Auth...');
        await initializeFirebase();

        // Test that auth is actually available
        const auth = getAuthSync();
        console.log('✅ Firebase Auth is ready');

        setFirebaseReady(true);
      } catch (err) {
        console.error('❌ Firebase Auth initialization failed:', err);
        setError(err);
        setFirebaseReady(true); // Continue anyway
      }
    };

    initFirebase();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: 'red', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Firebase Error
        </Text>
        <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', padding: 20 }}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (!firebaseReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <LoadingSpinner text="Initializing Firebase Auth..." />
      </View>
    );
  }

  // Only render AuthProvider when Firebase is definitely ready
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Initializing Iyaya app...');

        // Pre-initialize Firebase to ensure it's ready
        await initializeFirebase().catch(error => {
          console.warn('⚠️ Firebase init warning (continuing):', error.message);
        });

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (e) {
        console.error('❌ Error during app initialization:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync();
        console.log('✅ App initialization complete');
      }
    }

    prepare();
  }, []);

  if (!appReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <LoadingSpinner text="Starting Iyaya..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <ProfileDataProvider>
            <PrivacyProvider>
              {/* Wrap with FirebaseAuthProvider to ensure proper initialization order */}
              <FirebaseAuthProvider>
                <MessagingProvider>
                  <NotificationProvider>
                    <AppIntegration>
                      <AppNavigator />
                      <StatusBar style="auto" />
                    </AppIntegration>
                  </NotificationProvider>
                </MessagingProvider>
              </FirebaseAuthProvider>
            </PrivacyProvider>
          </ProfileDataProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}