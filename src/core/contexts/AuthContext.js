import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { authAPI } from "../../../services/index";
import { STORAGE_KEYS } from "../../config/constants";
import { firebaseAuthService } from "../../services/firebaseAuthService";

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      if (hasLoggedOut) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Check Firebase auth state
      const currentUser = firebaseAuthService.getCurrentUser();
      if (currentUser && currentUser.emailVerified) {
        const token = await currentUser.getIdToken(true); // Force refresh
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        
        // Get user profile from MongoDB
        try {
          const response = await fetch(`${API_URL}/api/auth/firebase-profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          let profile = { role: 'parent' };
          if (response.ok) {
            profile = await response.json();
            console.log('🔍 Profile data received in checkAuthStatus:', profile);
          } else {
            console.log('❌ Profile fetch failed in checkAuthStatus:', response.status);
          }
          
          setUser({
            id: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName || profile.name,
            emailVerified: currentUser.emailVerified,
            role: profile.role || 'parent',
            firstName: profile.firstName,
            lastName: profile.lastName,
            middleInitial: profile.middleInitial,
            birthDate: profile.birthDate,
            phone: profile.phone,
            profileImage: profile.profileImage,
            address: profile.address,
            children: profile.children,
            caregiverProfile: profile.caregiverProfile
          });
        } catch (error) {
          console.warn('Failed to get profile:', error.message);
          setUser({
            id: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName,
            emailVerified: currentUser.emailVerified,
            role: 'parent'
          });
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.log("Auth check error:", e.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set up Firebase auth state listener
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user) => {
      if (user && user.emailVerified) {
        const token = await user.getIdToken(true); // Force refresh
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        
        // Get user profile from MongoDB
        try {
          const response = await fetch(`${API_URL}/api/auth/firebase-profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          let profile = { role: 'parent' };
          if (response.ok) {
            profile = await response.json();
            console.log('🔍 Profile data received in auth listener:', profile);
          } else {
            console.log('❌ Profile fetch failed in auth listener:', response.status);
          }
          
          setUser({
            id: user.uid,
            email: user.email,
            name: user.displayName || profile.name,
            emailVerified: user.emailVerified,
            role: profile.role || 'parent',
            firstName: profile.firstName,
            lastName: profile.lastName,
            middleInitial: profile.middleInitial,
            birthDate: profile.birthDate,
            phone: profile.phone,
            profileImage: profile.profileImage,
            address: profile.address,
            children: profile.children,
            caregiverProfile: profile.caregiverProfile
          });
        } catch (error) {
          console.warn('Failed to get profile:', error.message);
          setUser({
            id: user.uid,
            email: user.email,
            name: user.displayName,
            emailVerified: user.emailVerified,
            role: 'parent'
          });
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasLoggedOut(false);
      
      console.log('🔐 Attempting Firebase login with:', { email });
      const res = await firebaseAuthService.login(email, password);
      console.log('✅ Firebase login successful:', res);
      
      if (res?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
        console.log('💾 Token stored successfully');
      }
      
      setUser(res.user);
      return { success: true, user: res.user };
    } catch (err) {
      console.log('❌ Login error:', err.message);
      const errorMessage = err?.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasLoggedOut(false);
      
      console.log('🚀 Starting Firebase signup for:', userData.email);
      
      const res = await firebaseAuthService.signup(userData);
      console.log('✅ Firebase signup successful:', res);
      
      return res;
    } catch (err) {
      console.error('❌ Signup error:', err.message);
      const errorMessage = err?.message || "Signup failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting Firebase signOut...');
      setIsLoading(true);
      
      await firebaseAuthService.signOut();
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      
      setUser(null);
      setError(null);
      setHasLoggedOut(true);
      console.log('✅ Firebase signOut completed');
    } catch (err) {
      console.log('❌ Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmailToken = async (token) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔐 Verifying email token:', token);
      const result = await authAPI.verifyEmail(token);
      console.log('✅ Verification API response:', result);
      
      if (result.success && result.token) {
        // Store the new token
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, result.token);
        console.log('💾 Token stored successfully');
        
        // Use user data from verification response if available
        let userData = result.user;
        
        // If no user data in response, fetch profile
        if (!userData) {
          const profile = await authAPI.getProfile();
          userData = profile?.data || profile;
        }
        
        console.log('👤 Setting user data:', userData);
        setUser(userData);
        return { success: true, user: userData };
      }
      
      throw new Error(result.message || 'Email verification failed');
    } catch (error) {
      console.error('❌ Email verification error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      const result = await firebaseAuthService.resetPassword(email);
      return result;
    } catch (err) {
      const errorMessage = err?.message || "Password reset failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshToken = async () => {
    try {
      const currentUser = firebaseAuthService.getCurrentUser();
      if (currentUser) {
        const token = await currentUser.getIdToken(true); // Force refresh
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading: isLoading,
    error,
    login,
    signup,
    signOut,
    resetPassword,
    checkAuthStatus,
    verifyEmailToken,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;