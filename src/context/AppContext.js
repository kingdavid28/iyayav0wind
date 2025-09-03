"use client"

import { createContext, useContext, useReducer, useEffect, useRef } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { STORAGE_KEYS } from "../config/constants"
import { authService } from "../services/authService"
import { userService } from "../services/userService"
import { logger } from "../utils/logger"
import { Alert } from "react-native"
import jobService from '../services/jobService';
import { useAuth } from "../contexts/AuthContext"

// Initial State
const initialState = {
  // Auth State
  user: null,
  userProfile: null,
  isAuthenticated: false,
  authLoading: true,

  // App State
  isOnboardingComplete: false,
  currentRoute: null,
  networkStatus: "online",

  // UI State
  theme: "light",
  language: "en",
  notifications: [],

  // Data State
  jobs: [],
  nannies: [],
  applications: [],
  messages: [],
  bookings: [],

  // Loading States
  loading: {
    jobs: false,
    nannies: false,
    applications: false,
    messages: false,
    profile: false,
    auth: false,
  },

  // Error States
  errors: {
    auth: null,
    network: null,
    validation: null,
    general: null,
  },
}

// Normalize backend role naming to what the app expects
const normalizeRole = (role) => (role === 'client' ? 'parent' : role)

// Action Types
export const ACTION_TYPES = {
  // Auth Actions
  SET_AUTH_LOADING: "SET_AUTH_LOADING",
  SET_USER: "SET_USER",
  SET_USER_PROFILE: "SET_USER_PROFILE",
  LOGOUT: "LOGOUT",

  // App Actions
  SET_ONBOARDING_COMPLETE: "SET_ONBOARDING_COMPLETE",
  SET_CURRENT_ROUTE: "SET_CURRENT_ROUTE",
  SET_NETWORK_STATUS: "SET_NETWORK_STATUS",

  // UI Actions
  SET_THEME: "SET_THEME",
  SET_LANGUAGE: "SET_LANGUAGE",
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  REMOVE_NOTIFICATION: "REMOVE_NOTIFICATION",

  // Data Actions
  SET_JOBS: "SET_JOBS",
  SET_NANNIES: "SET_NANNIES",
  SET_APPLICATIONS: "SET_APPLICATIONS",
  SET_MESSAGES: "SET_MESSAGES",
  SET_BOOKINGS: "SET_BOOKINGS",

  // Loading Actions
  SET_LOADING: "SET_LOADING",

  // Error Actions
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
  CLEAR_ALL_ERRORS: "CLEAR_ALL_ERRORS",
}

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_AUTH_LOADING:
      return { ...state, authLoading: action.payload }

    case ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        authLoading: false,
      }

    case ACTION_TYPES.SET_USER_PROFILE:
      return { ...state, userProfile: action.payload }

    case ACTION_TYPES.LOGOUT:
      return {
        ...initialState,
        authLoading: false,
        theme: state.theme,
        language: state.language,
        isOnboardingComplete: state.isOnboardingComplete, // Preserve onboarding state
      }

    case ACTION_TYPES.SET_ONBOARDING_COMPLETE:
      return { ...state, isOnboardingComplete: action.payload }

    case ACTION_TYPES.SET_CURRENT_ROUTE:
      return { ...state, currentRoute: action.payload }

    case ACTION_TYPES.SET_NETWORK_STATUS:
      return { ...state, networkStatus: action.payload }

    case ACTION_TYPES.SET_THEME:
      return { ...state, theme: action.payload }

    case ACTION_TYPES.SET_LANGUAGE:
      return { ...state, language: action.payload }

    case ACTION_TYPES.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      }

    case ACTION_TYPES.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      }

    case ACTION_TYPES.SET_JOBS:
      return { ...state, jobs: action.payload }

    case ACTION_TYPES.SET_NANNIES:
      return { ...state, nannies: action.payload }

    case ACTION_TYPES.SET_APPLICATIONS:
      return { ...state, applications: action.payload }

    case ACTION_TYPES.SET_MESSAGES:
      return { ...state, messages: action.payload }

    case ACTION_TYPES.SET_BOOKINGS:
      return { ...state, bookings: action.payload }

    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }, // Fixed structure
      }

    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.value }, // Fixed structure
      }

    case ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        errors: { ...state.errors, [action.payload]: null }, // Simplified
      }

    case ACTION_TYPES.CLEAR_ALL_ERRORS:
      return {
        ...state,
        errors: initialState.errors, // Use initial state
      }

    default:
      return state
  }
}

// Context
const AppContext = createContext()

