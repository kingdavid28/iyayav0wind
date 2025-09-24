import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Import safety functions for Firebase initialization
import { getAuthSync, initializeFirebase } from '../config/firebase';

export const refreshToken = async () => {
  try {
    // Ensure Firebase is initialized
    await initializeFirebase();

    const auth = getAuthSync();
    const user = auth.currentUser;

    if (!user) {
      console.log('No user authenticated - returning null silently');
      return null;
    }

    // Your token refresh logic here
    const token = await user.getIdToken(true);
    return token;

  } catch (error) {
    console.warn('Token refresh failed:', error.message);
    return null;
  }
};

export const getCurrentUser = () => {
  try {
    const auth = getAuthSync();
    return auth.currentUser;
  } catch (error) {
    console.warn('Get current user failed:', error.message);
    return null;
  }
};

export const onAuthStateChangedSafe = (callback) => {
  try {
    const auth = getAuthSync();
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error(' onAuthStateChanged failed:', error);
    // Return a dummy unsubscribe function
    return () => {};
  }
};

export const firebaseAuthService = {
  async signup(userData) {
    let user;
    try {
      const { email, password, name, role } = userData;

      // Ensure Firebase is initialized
      await initializeFirebase();
      const auth = getAuthSync();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send Firebase verification email
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Firebase signup error:', error);
      throw error;
    }

    // Sync complete profile with MongoDB
    try {
      const token = await user.getIdToken();
      const profileData = {
        firebaseUid: user.uid,
        email: user.email,
        name: user.displayName,
        firstName: userData.firstName,
        lastName: userData.lastName,
        middleInitial: userData.middleInitial,
        birthDate: userData.birthDate,
        phone: userData.phone,
        role: userData.role || 'parent',
        emailVerified: user.emailVerified
      };

      await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:5000'}/api/auth/firebase-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
    } catch (error) {
      console.warn('Failed to sync with MongoDB:', error.message);
    }

    return {
      success: true,
      requiresVerification: !user.emailVerified,
      message: 'Account created successfully. Please check your email to verify your account.'
    };
  },

  async login(email, password) {
    try {
      // Ensure Firebase is initialized
      await initializeFirebase();
      const auth = getAuthSync();

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        throw new Error('Please verify your email before logging in.');
      }

      const token = await user.getIdToken();

      // Get complete user profile from MongoDB
      let profile = { role: 'parent' };
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.9:5000'}/api/auth/firebase-profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          profile = await response.json();
        }
      } catch (error) {
        console.warn('Failed to get MongoDB profile:', error.message);
      }

      return {
        success: true,
        token,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          emailVerified: user.emailVerified,
          role: profile.role || 'parent',
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          profileImage: profile.profileImage,
          caregiverProfile: profile.caregiverProfile
        }
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      // Ensure Firebase is initialized
      await initializeFirebase();
      const auth = getAuthSync();

      await signOut(auth);
    } catch (error) {
      console.error('Firebase signOut error:', error);
      throw error;
    }
  },

  async resetPassword(email) {
    try {
      // Ensure Firebase is initialized
      await initializeFirebase();
      const auth = getAuthSync();

      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset link sent to your email.'
      };
    } catch (error) {
      console.error('Firebase resetPassword error:', error);
      throw error;
    }
  },

  // Safe current user getter
  getCurrentUser() {
    try {
      const auth = getAuthSync();
      return auth.currentUser;
    } catch (error) {
      console.error(' Get current user failed:', error);
      return null;
    }
  },

  // Safe auth state listener
  onAuthStateChanged(callback) {
    try {
      const auth = getAuthSync();
      return onAuthStateChanged(auth, callback);
    } catch (error) {
      console.error(' onAuthStateChanged failed:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }
};