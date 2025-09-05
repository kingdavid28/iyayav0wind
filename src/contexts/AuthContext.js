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

  // Check authentication status on app start
  const checkAuthStatus = async () => {
    try {
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
          // Token may be invalid/expired or network timeout
          console.log("Token invalid or network timeout, removing from storage:", e.message);
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          setUser(null);
          
          // Don't set error for network timeouts - just continue without auth
          if (!e.message.includes('timeout') && !e.message.includes('Authentication required')) {
            setError(e?.message || "Authentication check failed");
          }
        }
      }
    } catch (e) {
      console.log("Auth check error:", e.message);
      // Only set error for critical issues, not network problems
      if (!e.message.includes('timeout') && !e.message.includes('Network')) {
        setError(e?.message || "Failed to check authentication status");
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
      
      const res = await authAPI.login({ email, password });
      console.log('Login response:', res);
      
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
      console.error('Login error:', err);
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
      console.error('Signup error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || "Signup failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (err) {
      console.log('Logout error', err);
    } finally {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      setUser(null);
      setIsLoading(false);
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