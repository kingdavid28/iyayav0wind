import { api, authAPI, caregiversAPI } from "../config/api"
import { logger } from "../utils/logger"
import { validator } from "../utils/validation"
import { API_CONFIG, VALIDATION } from "../config/constants"

class UserService {
  // Create/Upsert profile for the authenticated user
  async createProfile(userId, profile) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }

      if (!profile || typeof profile !== 'object') {
        throw new Error('Profile data must be an object')
      }

      logger.info(`Creating profile for user: ${userId}`)
      // Use auth API to upsert current user's profile (server derives user from token)
      const updated = await authAPI.updateProfile(profile)

      // Update cache
      try {
        // Note: Cache functionality removed to prevent circular dependencies
        logger.info('Profile created successfully, cache update skipped');
      } catch (cacheError) {
        logger.warn('Cache update skipped:', cacheError)
      }

      return updated
    } catch (error) {
      logger.error('Failed to create profile:', error)
      throw error
    }
  }

  // Update children for parent user
  async updateChildren(children, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      if (!Array.isArray(children)) {
        throw new Error('Children must be an array')
      }
      
      // Validate each child object
      children.forEach((child, index) => {
        // Validate name
        try {
          validator.validateName(child.name)
        } catch (error) {
          throw new Error(`Child at index ${index}: ${error.message}`)
        }
        
        // Validate age
        if (typeof child.age !== 'number' || child.age < 0 || child.age > 18) {
          throw new Error(`Child at index ${index} must have a valid age between 0 and 18`)
        }
        
        // Validate optional allergies
        if (child.allergies && !Array.isArray(child.allergies)) {
          throw new Error(`Child at index ${index}: allergies must be an array`)
        }
      })

      logger.info(`Updating children for user: ${userId}`)
      const result = await api.put(`${API_CONFIG.BASE_URL}/users/${userId}/children`, { children })

      // Note: Cache invalidation removed to prevent circular dependencies
      logger.info('Children updated successfully');

      return result
    } catch (error) {
      logger.error('Failed to update children:', error)
      throw error
    }
  }

  // Profile Management
  async getProfile(userId, forceRefresh = false) {
    try {
      // userId is kept for cache key compatibility, but fetching uses auth profile
      if (!userId) {
        // Do not block: some flows may not have ID handy; we'll still fetch auth profile
        logger.warn('getProfile called without userId; proceeding to fetch /auth/profile')
      }
      
      const cacheKey = `profile:${userId}`
      
      // Note: Cache functionality removed to prevent circular dependencies
      logger.info(`Fetching authenticated profile (auth/profile) for user: ${userId || 'unknown'}`)
      const data = await authAPI.getProfile()
      
      // Basic response validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid profile data received from server')
      }
      
      // Note: Cache functionality removed to prevent circular dependencies
      logger.info('Profile fetched successfully');

      return data
    } catch (error) {
      logger.error("Failed to get user profile:", error)
      throw error
    }
  }

  async updateProfile(userId, updates) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      // Basic validation
      if (!updates || typeof updates !== 'object') {
        throw new Error('Profile data must be an object')
      }

      // Validate all provided fields
      const validationRules = {
        email: (email) => validator.validateEmail(email),
        phone: (phone) => validator.validatePhone(phone),
        firstName: (name) => validator.validateName(name),
        lastName: (name) => validator.validateName(name),
        dateOfBirth: (dob) => validator.validateDate(dob, 'Date of birth'),
        address: (address) => validator.validateAddress(address),
        emergencyContact: (contact) => {
          if (contact && typeof contact === 'object') {
            if (contact.name) validator.validateName(contact.name)
            if (contact.phone) validator.validatePhone(contact.phone)
            if (contact.relationship && typeof contact.relationship !== 'string') {
              throw new Error('Emergency contact relationship must be a string')
            }
          }
        }
      }

      // Apply validation rules to provided fields
      Object.entries(updates).forEach(([key, value]) => {
        if (validationRules[key]) {
          validationRules[key](value)
        } else if (key === 'children' && Array.isArray(value)) {
          // Special handling for children array
          this.updateChildren(value, userId)
        }
      })

      logger.info(`Updating profile for user: ${userId}`)
      
      // Use authAPI.updateProfile instead of direct API call
      const updated = await authAPI.updateProfile(updates)
      
      // Note: Cache functionality removed to prevent circular dependencies
      logger.info('Profile updated successfully');

      return updated
    } catch (error) {
      logger.error("Failed to update user profile:", error)
      throw error
    }
  }

  // Preferences
  async updatePreferences(userId, preferences) {
    try {
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Preferences data must be an object')
      }
      
      // Validate notification preferences
      if (preferences.notifications) {
        const notificationPrefs = preferences.notifications
        if (typeof notificationPrefs !== 'object') {
          throw new Error('Notification preferences must be an object')
        }
        
        // Validate notification types
        const validNotificationTypes = ['email', 'push', 'sms']
        Object.entries(notificationPrefs).forEach(([type, value]) => {
          if (!validNotificationTypes.includes(type)) {
            throw new Error(`Invalid notification type: ${type}`)
          }
          if (typeof value !== 'boolean') {
            throw new Error(`Notification preference for ${type} must be a boolean`)
          }
        })
      }
      
      // Validate language preference
      if (preferences.language && typeof preferences.language !== 'string') {
        throw new Error('Language preference must be a string')
      }
      
      // Validate theme preference
      const validThemes = ['light', 'dark', 'system']
      if (preferences.theme && !validThemes.includes(preferences.theme)) {
        throw new Error(`Theme must be one of: ${validThemes.join(', ')}`)
      }

      logger.info(`Updating preferences for user: ${userId}`)
      const result = await api.put(`/users/${userId}/preferences`, preferences)

      // Note: Cache invalidation removed to prevent circular dependencies
      logger.info('Preferences updated successfully');

      return result
    } catch (error) {
      logger.error("Failed to update preferences:", error)
      throw error
    }
  }

  async getPreferences(userId) {
    try {
      const cacheKey = `preferences:${userId}`
      // Note: Cache functionality removed to prevent circular dependencies
      logger.info(`Fetching preferences for user: ${userId}`)
      const preferences = await api.get(`/users/${userId}/preferences`)

      // Note: Cache functionality removed to prevent circular dependencies
      logger.info('Preferences fetched successfully');

      return preferences
    } catch (error) {
      logger.error("Failed to get preferences:", error)
      throw error
    }
  }

  // Availability
  async updateAvailability(userId, availability) {
    try {
      if (!availability || typeof availability !== 'object') {
        throw new Error('Invalid availability data')
      }

      // Basic validation of availability object
      const requiredFields = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of requiredFields) {
        if (availability[day] === undefined) {
          throw new Error(`Missing availability for ${day}`)
        }
      }

      logger.info(`Updating availability for user: ${userId}`)
      const result = await api.put(`/users/${userId}/availability`, availability)

      logger.info('Availability updated successfully');

      return result
    } catch (error) {
      logger.error("Failed to update availability:", error)
      throw error
    }
  }

  // Profile Image Upload
  async uploadProfileImage(userId, imageUri) {
    try {
      if (!imageUri) {
        throw new Error('No image provided')
      }

      logger.info(`Uploading profile image for user: ${userId}`)
      
      // Create form data
      const formData = new FormData()
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg', // or get from file
        name: 'profile.jpg'
      })

      const result = await api.post(`/users/${userId}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })

      // Note: Cache invalidation removed to prevent circular dependencies
      logger.info('Profile image uploaded successfully');

      return result
    } catch (error) {
      logger.error("Failed to upload profile image:", error)
      throw error
    }
  }

  // Search Nannies
  async searchNannies(filters = {}, page = 1, limit = 10) {
    try {
      // Create cache key based on filters
      const cacheKey = `caregivers:${JSON.stringify(filters)}:${page}:${limit}`
      // Note: Cache functionality removed to prevent circular dependencies
      logger.info('Searching caregivers with filters:', filters)

      // Build query string from filters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })

      const result = await api.get(`/caregivers?${queryParams}`)

      // Note: Cache functionality removed to prevent circular dependencies
      logger.info('Caregivers search completed successfully');

      return result
    } catch (error) {
      logger.error("Failed to search caregivers:", error)
      throw error
    }
  }
}

export const userService = new UserService()
