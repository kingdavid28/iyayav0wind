import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Platform, Text, View, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Providers
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext"; // Add this import
import { MessagingProvider } from "./src/contexts/MessagingContext";
import { useThemeContext } from "./src/contexts/ThemeContext";
import AppProvider from "./src/providers/AppProvider";
import PrivacyProvider from "./src/components/Privacy/PrivacyManager";
import ProfileDataProvider from "./src/components/Privacy/ProfileDataManager";

// Screens (keep your screen imports as they are)
import AvailabilityManagementScreen from "./src/screens/AvailabilityManagementScreen";
import BookingFlowScreen from "./src/screens/BookingManagementScreen";
import BookingManagementScreen from "./src/screens/BookingManagementScreen";
import Bookings from "./src/screens/BookingManagementScreen";
import CaregiverAuth from "./src/screens/CaregiverAuth";
import CaregiverDashboard from "./src/screens/CaregiverDashboard.js";
import CaregiversList from "./src/screens/CaregiversList";
import ChatScreen from "./src/screens/ChatScreen";
import Children from "./src/screens/Children";
import ChildrenManagementScreen from "./src/screens/ChildrenManagementScreen";
import EnhancedCaregiverProfileWizard from "./src/screens/EnhancedCaregiverProfileWizard";
import JobPostingScreen from "./src/screens/JobPostingScreen";
import JobSearchScreen from "./src/screens/JobSearchScreen";
import Messages from "./src/screens/Messages";
import MessagingScreen from "./src/screens/MessagingScreen";
import ParentAuth from "./src/screens/ParentAuth";
import ParentDashboard from "./src/screens/ParentDashboard";
import PaymentConfirmationScreen from "./src/screens/PaymentConfirmationScreen";
import ProfileScreen from "./src/screens/profile/ProfileScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";

// Enhanced error logging for mobile debugging
if (__DEV__) {
  console.log('🚀 App started in development mode');
  
  // Catch all unhandled errors and make them visible
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError('🔴 [MOBILE ERROR]', ...args);
  };
  
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    originalConsoleWarn('🟡 [MOBILE WARN]', ...args);
  };
}

// Suppress specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "Setting a timer",
  "Non-serializable values",
  "Require cycle:", // Ignore require cycle warnings
  "Image load error", // Suppress image loading errors
  "defaultSource", // Suppress iOS defaultSource warnings
]);

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

// Main App Navigator
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();

  // Show loading indicator while auth is initializing
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName={
          user
            ? user.role === "parent"
              ? "ParentDashboard"
              : "CaregiverDashboard"
            : "Welcome"
        }
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.surface,
          },
          headerTintColor: theme.colors.primary,
          headerTitleStyle: {
            fontWeight: "bold",
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ParentAuth"
          component={ParentAuth}
          options={{
            title: "Parent Login",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="CaregiverAuth"
          component={CaregiverAuth}
          options={{
            title: "Caregiver Login",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="ParentDashboard"
          component={ParentDashboard}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CaregiverDashboard"
          component={CaregiverDashboard}
          options={{ headerShown: false }}
        />
        {/* Keep all your other screens as they were */}
        <Stack.Screen
          name="Caregivers"
          component={CaregiversList}
          options={{ title: "Caregivers" }}
        />
        <Stack.Screen
          name="Children"
          component={Children}
          options={{ title: "Your Children" }}
        />
        <Stack.Screen
          name="Bookings"
          component={Bookings}
          options={{ title: "Bookings" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Edit Profile",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{
            title: "Chat",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="PaymentConfirmation"
          component={PaymentConfirmationScreen}
          options={{
            title: "Confirm Payment",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="JobPosting"
          component={JobPostingScreen}
          options={{
            title: "Post a Job",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="JobSearch"
          component={JobSearchScreen}
          options={{
            title: "Find Jobs",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="BookingFlow"
          component={BookingFlowScreen}
          options={{
            title: "Book Caregiver",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="BookingManagement"
          component={BookingManagementScreen}
          options={{
            title: "Manage Bookings",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="Messages"
          component={Messages}
          options={{
            title: "Messages",
            headerBackTitle: "Back",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Messaging"
          component={MessagingScreen}
          options={{
            title: "Chat",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="ChildrenManagement"
          component={ChildrenManagementScreen}
          options={{
            title: "Manage Children",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="AvailabilityManagement"
          component={AvailabilityManagementScreen}
          options={{
            title: "Manage Availability",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="EnhancedCaregiverProfileWizard"
          component={EnhancedCaregiverProfileWizard}
          options={{
            title: "Complete Your Profile",
            headerBackTitle: "Back",
          }}
        />
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
        console.log('🚀 App initialization starting...');
        
        // Check if we're on iOS and handle potential issues
        if (Platform.OS === 'ios') {
          console.log('📱 iOS detected, applying compatibility fixes...');
        }
        
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 500)); // Minimal delay
        
        console.log('✅ App initialization completed');
      } catch (e) {
        console.error('❌ App initialization failed:', e);
        if (Platform.OS === 'ios') {
          Alert.alert('iOS Startup Error', `Failed to initialize app: ${e.message}`);
        }
      } finally {
        // Tell the application to render
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <ProfileDataProvider>
              <PrivacyProvider>
                <MessagingProvider>
                  <AppNavigator />
                </MessagingProvider>
              </PrivacyProvider>
            </ProfileDataProvider>
          </SafeAreaProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// App Wrapper with Error Handling
const App = () => {
  try {
    return <MainApp />;
  } catch (error) {
    console.error("Critical App Error:", error);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          App failed to start
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
          {error?.message || 'Unknown error occurred'}
        </Text>
      </View>
    );
  }
};

export default App;

