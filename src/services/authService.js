import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth"
import { auth } from "../config/firebase"
import { logger } from "../utils/logger"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { STORAGE_KEYS } from "../config/constants"

class AuthService {
  // Authentication Methods
  async login(email, password) {
    try {
      logger.info("Attempting login for:", email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      
      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email)
      
      logger.info("Login successful")
      return { user: userCredential.user, token }
    } catch (error) {
      logger.error("Login failed:", error)
      throw this.handleAuthError(error)
    }
  }

  async register(userData) {
    try {
      const { email, password, name } = userData
      logger.info("Attempting registration for:", email)

      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      logger.info("Registration successful")

      return { user: userCredential.user, profile: { name, email } }
    } catch (error) {
      logger.error("Registration failed:", error)
      throw this.handleAuthError(error)
    }
  }

  async logout() {
    try {
      console.log("🚪 AuthService: Starting logout...")
      
      // Clear all auth data first
      await this.clearAuthData()

      // Then sign out from Firebase
      const user = auth.currentUser
      if (user) {
        console.log("👤 Current user:", user.email)
        await signOut(auth)
        console.log("✅ Firebase signOut completed")
      } else {
        console.log("ℹ️ No user currently signed in")
      }

      logger.info("Logout successful")
    } catch (error) {
      console.error("❌ AuthService logout error:", error.message || JSON.stringify(error));
      logger.error("Logout failed:", error)

      // Don't throw error - allow logout to continue
      // throw this.handleAuthError(error)
    }
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      logger.info("Password reset email sent")
    } catch (error) {
      logger.error("Password reset failed:", error)
      throw this.handleAuthError(error)
    }
  }

  // Auth State Management
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  }

  getCurrentUser() {
    return auth.currentUser
  }

  async getCurrentToken() {
    try {
      // First try to get token from storage
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      if (storedToken) {
        // Verify token is still valid
        try {
          // Simple check if token is a valid JWT
          if (storedToken.split('.').length === 3) {
            return storedToken
          }
        } catch (e) {
          console.log('Invalid token format, will refresh')
        }
      }

      // If no stored token or invalid, try to get fresh one
      const user = auth.currentUser
      if (user) {
        const token = await user.getIdToken(true) // Force refresh
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
        return token
      }
      
      return null
    } catch (error) {
      logger.error("Error getting token:", error)
      await this.clearAuthData()
      return null
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL)
    } catch (error) {
      logger.error("Error clearing auth data:", error)
    }
  }

  // Add refreshToken method to avoid errors
  async refreshToken() {
    try {
      const user = auth.currentUser
      if (!user) throw new Error("No user logged in")
      return await user.getIdToken(true) // Force refresh
    } catch (error) {
      logger.error("Failed to refresh token:", error)
      throw error
    }
  }

  // Error Handling
  handleAuthError(error) {
    const errorMap = {
      "auth/user-not-found": "No account found with this email address",
      "auth/wrong-password": "Incorrect password",
      "auth/email-already-in-use": "An account with this email already exists",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/invalid-email": "Invalid email address",
    }

    const message = errorMap[error.code] || error.message || "Authentication failed"
    return new Error(message)
  }
}

export const authService = new AuthService()
