import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { authAPI } from "../config/api";
import { STORAGE_KEYS } from "../config/constants";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
      // Don't auto-login if user has explicitly logged out
      if (hasLoggedOut) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        try {
          // Add timeout for mobile network issues
          const profilePromise = authAPI.getProfile();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout')), 8000)
          );
          
          const profile = await Promise.race([profilePromise, timeoutPromise]);
          
          // Handle different response structures
          if (profile?.data) {
            setUser(profile.data);
          } else if (profile) {
            setUser(profile);
          } else {
            throw new Error('Invalid profile response');
          }
        } catch (e) {
          // Only process non-empty errors
          if (e && (typeof e !== 'object' || Object.keys(e).length > 0)) {
            console.log("Token invalid or network timeout, removing from storage:", e.message);
            // Don't set error for network timeouts - just continue without auth
            if (!e.message?.includes('timeout') && !e.message?.includes('Authentication required') && !e.message?.includes('No auth token found')) {
              setError(e?.message || "Authentication check failed");
            }
          }
          // Clear invalid token
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          setUser(null);
          // If user was deleted, prevent auto-retry
          if (e?.message === 'User no longer exists') {
            setHasLoggedOut(true);
          }
        }
      } else {
        // No token found, user is not authenticated
        setUser(null);
      }
    } catch (e) {
      // Only process non-empty errors
      if (e && (typeof e !== 'object' || Object.keys(e).length > 0)) {
        console.log("Auth check error:", e.message);
        // Only set error for critical issues, not network problems
        if (!e.message?.includes('timeout') && !e.message?.includes('Network') && !e.message?.includes('No auth token found')) {
          setError(e?.message || "Failed to check authentication status");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasLoggedOut(false);
      
      console.log('🔐 Attempting login with:', { email, baseURL: 'http://192.168.1.10:3000/api' });
      const res = await authAPI.login({ email, password });
      console.log('✅ Login response:', res);
      
      if (res?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
        console.log('Token stored successfully');
      } else {
        throw new Error('No token received from server');
      }
      
      // Always pull latest profile
      const profile = await authAPI.getProfile();
      console.log('Profile loaded:', profile);
      
      // Handle different response structures
      if (profile?.data) {
        setUser(profile.data);
      } else if (profile) {
        setUser(profile);
      } else {
        throw new Error('Invalid profile response');
      }
      return { success: true, user: profile };
    } catch (err) {
      console.log('❌ Login error details:', {
        message: err?.message,
        status: err?.response?.status,
        data: err?.response?.data,
        code: err?.code
      });
      const errorMessage = err?.response?.data?.message || err?.message || "Login failed";
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
      
      const res = await authAPI.register(userData);
      console.log('Signup response:', res);
      
      if (res?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
        console.log('Token stored successfully');
      } else {
        throw new Error('No token received from server');
      }
      
      const profile = await authAPI.getProfile();
      console.log('Profile loaded:', profile);
      
      // Handle different response structures
      if (profile?.data) {
        setUser(profile.data);
      } else if (profile) {
        setUser(profile);
      } else {
        throw new Error('Invalid profile response');
      }
      return { success: true, user: profile };
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || "Signup failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting signOut process...');
      setIsLoading(true);
      
      // Try to call logout API, but don't fail if it doesn't work
      try {
        await authAPI.logout();
        console.log('✅ API logout successful');
      } catch (apiError) {
        console.log('⚠️ API logout failed, continuing with local logout:', apiError.message);
      }
      
    } catch (err) {
      console.log('❌ Logout error:', err);
    } finally {
      // Always clear local storage and user state
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        console.log('✅ Token removed from storage');
      } catch (storageError) {
        console.log('⚠️ Failed to remove token:', storageError);
      }
      
      setUser(null);
      setError(null);
      setHasLoggedOut(true);
      setIsLoading(false);
      console.log('✅ SignOut completed - user cleared');
    }
  };

  const value = {
    user,
    loading: isLoading,
    error,
    login,
    signup,
    signOut,
    checkAuthStatus,
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