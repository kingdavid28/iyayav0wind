import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { authAPI } from '../services';
import { STORAGE_KEYS } from "../config/constants";
import { firebaseAuthService } from "../services/firebaseAuthService";
import { firebaseRealtimeService } from "../services/firebaseRealtimeService";
import usePushNotifications from '../hooks/usePushNotifications';

// Import safety functions for Firebase initialization - FIXED: Only initialize once
import { getAuthSync, initializeFirebase } from '../config/firebase';

// Global flag to prevent multiple initializations across the app
let globalAuthInitialized = false;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const {
    registerPushTokenForCurrentDevice,
    removePushTokenForCurrentDevice,
  } = usePushNotifications();

  // Normalize user object to ensure consistent property names
  const normalizeUser = (userData) => {
    if (!userData) return null;

    return {
      // Use id consistently (prefer _id from MongoDB if available)
      id: userData._id || userData.id || userData.uid,
      // Preserve all other properties
      ...userData,
      // Ensure we don't have duplicate properties
      _id: undefined,
      uid: undefined,
    };
  };

  // Fetch user profile from backend and sync with Firebase auth
  const fetchUserProfile = async (firebaseUid) => {
    try {
      console.log('🔍 Fetching user profile for Firebase UID:', firebaseUid);

      // Call the backend firebase-profile endpoint
      const response = await authAPI.getFirebaseProfile();

      if (response?.success && response.user) {
        console.log('✅ User profile fetched successfully:', {
          id: response.user._id || response.user.id,
          firebaseUid: response.user.firebaseUid,
          role: response.user.role
        });

        // Normalize the user data
        const normalizedUser = normalizeUser(response.user);

        // Validate UID consistency
        if (firebaseUid && normalizedUser?.id && firebaseUid !== normalizedUser.id) {
          console.warn('⚠️ Firebase UID mismatch detected during profile fetch', {
            firebaseUid,
            apiUserId: normalizedUser.id,
            userRole: normalizedUser.role
          });
        }

        return normalizedUser;
      } else {
        console.warn('⚠️ Profile fetch returned no user data:', response);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error.message);

      // If profile fetch fails, try fallback to /profile endpoint
      try {
        console.log('🔄 Attempting fallback profile fetch...');
        const fallbackResponse = await authAPI.getProfile();

        if (fallbackResponse?.success && fallbackResponse.user) {
          console.log('✅ Fallback profile fetch successful');
          return normalizeUser(fallbackResponse.user);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback profile fetch also failed:', fallbackError.message);
      }

      return null;
    }
  };

  // Validate UID consistency between Firebase and MongoDB
  const validateUidConsistency = (firebaseUid, mongoUserId, context = 'unknown') => {
    if (firebaseUid && mongoUserId && firebaseUid !== mongoUserId) {
      console.warn(`⚠️ Firebase UID mismatch detected in ${context}`, {
        firebaseUid,
        apiUserId: mongoUserId,
        context
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    let unsubscribe = null;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing AuthContext with safety checks...');

        // Only initialize Firebase once globally
        if (!globalAuthInitialized) {
          await initializeFirebase();
          globalAuthInitialized = true;
        }

        // Get auth instance safely
        const auth = getAuthSync();
        console.log('✅ AuthContext: Firebase initialized, setting up listener');

        // Set up auth state listener with error handling
        unsubscribe = firebaseAuthService.onAuthStateChanged(async (user) => {
          console.log('🔐 Auth state changed:', user ? 'User logged in' : 'User logged out');

          if (user && user.emailVerified) {
            try {
              const token = await user.getIdToken();
              await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
              console.log('💾 Token stored in auth listener:', !!token);

              // Get user profile from MongoDB
              const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:5000'}/api/auth/firebase-profile`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              let profile = {};
              if (response.ok) {
                profile = await response.json();
                console.log('🔍 Profile data received in auth listener:', profile);
              } else {
                console.log('❌ Profile fetch failed in auth listener:', response.status);
              }

              const normalizedUser = normalizeUser({
                id: user.uid,
                email: user.email,
                name: user.displayName || profile.name,
                emailVerified: user.emailVerified,
                role: profile.role,
                firstName: profile.firstName,
                lastName: profile.lastName,
                middleInitial: profile.middleInitial,
                phone: profile.phone,
                ...profile
              });
              
              setUser(normalizedUser);

              try {
                const realtimeUser = await firebaseRealtimeService.initializeRealtimeAuth();
                const firebaseUid = realtimeUser?.uid || firebaseAuthService.getCurrentUser()?.uid;
                console.log('🔁 Realtime auth synchronized', {
                  firebaseUid,
                  apiUserId: normalizedUser?.id,
                });
                if (firebaseUid && normalizedUser?.id && firebaseUid !== normalizedUser.id) {
                  console.warn('⚠️ Firebase UID mismatch detected for realtime messaging', {
                    firebaseUid,
                    apiUserId: normalizedUser.id,
                  });
                }
              } catch (realtimeError) {
                console.warn('⚠️ Failed to initialize realtime auth session:', realtimeError?.message || realtimeError);
              }
            } catch (profileError) {
              console.error('❌ Error fetching user profile:', profileError);
              // Fallback to basic user data if profile fetch fails
              const fallbackUser = normalizeUser({
                id: user.uid,
                email: user.email,
                name: user.displayName,
                emailVerified: user.emailVerified,
                role: null
              });
              setUser(fallbackUser);

              try {
                const realtimeUser = await firebaseRealtimeService.initializeRealtimeAuth();
                const firebaseUid = realtimeUser?.uid || firebaseAuthService.getCurrentUser()?.uid;
                console.log('🔁 Realtime auth synchronized (fallback profile)', {
                  firebaseUid,
                  apiUserId: fallbackUser?.id,
                });
              } catch (realtimeError) {
                console.warn('⚠️ Failed to initialize realtime auth session after profile fallback:', realtimeError?.message || realtimeError);
              }
            }
          } else {
            firebaseRealtimeService.resetAuthSession();
            setUser(null);
            await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            console.log('🚪 User logged out or email not verified');
          }

          
          setIsLoading(false);
        });

        setAuthInitialized(true);

      } catch (error) {
        console.error('❌ AuthContext initialization failed:', error);
        setError(error.message);
        setIsLoading(false);
        setAuthInitialized(true); // Mark as initialized anyway to avoid blocking
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    console.log('[AuthContext] push token effect run', {
      authInitialized,
      isLoading,
      hasUser: !!user,
    });
    if (!authInitialized || isLoading) {
      return;
    }
    let cancelled = false;

    const syncPushToken = async () => {
      try {
        if (user) {
          console.log('[AuthContext] registering push token for user', {
            id: user.id,
            role: user.role,
          });
          await registerPushTokenForCurrentDevice();
        } else if (!cancelled) {
          console.log('[AuthContext] removing push token (no user)');
          await removePushTokenForCurrentDevice();
        }
      } catch (error) {
        console.warn('Push token sync failed:', error?.message || error);
      }
    };

    syncPushToken();

    return () => {
      cancelled = true;
    };
  }, [authInitialized, isLoading, user, registerPushTokenForCurrentDevice, removePushTokenForCurrentDevice]);

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
        console.log('💾 Token stored successfully:', !!res.token);
      } else {
        console.log('⚠️ No token in login response');
      }

      // Normalize the user object before setting it
      if (res.user) {
        const normalizedLoginUser = normalizeUser(res.user);
        setUser(normalizedLoginUser);

        try {
          const realtimeUser = await firebaseRealtimeService.initializeRealtimeAuth();
          const firebaseUid = realtimeUser?.uid || firebaseAuthService.getCurrentUser()?.uid;
          console.log('🔁 Realtime auth initialized after login', {
            firebaseUid,
            apiUserId: normalizedLoginUser?.id,
          });
          if (firebaseUid && normalizedLoginUser?.id && firebaseUid !== normalizedLoginUser.id) {
            console.warn('⚠️ Firebase UID mismatch detected immediately after login', {
              firebaseUid,
              apiUserId: normalizedLoginUser.id,
            });
          }
        } catch (realtimeError) {
          console.warn('⚠️ Failed to initialize realtime auth immediately after login:', realtimeError?.message || realtimeError);
        }
      } else {
        // No user data in response, try to fetch from backend
        console.log('🔍 No user data in login response, fetching profile...');
        try {
          const firebaseUser = firebaseAuthService.getCurrentUser();
          if (firebaseUser?.uid) {
            const profileUser = await fetchUserProfile(firebaseUser.uid);
            if (profileUser) {
              setUser(profileUser);
              console.log('✅ Profile fetched and user set after login');
            } else {
              console.warn('⚠️ Could not fetch user profile after login');
            }
          }
        } catch (profileError) {
          console.error('❌ Profile fetch failed after login:', profileError.message);
        }
      }

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

  // Facebook login method
  const loginWithFacebook = async (facebookResult) => {
    try {
      setIsLoading(true);
      setError(null);
      setHasLoggedOut(false);

      console.log('🔐 Processing Facebook login result:', facebookResult);

      // Store the token if available
      if (facebookResult?.token) {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, facebookResult.token);
        console.log('💾 Facebook token stored successfully');
      }

      // Normalize and set the user
      if (facebookResult.user) {
        const normalizedUser = normalizeUser(facebookResult.user);
        setUser(normalizedUser);
        console.log('✅ Facebook user set in context:', normalizedUser);

        try {
          const realtimeUser = await firebaseRealtimeService.initializeRealtimeAuth();
          const firebaseUid = realtimeUser?.uid || firebaseAuthService.getCurrentUser()?.uid;
          console.log('🔁 Realtime auth initialized after Facebook login', {
            firebaseUid,
            apiUserId: normalizedUser?.id,
          });
          if (firebaseUid && normalizedUser?.id && firebaseUid !== normalizedUser.id) {
            console.warn('⚠️ Firebase UID mismatch detected after Facebook login', {
              firebaseUid,
              apiUserId: normalizedUser.id,
            });
          }
        } catch (realtimeError) {
          console.warn('⚠️ Failed to initialize realtime auth after Facebook login:', realtimeError?.message || realtimeError);
        }
      } else {
        // No user data in Facebook response, try to fetch from backend
        console.log('🔍 No user data in Facebook response, fetching profile...');
        try {
          const firebaseUser = firebaseAuthService.getCurrentUser();
          if (firebaseUser?.uid) {
            const profileUser = await fetchUserProfile(firebaseUser.uid);
            if (profileUser) {
              setUser(profileUser);
              console.log('✅ Profile fetched and user set after Facebook login');
            } else {
              console.warn('⚠️ Could not fetch user profile after Facebook login');
            }
          }
        } catch (profileError) {
          console.error('❌ Profile fetch failed after Facebook login:', profileError.message);
        }
      }

      return { success: true, user: facebookResult.user };
    } catch (err) {
      console.log('❌ Facebook login error:', err.message);
      const errorMessage = err?.message || "Facebook login failed";
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

  // Safe sign out function with Firebase safety checks
  const signOut = async () => {
    try {
      console.log('🚪 Starting Firebase signOut with safety checks...');
      setIsLoading(true);

      // Use Firebase auth service which has safety checks
      await firebaseAuthService.signOut();
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);

      setUser(null);
      setError(null);
      setHasLoggedOut(true);
      console.log('✅ Firebase signOut completed');
      await removePushTokenForCurrentDevice();
      firebaseRealtimeService.resetAuthSession();
    } catch (err) {
      console.log('❌ Logout error:', err);
      throw err;
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
        // Normalize the user object before setting it
        setUser(normalizeUser(userData));
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

  const value = {
    user,
    loading: isLoading || !authInitialized, // Include auth initialization state
    error,
    login,
    loginWithFacebook,
    signup,
    signOut,
    resetPassword,
    verifyEmailToken,
    fetchUserProfile, // Expose for other components to use
    // Safe current user getter
    getCurrentUser: () => {
      try {
        return firebaseAuthService.getCurrentUser();
      } catch (error) {
        console.error('❌ Get current user error:', error);
        return null;
      }
    }
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