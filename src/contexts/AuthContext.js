import React, { createContext, useState, useEffect, useContext } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import { auth } from '../config/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
  updateProfile
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { validator } from '../utils/validator';

// Initialize auth persistence
const PERSISTENCE_KEY = 'AUTH_STATE';
const TOKEN_KEY = 'AUTH_TOKEN';

// Platform-safe storage wrapper
const storage = {
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        return;
      } catch {
        return;
      }
    }
    return await SecureStore.setItemAsync(key, value);
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        return;
      } catch {
        return;
      }
    }
    return await SecureStore.deleteItemAsync(key);
  },
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  
  // Configure Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_GOOGLE_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  // Configure Facebook Auth
  const [facebookRequest, facebookResponse, promptAsyncFacebook] = Facebook.useAuthRequest({
    clientId: 'YOUR_FACEBOOK_APP_ID',
  });

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      handleSocialSignIn(credential);
    }
  }, [response]);

  // Handle Facebook auth response
  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      const { access_token } = facebookResponse.params;
      const credential = FacebookAuthProvider.credential(access_token);
      handleSocialSignIn(credential);
    }
  }, [facebookResponse]);

  // Web-only: complete redirect-based sign-in on page load/refresh
  useEffect(() => {
    const completeRedirect = async () => {
      if (Platform.OS !== 'web') return;
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const { isNewUser } = getAdditionalUserInfo(result) || {};
          if (isNewUser) {
            try { await sendEmailVerification(result.user); } catch {}
          }
          setUser(result.user);
          setIsEmailVerified(result.user.emailVerified);
          await persistAuthState(result.user);
        }
      } catch (e) {
        console.warn('Redirect sign-in completion error:', e);
      }
    };
    completeRedirect();
  }, []);

  // Handle social sign in
  const handleSocialSignIn = async (credential) => {
    try {
      setLoading(true);
      const result = await signInWithCredential(auth, credential);
      const { isNewUser } = getAdditionalUserInfo(result);
      
      if (isNewUser) {
        // Handle new user registration
        await sendEmailVerification(result.user);
      }
      
      setUser(result.user);
      setIsEmailVerified(result.user.emailVerified);
      await persistAuthState(result.user);
    } catch (error) {
      console.error('Social sign in error:', error);
      setError(error.message || 'Failed to sign in with social account');
    } finally {
      setLoading(false);
    }
  };

  // Persist auth state
  const persistAuthState = async (userData) => {
    try {
      const userJson = JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        emailVerified: userData.emailVerified,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
      });
      
      await storage.setItem(PERSISTENCE_KEY, userJson);
      if (userData.accessToken) {
        await storage.setItem(TOKEN_KEY, userData.accessToken);
      }
    } catch (error) {
      console.error('Error persisting auth state:', error);
    }
  };

  // Load persisted auth state
  const loadPersistedAuthState = async () => {
    try {
      const userJson = await storage.getItem(PERSISTENCE_KEY);
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setIsEmailVerified(userData.emailVerified);
      }
    } catch (error) {
      console.error('Error loading persisted auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;
    
    // Load persisted auth state first
    loadPersistedAuthState();
    
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (mounted) {
          if (currentUser) {
            // Check if email is verified
            await currentUser.reload();
            const updatedUser = auth.currentUser;
            
            setUser(updatedUser);
            setIsEmailVerified(updatedUser.emailVerified);
            await persistAuthState(updatedUser);
          } else {
            // Clear persisted data on sign out
            await storage.deleteItem(PERSISTENCE_KEY);
            await storage.deleteItem(TOKEN_KEY);
            setUser(null);
            setIsEmailVerified(false);
          }
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth state change error:', error);
        if (mounted) {
          setError(error.message || 'Authentication error');
          setLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Login function with validation
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      validator.validateEmail(email);
      validator.validatePassword(password);
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        throw new Error('Please verify your email address. A new verification email has been sent.');
      }
      
      // Update state and persist auth
      setUser(userCredential.user);
      setIsEmailVerified(userCredential.user.emailVerified);
      await persistAuthState(userCredential.user);
      
      return userCredential.user;
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Failed to sign in. Please try again.';
      setError(errorMessage);
      throw err;
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Signup function with validation and email verification
  const signup = async (email, password, userData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate inputs
      validator.validateEmail(email);
      validator.validatePassword(password);
      if (userData?.name) validator.validateName(userData.name);
      if (userData?.phone) validator.validatePhone(userData.phone);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with additional data
      if (userData?.name) {
        await updateProfile(userCredential.user, {
          displayName: userData.name,
          ...(userData.photoURL && { photoURL: userData.photoURL })
        });
      }
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      // Persist auth state
      await persistAuthState(userCredential.user);
      
      return userCredential.user;
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Send password reset email
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate email
      validator.validateEmail(email);
      
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        await promptAsync({ useProxy: true, showInRecents: true });
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google.');
    }
  };
  
  // Sign in with Facebook
  const signInWithFacebook = async () => {
    try {
      if (Platform.OS === 'web') {
        const provider = new FacebookAuthProvider();
        await signInWithRedirect(auth, provider);
      } else {
        await promptAsyncFacebook({ useProxy: true, showInRecents: true });
      }
    } catch (err) {
      console.error('Facebook sign in error:', err);
      setError(err.message || 'Failed to sign in with Facebook.');
    }
  };
  
  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      await SecureStore.deleteItemAsync(PERSISTENCE_KEY);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setUser(null);
      setIsEmailVerified(false);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Check if email is verified
  const checkEmailVerification = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        const updatedUser = auth.currentUser;
        setIsEmailVerified(updatedUser.emailVerified);
        return updatedUser.emailVerified;
      }
      return false;
    } catch (err) {
      console.error('Email verification check error:', err);
      return false;
    }
  };
  
  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Resend verification email error:', err);
      setError(err.message || 'Failed to resend verification email.');
      throw err;
    }
  };

  // The context value that will be provided to descendants
  const value = {
    user,
    loading,
    error,
    isEmailVerified,
    login,
    signup,
    signOut,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    checkEmailVerification,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
