import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, View } from "react-native";

// Screens
import AvailabilityManagementScreen from "../screens/AvailabilityManagementScreen";
import BookingFlowScreen from "../screens/BookingFlowScreen.js.backup";
import BookingManagementScreen from "../screens/BookingManagementScreen";
import { CaregiverAuth } from "../screens/CaregiverAuth";
import CaregiverDashboard from "../screens/CaregiverDashboard";
import CaregiversList from "../screens/CaregiversList";
import ChatScreen from "../screens/ChatScreen";
import Children from "../screens/Children";
import ChildrenManagementScreen from "../screens/ChildrenManagementScreen";
import ConversationsListScreen from "../screens/ConversationsListScreen";
import EnhancedCaregiverProfileWizard from "../screens/EnhancedCaregiverProfileWizard";
import JobPostingScreen from "../screens/JobPostingScreen";
import JobSearchScreen from "../screens/JobSearchScreen";
import Messages from "../screens/Messages";
import MessagingScreen from "../screens/MessagingScreen";
import ParentAuth from "../screens/ParentAuth";
import ParentDashboard from "../screens/ParentDashboard/ParentDashboardScreen";
import PaymentConfirmationScreen from "../screens/PaymentConfirmationScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import WelcomeScreen from "../screens/WelcomeScreen";

// Hooks
import { useApp } from "../contexts/AppContext";
import { useThemeContext } from "../contexts/ThemeContext";
import { useAuth } from "../hooks/useAuth";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { theme } = useThemeContext();
  const { state } = useApp();
  const { user, loading: authLoading } = useAuth();

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Ensure we have a consistent user object
  const normalizedUser = user || null;

  // Determine initial route based on auth state
  const initialRoute = React.useMemo(() => {
    if (!normalizedUser) return "Welcome";
    if (!normalizedUser.role) return "Welcome"; // Fallback if role is not set
    return normalizedUser.role === "caregiver"
      ? "CaregiverDashboard"
      : "ParentDashboard";
  }, [normalizedUser]);

  // Log for debugging (only in development)
  if (__DEV__) {
    console.log("[AppNavigator] Auth state:", {
      hasUser: !!normalizedUser,
      role: normalizedUser?.role,
      initialRoute,
      loading: authLoading,
    });
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerShown: false, // Hide header by default, can be overridden per screen
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
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
          options={{ title: "Parent Login / Signup" }}
        />
        <Stack.Screen
          name="CaregiverAuth"
          component={CaregiverAuth}
          options={{ title: "Caregiver Login / Signup" }}
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
          name="Chat"
          component={ChatScreen}
          options={{ title: "Chat" }}
        />
        <Stack.Screen
          name="Messages"
          component={Messages}
          options={{ title: "Messages" }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="PaymentConfirmation"
          component={PaymentConfirmationScreen}
          options={{ title: "Payment Confirmation" }}
        />
        <Stack.Screen
          name="CaregiversList"
          component={CaregiversList}
          options={{ title: "Find Caregivers" }}
        />
        <Stack.Screen
          name="Children"
          component={Children}
          options={{ title: "My Children" }}
        />
        <Stack.Screen
          name="Bookings"
          component={BookingManagementScreen}
          options={{ title: "My Bookings" }}
        />
        <Stack.Screen
          name="JobPosting"
          component={JobPostingScreen}
          options={{ title: "Post a Job" }}
        />
        <Stack.Screen
          name="JobSearch"
          component={JobSearchScreen}
          options={{ title: "Find Jobs" }}
        />
        <Stack.Screen
          name="BookingFlow"
          component={BookingFlowScreen}
          options={{ title: "Book a Caregiver" }}
        />
        <Stack.Screen
          name="BookingManagement"
          component={BookingManagementScreen}
          options={{ title: "Manage Booking" }}
        />
        <Stack.Screen
          name="Messaging"
          component={MessagingScreen}
          options={{ title: "Messages" }}
        />
        <Stack.Screen
          name="Conversations"
          component={ConversationsListScreen}
          options={{ title: "Conversations" }}
        />
        <Stack.Screen
          name="ChildrenManagement"
          component={ChildrenManagementScreen}
          options={{ title: "Manage Children" }}
        />
        <Stack.Screen
          name="AvailabilityManagement"
          component={AvailabilityManagementScreen}
          options={{ title: "Manage Availability" }}
        />
        <Stack.Screen
          name="CaregiverProfileWizard"
          component={EnhancedCaregiverProfileWizard}
          options={{ title: "Complete Your Profile" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
