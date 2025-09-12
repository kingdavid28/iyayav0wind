import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

// Core imports
import AppProvider from '../core/providers/AppProvider';

// Legacy imports (to be migrated)
// import { AuthProvider } from '../core/contexts/AuthContext';
// import { ThemeProvider } from '../core/contexts/ThemeContext';
// import MessagingProvider from '../contexts/MessagingContext';
import PrivacyProvider from '../components/Privacy/PrivacyManager';
import ProfileDataProvider from '../components/Privacy/ProfileDataManager';
import { ErrorBoundary, LoadingSpinner } from '../shared';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Utils
import { hasSeenOnboarding } from '../utils/onboarding';

// Development mode setup
if (__DEV__) {
  console.log('🚀 Development mode enabled');
}

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
          <AppNavigator />
          <StatusBar style="auto" />
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}