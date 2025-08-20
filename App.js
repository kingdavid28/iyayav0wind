import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Removed local PaperProvider usage here; it's provided inside AppProvider
import * as SplashScreen from 'expo-splash-screen';

// Providers
import AppProvider from './src/providers/AppProvider';
import { useApp } from './src/context/AppContext';
import { useAuth } from './src/contexts/AuthContext';
import { useThemeContext } from './src/contexts/ThemeContext';
import { MessagingProvider } from './src/contexts/MessagingContext';
import ErrorBoundary from './src/components/ErrorBoundary/ErrorBoundary';
// Temporarily comment out notifications and linking to unblock development
// import * as Notifications from 'expo-notifications';
// import * as Linking from 'expo-linking';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import ParentAuth from './src/screens/ParentAuth';
import { CaregiverAuth } from './src/screens/CaregiverAuth';
import ParentDashboard from './src/screens/ParentDashboard';
import CaregiverDashboard from './src/screens/CaregiverDashboard.js';
import ChatScreen from './src/screens/ChatScreen';
import Messages from './src/screens/Messages';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import PaymentConfirmationScreen from './src/screens/PaymentConfirmationScreen';
import CaregiversList from './src/screens/CaregiversList';
import Children from './src/screens/Children';
import Bookings from './src/screens/Bookings';

// Suppress specific warnings
LogBox.ignoreLogs([
  'AsyncStorage has been extracted',
  'Setting a timer',
  'Non-serializable values',
  'Require cycle:', // Ignore require cycle warnings
]);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();
  const { state } = useApp();
  const role = state?.userProfile?.role || state?.user?.role;

  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // If authenticated but role not yet loaded from AppContext, wait to avoid misrouting
  if (user && !role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        {!user ? (
          // No user logged in
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="ParentAuth" 
              component={ParentAuth} 
              options={{ 
                title: 'Parent Login',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="CaregiverAuth" 
              component={CaregiverAuth} 
              options={{ 
                title: 'Caregiver Login',
                headerBackTitle: 'Back',
              }}
            />
          </>
        ) : (
          // User is logged in: route by role from AppContext
          <>
            {role === 'caregiver' ? (
              <Stack.Screen 
                name="CaregiverDashboard" 
                component={CaregiverDashboard} 
                options={{ headerShown: false }}
              />
            ) : (
              <>
                <Stack.Screen 
                  name="ParentDashboard" 
                  component={ParentDashboard} 
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="Caregivers" 
                  component={CaregiversList} 
                  options={{ title: 'Caregivers' }}
                />
                <Stack.Screen 
                  name="Children" 
                  component={Children} 
                  options={{ title: 'Your Children' }}
                />
                <Stack.Screen 
                  name="Bookings" 
                  component={Bookings} 
                  options={{ title: 'Bookings' }}
                />
              </>
            )}
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ 
                title: 'Edit Profile',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={{ 
                title: 'Chat',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Messages" 
              component={Messages} 
              options={{ 
                title: 'Messages',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="PaymentConfirmation" 
              component={PaymentConfirmationScreen} 
              options={{ 
                title: 'Confirm Payment',
                headerBackTitle: 'Back',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App Component
const MainApp = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        // await Font.loadAsync(...);
        
        // Artificially delay for two seconds to simulate a slow loading
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Error during app preparation:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null; // ⏳ Splash screen stays visible
  }

  return (
    <ErrorBoundary>
      <AppProvider>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <MessagingProvider>
            {/* AppNavigator owns the single NavigationContainer */}
            <AppNavigator />
          </MessagingProvider>
        </SafeAreaProvider>
      </AppProvider>
    </ErrorBoundary>
  );
};

// App Wrapper with Providers
const App = () => {
  try {
    return (
      <MainApp />
    );
  } catch (error) {
    console.error('Error in App component:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading the app. Please restart.</Text>
      </View>
    );
  }
};

export default App;
