import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Platform, Text, View, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Providers
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { MessagingProvider } from "./src/contexts/MessagingContext";
import { useThemeContext } from "./src/contexts/ThemeContext";
import AppProvider from "./src/providers/AppProvider";
import PrivacyProvider from "./src/components/Privacy/PrivacyManager";
import ProfileDataProvider from "./src/components/Privacy/ProfileDataManager";

// Screens
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

// Development mode setup
if (__DEV__) {
  console.log('🚀 Development mode enabled');
}

// Only ignore specific warnings, not errors
LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "Setting a timer",
  "Non-serializable values",
]);

// Don't ignore these - we want to see them:
// "Require cycle:", "Image load error", "defaultSource"

SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();

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

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        console.log('Initializing app...');
        
        // App initialization complete
        
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppProvider>
          <ProfileDataProvider>
            <PrivacyProvider>
              <AuthProvider>
                <MessagingProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </MessagingProvider>
              </AuthProvider>
            </PrivacyProvider>
          </ProfileDataProvider>
        </AppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}