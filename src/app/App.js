import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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

// Log filter - only show errors and warnings
import '../utils/logFilter';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Utils
import { hasSeenOnboarding } from '../utils/onboarding';

// Development mode setup - logs suppressed

LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "Setting a timer", 
  "Non-serializable values",
]);

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Initializing app...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.error('Error during app initialization:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
        console.log('App initialization complete');
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <LoadingSpinner text="Initializing app..." />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <ProfileDataProvider>
            <PrivacyProvider>
              {/* Wrap AppIntegration with AuthProvider */}
              <AuthProvider>
                <AppIntegration>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </AppIntegration>
              </AuthProvider>
            </PrivacyProvider>
          </ProfileDataProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}