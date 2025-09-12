import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../config/api";
import { STORAGE_KEYS } from "../config/constants";
import { logger } from "../utils/logger";

class AuthService {
  // Authentication Methods
  async login(email, password) {
    try {
      logger.info("Attempting login for:", email);
      const res = await authAPI.login({ email, password });
      const token = res?.token;
      if (!token) throw new Error("Login failed: no token returned");

      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);

      logger.info("Login successful");
      // Fetch profile for downstream consumers
      let profile = null;
      try {
        profile = await authAPI.getProfile();
      } catch (error) {
        console.warn('Profile fetch error:', error);
      }
      return { user: profile, token };
    } catch (error) {
      logger.error("Login failed:", error);
      throw this.handleAuthError(error);
    }
  }

  async register(userData) {
    try {
      const { email } = userData;
      logger.info("Attempting registration for:", email);
      const res = await authAPI.register(userData);
      const token = res?.token;
      if (token) await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      let profile = null;
      try {
        profile = await authAPI.getProfile();
      } catch (error) {
        console.warn('Profile fetch error:', error);
      }
      logger.info("Registration successful");
      return { user: profile, token };
    } catch (error) {
      logger.error("Registration failed:", error);
      throw this.handleAuthError(error);
    }
  }

  async logout() {
    try {
      console.log("🚪 AuthService: Starting logout...");

      // Clear all auth data first
      await this.clearAuthData();

      logger.info("Logout successful");
    } catch (error) {
      console.error(
        "❌ AuthService logout error:",
        error.message || JSON.stringify(error)
      );
      logger.error("Logout failed:", error);

      // Don't throw error - allow logout to continue
      // throw this.handleAuthError(error)
    }
  }

  async resetPassword(_email) {
    logger.warn("resetPassword is not implemented for JWT backend");
  }

  // Auth State Management
  onAuthStateChanged(callback) {
    // No Firebase listener; immediately invoke with a simple user object if token exists
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        if (cancelled) return;
        if (token) {
          let profile = null;
          try {
            profile = await authAPI.getProfile();
          } catch (error) {
            console.warn('Profile fetch error:', error);
          }
          callback(profile);
        } else {
          callback(null);
        }
      } catch (error) {
        console.warn('Auth state error:', error);
        callback(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }

  getCurrentUser() {
    return null;
  }

  async getCurrentToken() {
    try {
      // First try to get token from storage
      let storedToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (storedToken) {
        return storedToken;
      }

      return null;
    } catch (error) {
      logger.error("Error getting token:", error);
      await this.clearAuthData();
      return null;
    }
  }

  async clearAuthData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
      // Also clear shim token if present
      try {
        await AsyncStorage.removeItem("@shim_id_token");
      } catch (error) {
        console.warn('Shim token clear error:', error);
      }
    } catch (error) {
      logger.error("Error clearing auth data:", error);
    }
  }

  async refreshToken() {
    return null;
  }

  // Error Handling
  handleAuthError(error) {
    const errorMap = {
      "auth/user-not-found": "No account found with this email address",
      "auth/wrong-password": "Incorrect password",
      "auth/email-already-in-use": "An account with this email already exists",
      "auth/weak-password": "Password should be at least 6 characters",
      "auth/invalid-email": "Invalid email address",
    };

    const code = error?.code || error?.response?.status;
    const message =
      errorMap[code] ||
      error?.response?.data?.message ||
      error?.message ||
      "Authentication failed";
    return new Error(message);
  }
}

export const authService = new AuthService();

export const login = async (email, password) => {
  try {
    const response = await apiService.post(
      "/auth/login",
      { email, password },
      {
        timeout: API_CONFIG.TIMEOUT.AUTH,
        maxRetries: 1, // Only retry once for login
      }
    );
    return response;
  } catch (error) {
    logger.error("Login failed:", {
      error: error.message,
      code: error.code,
      timeout: error.timeout,
    });
    throw error;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get("/auth/profile", {
      timeout: 60000, // 60 second timeout
      retries: 2, // Allow 2 retries
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Get profile API error:", {
      message: error.message,
      code: error.code,
      timeout: error.timeout,
    });

    return {
      success: false,
      error: error.message,
      isTimeout: error.code === "ECONNABORTED",
    };
  }
};
