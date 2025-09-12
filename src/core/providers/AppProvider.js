import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import { AppProvider as CoreAppProvider } from '../../contexts/AppContext';
import { MessagingProvider } from '../../contexts/MessagingContext';
import PrivacyProvider from '../../components/Privacy/PrivacyManager';
import ProfileDataProvider from '../../components/Privacy/ProfileDataManager';

// Wrapper component to access theme context
const ThemeWrapper = ({ children }) => {
  const { theme } = useThemeContext();
  
  // If theme is not available yet, show a loading indicator
  if (!theme) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  
  return (
    <PaperProvider theme={theme}>
      {children}
    </PaperProvider>
  );
};

export const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <ThemeWrapper>
        <AuthProvider>
          <MessagingProvider>
            <ProfileDataProvider>
              <PrivacyProvider>
                <CoreAppProvider>
                  {children}
                </CoreAppProvider>
              </PrivacyProvider>
            </ProfileDataProvider>
          </MessagingProvider>
        </AuthProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
};

export default AppProvider;
