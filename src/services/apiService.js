import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_CONFIG, ERROR_CODES } from "../config/constants"
import { authService } from "./authService"
import { logger } from "../utils/logger"

// Make NetInfo optional for web compatibility
let NetInfo
try {
  NetInfo = require("@react-native-netinfo/netinfo").default
} catch (error) {
  // NetInfo not available, will handle gracefully
  NetInfo = null
}

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // Important for cookies/sessions
    })

    this.setupInterceptors()
    this.requestQueue = []
    this.isRefreshing = false
  }

  redirectToLogin() {
    // Clear auth data
    authService.clearAuthData()
    
    // Navigate to login screen if we're in a component
    if (typeof window !== 'undefined') {
      // Using window.location for web
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?session_expired=true'
      }
    } else {
      // For React Native, you might use a navigation service
      console.log('Please implement navigation to login screen')
    }
  }

  setupInterceptors() {
    // Request Interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Skip auth for login/register endpoints
        if (config.url.includes('/auth/')) {
          return config
        }

        // Add auth token
        try {
          const token = await authService.getCurrentToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          } else {
            // No valid token, redirect to login
            this.redirectToLogin()
            return Promise.reject(new Error('No authentication token available'))
          }
        } catch (error) {
          console.error('Error in request interceptor:', error)
          this.redirectToLogin()
          return Promise.reject(error)
        }

        // Add request ID for tracking
        config.metadata = {
          requestId: this.generateRequestId(),
          startTime: Date.now(),
        }

        logger.debug("API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId: config.metadata.requestId,
        })

        return config
      },
      (error) => {
        logger.error("Request interceptor error:", error)
        return Promise.reject(error)
      },
    )

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log successful response
        const { config, status, data } = response
        const responseTime = Date.now() - (config.metadata?.startTime || 0)
        
        logger.info(
          `[${config.method?.toUpperCase() || 'UNKNOWN'}] ${config.url} - ${status} (${responseTime}ms)`,
          { response: data }
        )
        
        return response
      },
      async (error) => {
        const { config, response } = error
        
        // Log error
        if (config) {
          const responseTime = Date.now() - (config.metadata?.startTime || 0)
          logger.error(
            `[${config.method?.toUpperCase() || 'UNKNOWN'}] ${config.url} - ${response?.status || 'NO_RESPONSE'} (${responseTime}ms)`,
            {
              error: error.message,
              response: response?.data,
              stack: error.stack,
            }
          )
        }

        // Handle 401 Unauthorized
        if (response?.status === 401) {
          // If we're already trying to refresh, don't try again
          if (config._retry) {
            this.redirectToLogin()
            return Promise.reject(error)
          }

          // Try to refresh token
          try {
            const token = await authService.refreshToken()
            if (token) {
              // Update auth header and retry the request
              config.headers.Authorization = `Bearer ${token}`
              config._retry = true
              return this.client(config)
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            this.redirectToLogin()
          }
        }

        // Handle token refresh
        if (error.response?.status === 401 && !config._retry) {
          if (this.isRefreshing) {
            return this.addToQueue(config)
          }

          config._retry = true
          this.isRefreshing = true

          try {
            await authService.refreshToken()
            this.processQueue(null)
            // Process all queued requests with the new token
            this.processQueue(null)
            return this.client(config)
          } catch (refreshError) {
            this.processQueue(refreshError)
            await authService.logout()
            throw refreshError
          } finally {
            this.isRefreshing = false
          }
        }

        const processedError = this.processError(error)
        logger.error("API Error:", processedError)

        return Promise.reject(processedError)
      },
    )
  }

  // Request Methods
  async get(url, config = {}) {
    return this.request("GET", url, null, config)
  }

  async post(url, data, config = {}) {
    return this.request("POST", url, data, config)
  }

  async put(url, data, config = {}) {
    return this.request("PUT", url, data, config)
  }

  async patch(url, data, config = {}) {
    return this.request("PATCH", url, data, config)
  }

  async delete(url, config = {}) {
    return this.request("DELETE", url, null, config)
  }

  async request(method, url, data, config = {}) {
    try {
      // Check network connectivity if NetInfo is available
      if (NetInfo) {
        const netInfo = await NetInfo.fetch()
        if (!netInfo.isConnected) {
          throw this.createError(ERROR_CODES.NETWORK_ERROR, "No internet connection")
        }
      }

      const response = await this.client({
        method,
        url,
        data,
        ...config,
      })

      return response.data
    } catch (error) {
      throw this.processError(error)
    }
  }

  // Upload Methods
  async uploadFile(url, file, onProgress) {
    try {
      const formData = new FormData()
      formData.append("file", {
        uri: file.uri,
        type: file.type,
        name: file.name || "upload.jpg",
      })

      const response = await this.client.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100
          onProgress?.(Math.round(progress))
        },
      })

      return response.data
    } catch (error) {
      throw this.processError(error)
    }
  }

  // Retry Logic
  async retryRequest(originalRequest) {
    const retryCount = originalRequest._retryCount || 0

    if (retryCount >= API_CONFIG.RETRY_ATTEMPTS) {
      throw this.createError(ERROR_CODES.NETWORK_ERROR, "Max retry attempts reached")
    }

    originalRequest._retryCount = retryCount + 1

    // Exponential backoff
    const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, retryCount)
    await this.sleep(delay)

    logger.info(`Retrying request (attempt ${retryCount + 1}):`, originalRequest.url)

    return this.client(originalRequest)
  }

  shouldRetry(config) {
    const retryCount = config._retryCount || 0
    return retryCount < API_CONFIG.RETRY_ATTEMPTS
  }

  isNetworkError(error) {
    return (
      !error.response ||
      error.code === "NETWORK_ERROR" ||
      error.code === "ECONNABORTED" ||
      (error.response && error.response.status >= 500)
    )
  }

  // Token Refresh Queue
  addToQueue(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, request })
    })
  }

  processQueue(error) {
    this.requestQueue.forEach(({ resolve, reject, request }) => {
      if (error) {
        reject(error)
      } else {
        resolve(this.client(request))
      }
    })

    this.requestQueue = []
  }

  // Error Processing
  processError(error) {
    if (error.response && error.response.data) {
      const msg = typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data);
      console.error("API Error:", msg);
    } else if (error.message) {
      console.error("API Error:", error.message);
    } else {
      console.error("API Error:", JSON.stringify(error));
    }
    Alert.alert("Error", error.message || (error.response?.data?.message) || "Something went wrong. Please try again.");
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || "An unexpected error occurred",
      originalError: error,
    }
  }

  getErrorCode(status) {
    if (status >= 400 && status < 500) {
      return ERROR_CODES.VALIDATION_ERROR
    } else if (status >= 500) {
      return ERROR_CODES.SERVER_ERROR
    }
    return ERROR_CODES.UNKNOWN_ERROR
  }

  createError(code, message) {
    return { code, message }
  }

  // Utility Methods
  generateRequestId() {
    return Math.random().toString(36).substr(2, 9)
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Cache Methods
  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(`cache:${key}`)
      if (cached) {
        const { data, timestamp, ttl } = JSON.parse(cached)
        if (Date.now() - timestamp < ttl) {
          return data
        }
      }
      return null
    } catch (error) {
      logger.error("Cache read error:", error)
      return null
    }
  }

  async setCachedData(key, data, ttl = 300000) {
    // 5 minutes default
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      }
      await AsyncStorage.setItem(`cache:${key}`, JSON.stringify(cacheData))
    } catch (error) {
      logger.error("Cache write error:", error)
    }
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys()
      const cacheKeys = keys.filter((key) => key.startsWith("cache:"))
      await AsyncStorage.multiRemove(cacheKeys)
    } catch (error) {
      logger.error("Cache clear error:", error)
    }
  }
}

export const apiService = new ApiService()
