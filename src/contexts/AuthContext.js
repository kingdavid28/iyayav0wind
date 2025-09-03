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
          const profile = await authAPI.getProfile();
          setUser(profile);
        } catch (e) {
          // Token may be invalid/expired
          console.log("Token invalid, removing from storage");
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          setUser(null);
        }
      }
    } catch (e) {
      setError(e?.message || "Failed to check authentication status");
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
      
      if (res?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
      }
      
      // Always pull latest profile
      const profile = await authAPI.getProfile();
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      const errorMessage = err?.message || "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await authAPI.register(userData);
      
      if (res?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, res.token);
      }
      
      const profile = await authAPI.getProfile();
      setUser(profile);
      return { success: true, user: profile };
    } catch (err) {
      const errorMessage = err?.message || "Signup failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
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