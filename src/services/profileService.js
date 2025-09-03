import { API_CONFIG } from '../config/constants';
import { errorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';

/**
 * Profile Service
 * Handles all profile-related API calls
 */
class ProfileService {
  constructor() {
    if (!API_CONFIG || !API_CONFIG.BASE_URL) {
      console.error('API_CONFIG.BASE_URL is undefined. Check your environment configuration.');
      this.baseURL = 'http://localhost:5000/api/profile'; // Fallback URL
    } else {
      this.baseURL = `${API_CONFIG.BASE_URL}/profile`;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(token) {
    try {
      const response = await fetch(`${this.baseURL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      logger.info('Profile fetched successfully');
      return data.data;

    } catch (error) {
      logger.error('Get profile error:', error);
      throw errorHandler.process(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData, token) {
    try {
      const response = await fetch(`${this.baseURL}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      logger.info('Profile updated successfully');
      return data.data;

    } catch (error) {
      logger.error('Update profile error:', error);
      throw errorHandler.process(error);
    }
  }

  /**
   * Update profile image
   */
  async updateProfileImage(imageBase64, token) {
    try {
      const response = await fetch(`${this.baseURL}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile image');
      }

      logger.info('Profile image updated successfully');
      return data.data;

    } catch (error) {
      logger.error('Update profile image error:', error);
      throw errorHandler.process(error);
    }
  }

  /**
   * Update children information (for parents)
   */
  async updateChildren(children, token) {
    try {
      const response = await fetch(`${this.baseURL}/children`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ children }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update children information');
      }

      logger.info('Children information updated successfully');
      return data.data;

    } catch (error) {
      logger.error('Update children error:', error);
      throw errorHandler.process(error);
    }
  }

  /**
   * Get caregiver availability
   */
  async getAvailability(token) {
    try {
      const response = await fetch(`${this.baseURL}/availability`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch availability');
      }

      logger.info('Availability fetched successfully');
      return data.data;

    } catch (error) {
      logger.error('Get availability error:', error);
      throw errorHandler.process(error);
    }
  }

  /**
   * Update caregiver availability
   */
  async updateAvailability(availability, token) {
    try {
      const response = await fetch(`${this.baseURL}/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ availability }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update availability');
      }

      logger.info('Availability updated successfully');
      return data.data;

    } catch (error) {
      logger.error('Update availability error:', error);
      throw errorHandler.process(error);
    }
  }
}

export default new ProfileService();
