import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, LogBox, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Providers
import ErrorBoundary from "./src/components/ErrorBoundary/ErrorBoundary";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext"; // Add this import
import { MessagingProvider } from "./src/contexts/MessagingContext";
import { useThemeContext } from "./src/contexts/ThemeContext";
import AppProvider from "./src/providers/AppProvider";

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

// Suppress specific warnings
LogBox.ignoreLogs([
  "AsyncStorage has been extracted",
  "Setting a timer",
  "Non-serializable values",
  "Require cycle:", // Ignore require cycle warnings
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
        // Pre-load fonts, make any API calls you need to do here
        // await Font.loadAsync(...);

        // Artificially delay for two seconds to simulate a slow loading
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn("Error during app preparation:", e);
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
      <AuthProvider>
        {" "}
        {/* Wrap with AuthProvider */}
        <AppProvider>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <MessagingProvider>
              {/* AppNavigator owns the single NavigationContainer */}
              <AppNavigator />
            </MessagingProvider>
          </SafeAreaProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// App Wrapper with Providers
const App = () => {
  try {
    return <MainApp />;
  } catch (error) {
    console.error("Error in App component:", error);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Error loading the app. Please restart.</Text>
      </View>
    );
  }
};

export default App;