// Provider Component
const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)
  // Dev-only toggle to allow auto-mock auth in Expo Go / dev
  const ALLOW_UNVERIFIED = (process?.env?.EXPO_PUBLIC_ALLOW_UNVERIFIED === 'true') || (__DEV__ === true)
  // New: explicit flag to enable/disable dev auto-mock login
  const DEV_AUTOMOCK = (process?.env?.EXPO_PUBLIC_DEV_AUTOMOCK === 'true')
  const devMockApplied = useRef(false)
  // Bridge: consume JWT-based auth from AuthContext
  const { user: authUser, loading: authLoading } = useAuth()

  // Helper function for error handling
  const handleError = (key, error) => {
    logger.error(`Error in ${key}:`, error)
    dispatch({
      type: ACTION_TYPES.SET_ERROR,
      payload: {
        key,
        value: error.message || "An unknown error occurred",
      },
    })
  }

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp()
      } catch (error) {
        handleError("general", error)
      }
    }
    init()
  }, [])

  // Mirror AuthContext user into AppContext so isAuthenticated aligns with JWT auth
  useEffect(() => {
    if (authLoading) return
    if (authUser) {
      const normalized = authUser?.role ? { ...authUser, role: normalizeRole(authUser.role) } : authUser
      dispatch({ type: ACTION_TYPES.SET_USER, payload: normalized })
      dispatch({ type: ACTION_TYPES.SET_USER_PROFILE, payload: normalized })
    } else {
      // When JWT auth signs out, reflect here as well
      dispatch({ type: ACTION_TYPES.LOGOUT })
    }
  }, [authUser, authLoading])

  // Dev-only: Auto-mock user to unblock navigation in Expo Go when allowed
  useEffect(() => {
    if (devMockApplied.current) return
    // Only apply auto-mock when explicitly enabled
    if (!DEV_AUTOMOCK) return
    if (!ALLOW_UNVERIFIED) return
    if (state.isAuthenticated) return

    const mockUser = {
      uid: "dev-mock-uid",
      email: "dev@example.com",
      displayName: "Dev User",
    }
    dispatch({ type: ACTION_TYPES.SET_USER, payload: mockUser })
    dispatch({ type: ACTION_TYPES.SET_USER_PROFILE, payload: { uid: mockUser.uid, role: "parent", name: mockUser.displayName } })
    devMockApplied.current = true
  }, [DEV_AUTOMOCK, ALLOW_UNVERIFIED, state.isAuthenticated])

  const initializeApp = async () => {
    try {
      // Load persisted data
      await loadPersistedData()

      // Initialize auth listener
      return initializeAuthListener()
    } catch (error) {
      handleError("general", error)
      throw error
    }
  }

  const loadPersistedData = async () => {
    try {
      const [onboardingComplete, theme, language] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE),
        AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE_PREFERENCE),
      ])

      dispatch({
        type: ACTION_TYPES.SET_ONBOARDING_COMPLETE,
        payload: onboardingComplete === "true",
      })

      if (theme) {
        dispatch({ type: ACTION_TYPES.SET_THEME, payload: theme })
      }

      if (language) {
        dispatch({ type: ACTION_TYPES.SET_LANGUAGE, payload: language })
      }
    } catch (error) {
      logger.error("Failed to load persisted data:", error)
    }
  }

  const initializeAuthListener = () => {
    // If AuthContext is managing JWT auth, skip Firebase-style listener
    if (authUser) {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: false })
      return () => {}
    }
    return authService.onAuthStateChanged(async (user) => {
      try {
        dispatch({ type: ACTION_TYPES.SET_USER, payload: user })

        // Only fetch profile if user is present, token exists, and profile is not loaded or is for a different user
        const token = await authService.getCurrentToken();
        if (user && token && (!state.userProfile || state.userProfile.uid !== user.uid)) {
          try {
            const profile = await userService.getProfile(user.uid)
            const normalizedProfile = profile ? { ...profile, role: normalizeRole(profile.role) } : null
            dispatch({ type: ACTION_TYPES.SET_USER_PROFILE, payload: normalizedProfile })
            // Merge role and name into user for downstream consumers (Navigator, jobService)
            if (normalizedProfile) {
              const mergedUser = { ...user, role: normalizedProfile.role, displayName: normalizedProfile.name }
              dispatch({ type: ACTION_TYPES.SET_USER, payload: mergedUser })
            }
          } catch (error) {
            logger.warn("Failed to load user profile:", error)
            dispatch({ type: ACTION_TYPES.SET_USER_PROFILE, payload: null })
          }
        }
      } catch (error) {
        handleError("auth", error)
      }
    })
  }

  // Action Creators
  const actions = {
    login: async (email, password) => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "auth", value: true },
        })
        dispatch({ type: ACTION_TYPES.CLEAR_ERROR, payload: "auth" })

        const result = await authService.login(email, password)
        // Immediately set user so UI can react (Expo Go shim may not re-emit auth state)
        if (result?.user) {
          dispatch({ type: ACTION_TYPES.SET_USER, payload: result.user })
        }
        return result.user
      } catch (error) {
        handleError("auth", error)
        throw error
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "auth", value: false },
        })
      }
    },

    register: async (userData) => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "auth", value: true },
        })
        dispatch({ type: ACTION_TYPES.CLEAR_ERROR, payload: "auth" })

        const result = await authService.register(userData)
        // Set user immediately on successful registration
        if (result?.user) {
          dispatch({ type: ACTION_TYPES.SET_USER, payload: result.user })
        }

        try {
          await userService.createProfile(result.user.uid, {
            name: userData.name,
            email: userData.email,
            role: userData.role || "parent",
          })
        } catch (profileError) {
          logger.warn("Failed to create backend profile:", profileError)
        }

        return result
      } catch (error) {
        handleError("auth", error)
        throw error
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "auth", value: false },
        })
      }
    },

    logout: async () => {
      try {
        dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: true })

        await authService.logout()
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER_TOKEN,
          STORAGE_KEYS.USER_PROFILE,
        ])

        dispatch({ type: ACTION_TYPES.LOGOUT })
      } catch (error) {
        logger.error("Logout error:", error)
        dispatch({ type: ACTION_TYPES.LOGOUT })
        Alert.alert("Logout", "Signed out successfully")
      } finally {
        dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: false })
      }
    },

    setMockUser: () => {
      const mockUser = {
        uid: "mock-user-123",
        email: "test@example.com",
        displayName: "Test User",
      }
      dispatch({ type: ACTION_TYPES.SET_USER, payload: mockUser })
    },

    // Booking Actions
    loadBookings: async () => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "bookings", value: true },
        });
        if (!state.user || !state.user.role) {
          Alert.alert('Error', 'User is not loaded or missing role. Please log in again.');
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { error: 'User not loaded or missing role' } });
          return;
        }
        const token = await authService.getCurrentToken();
        const bookings = await require('../services/bookingService').getBookings(state.user.role, token);
        dispatch({
          type: ACTION_TYPES.SET_BOOKINGS,
          payload: bookings,
        });
        return bookings;
      } catch (error) {
        handleError("general", error);
        throw error;
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "bookings", value: false },
        });
      }
    },

    // Job Actions
    loadJobs: async (filters = {}) => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "jobs", value: true },
        });
        // Ensure jobService is imported at the top
        console.log('[AppContext] loadJobs: user =', state.user, 'role =', state.user?.role);
        if (!state.user || !state.user.role) {
          Alert.alert('Error', 'User is not loaded or missing role. Please log in again.');
          dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { error: 'User not loaded or missing role' } });
          return;
        }
        const jobs = await jobService.getJobs(state.user.role, state.token);
        dispatch({
          type: ACTION_TYPES.SET_JOBS,
          payload: jobs,
        });
        return jobs;
      } catch (error) {
        handleError("general", error);
        throw error;
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "jobs", value: false },
        });
      }
    },

    updateChildren: async (children) => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "profile", value: true },
        });
        const result = await userService.updateChildren(children);
        // Update userProfile in state
        dispatch({
          type: ACTION_TYPES.SET_USER_PROFILE,
          payload: result?.data ? { ...result.data, role: normalizeRole(result.data.role) } : result.data,
        });
        return result.data;
      } catch (error) {
        handleError("general", error);
        throw error;
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "profile", value: false },
        });
      }
    },

    updateProfile: async (profileData) => {
      try {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "profile", value: true },
        })

        if (!state.user) {
          throw new Error("No authenticated user")
        }

        let updatedProfile
        if (state.userProfile) {
          updatedProfile = await userService.updateProfile(
            state.user.uid,
            profileData
          )
        } else {
          updatedProfile = await userService.createProfile(state.user.uid, {
            ...profileData,
            email: state.user.email,
          })
        }

        dispatch({
          type: ACTION_TYPES.SET_USER_PROFILE,
          payload: updatedProfile ? { ...updatedProfile, role: normalizeRole(updatedProfile.role) } : updatedProfile,
        })
        return updatedProfile
      } catch (error) {
        handleError("general", error)
        throw error
      } finally {
        dispatch({
          type: ACTION_TYPES.SET_LOADING,
          payload: { key: "profile", value: false },
        })
      }
    },
  }

  const value = { state, dispatch, actions }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// Hook
const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within AppProvider")
  }
  return context
}

export { AppProvider, useApp }
export default AppContext