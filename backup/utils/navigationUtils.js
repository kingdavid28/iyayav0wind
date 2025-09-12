import { CommonActions } from '@react-navigation/native';

export const navigateToUserDashboard = (navigation, userRole) => {
  const dashboardRoute = userRole === 'parent' ? 'ParentDashboard' : 'CaregiverDashboard';
  
  console.log(`🧭 Navigating to ${dashboardRoute} for role: ${userRole}`);
  
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: dashboardRoute }],
    })
  );
};