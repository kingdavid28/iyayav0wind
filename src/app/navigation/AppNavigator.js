import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

// Core imports
import { useAuth } from "../../core/contexts/AuthContext";
import { useThemeContext } from "../../core/contexts/ThemeContext";

// Main screen imports
import WelcomeScreen from "../../screens/WelcomeScreen";
import ParentAuth from "../../screens/ParentAuth";
import CaregiverAuth from "../../screens/CaregiverAuth";
import EmailVerificationScreen from "../../screens/EmailVerificationScreen";
import VerificationSuccessScreen from "../../screens/VerificationSuccessScreen";
import ParentDashboard from "../../screens/ParentDashboard";
import CaregiverDashboard from "../../screens/CaregiverDashboard";

// Legacy screen imports (to be migrated)
import AvailabilityManagementScreen from "../../screens/AvailabilityManagementScreen";
import BookingFlowScreen from "../../screens/BookingManagementScreen";
import BookingManagementScreen from "../../screens/BookingManagementScreen";
import Bookings from "../../screens/BookingManagementScreen";
import ChildrenManagementScreen from "../../screens/ChildrenManagementScreen";
import EnhancedCaregiverProfileWizard from "../../screens/EnhancedCaregiverProfileWizard";
import JobPostingScreen from "../../screens/JobPostingScreen";
import JobSearchScreen from "../../screens/JobSearchScreen";
import MessagingScreen from "../../screens/MessagingScreen";
import MessagesScreen from "../../screens/MessagesScreen";
import OnboardingScreen from "../../screens/OnboardingScreen";
import PaymentConfirmationScreen from "../../screens/PaymentConfirmationScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";
import EmailVerificationPendingScreen from "../../screens/EmailVerificationPendingScreen";
import DeepLinkHandler from "../../components/DeepLinkHandler";
import DemoScreen from "../../screens/DemoScreen";

// Utils
import { hasSeenOnboarding } from "../../utils/onboarding";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();
  const { theme } = useThemeContext();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [navigationRef, setNavigationRef] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const hasSeenOnboardingBefore = await hasSeenOnboarding();
        setShowOnboarding(!hasSeenOnboardingBefore);
      } catch (error) {
        console.error('Error checking onboarding:', error);
        setShowOnboarding(false);
      } finally {
        setOnboardingChecked(true);
      }
    };

    checkOnboarding();
  }, []);

  if (loading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer 
      theme={theme}
      ref={setNavigationRef}
    >
      {navigationRef && <DeepLinkHandler navigation={navigationRef} />}
      <Stack.Navigator
        initialRouteName={
          showOnboarding
            ? "Onboarding"
            : user && user.emailVerified
            ? user.role === "caregiver"
              ? "CaregiverDashboard"
              : "ParentDashboard"
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
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ParentAuth" component={ParentAuth} options={{ title: "Parent Login", headerBackTitle: "Back" }} />
        <Stack.Screen name="CaregiverAuth" component={CaregiverAuth} options={{ title: "Caregiver Login", headerBackTitle: "Back" }} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboard} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Edit Profile", headerBackTitle: "Back" }} />
        <Stack.Screen name="Chat" component={MessagingScreen} options={{ title: "Chat", headerBackTitle: "Back" }} />
        <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} options={{ title: "Confirm Payment", headerBackTitle: "Back" }} />
        <Stack.Screen name="JobPosting" component={JobPostingScreen} options={{ title: "Post a Job", headerBackTitle: "Back" }} />
        <Stack.Screen name="JobSearch" component={JobSearchScreen} options={{ title: "Find Jobs", headerBackTitle: "Back" }} />
        <Stack.Screen name="BookingFlow" component={BookingFlowScreen} options={{ title: "Book Caregiver", headerBackTitle: "Back" }} />
        <Stack.Screen name="BookingManagement" component={BookingManagementScreen} options={{ title: "Manage Bookings", headerBackTitle: "Back" }} />
        <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Messages", headerBackTitle: "Back", headerShown: false }} />
        <Stack.Screen name="Messaging" component={MessagingScreen} options={{ title: "Chat", headerBackTitle: "Back" }} />
        <Stack.Screen name="ChildrenManagement" component={ChildrenManagementScreen} options={{ title: "Manage Children", headerBackTitle: "Back" }} />
        <Stack.Screen name="AvailabilityManagement" component={AvailabilityManagementScreen} options={{ title: "Manage Availability", headerBackTitle: "Back" }} />
        <Stack.Screen name="EnhancedCaregiverProfileWizard" component={EnhancedCaregiverProfileWizard} options={{ title: "Complete Your Profile", headerBackTitle: "Back" }} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} options={{ title: "Verifying Email", headerShown: false }} />
        <Stack.Screen name="VerificationSuccess" component={VerificationSuccessScreen} options={{ title: "Verification Complete", headerShown: false }} />
        <Stack.Screen name="EmailVerificationPending" component={EmailVerificationPendingScreen} options={{ title: "Verify Your Email", headerShown: false }} />
        <Stack.Screen name="Demo" component={DemoScreen} options={{ title: "Component Demo", headerBackTitle: "Back" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;