import { API_BASE_URL } from '../services/index';
import { getAuthToken } from '../utils/auth';
import { logger } from '../utils/logger';

/**
 * Booking Service
 * Handles all booking-related API calls
 */

class BookingService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/bookings`;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const token = await getAuthToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        ...options,
      };

      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      logger.error('BookingService request failed:', { endpoint, error: error.message });
      throw error;
    }
  }

  // Get all bookings for current user
  async getBookings(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const endpoint = `/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await this.makeRequest(endpoint);
      
      console.log('📋 BookingService - Raw response:', response);
      console.log('📋 BookingService - Bookings data:', response.bookings);
      
      if (response.bookings && response.bookings.length > 0) {
        console.log('📋 BookingService - First booking structure:', response.bookings[0]);
        console.log('📋 BookingService - First booking caregiver:', response.bookings[0].caregiverId);
      }
      
      return response.bookings || response.data || [];
    } catch (error) {
      logger.error('Get bookings failed:', error);
      throw new Error('Failed to load bookings');
    }
  }

  // Get a specific booking by ID
  async getBookingById(bookingId) {
    try {
      const response = await this.makeRequest(`/${bookingId}`);
      return response.data;
    } catch (error) {
      logger.error('Get booking by ID failed:', error);
      throw new Error('Failed to load booking details');
    }
  }

  // Create a new booking
  async createBooking(bookingData) {
    try {
      const response = await this.makeRequest('/', {
        method: 'POST',
        body: bookingData,
      });
      return response.data;
    } catch (error) {
      logger.error('Create booking failed:', error);
      throw new Error('Failed to create booking');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status, feedback = null) {
    try {
      const response = await this.makeRequest(`/${bookingId}/status`, {
        method: 'PATCH',
        body: { status, feedback },
      });
      return response.data;
    } catch (error) {
      logger.error('Update booking status failed:', error);
      throw new Error('Failed to update booking status');
    }
  }

  // Cancel a booking
  async cancelBooking(bookingId, reason) {
    try {
      const response = await this.makeRequest(`/${bookingId}`, {
        method: 'DELETE',
        body: { reason },
      });
      return response.data;
    } catch (error) {
      logger.error('Cancel booking failed:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  // Upload payment proof
  async uploadPaymentProof(bookingId, paymentData) {
    try {
      const response = await this.makeRequest(`/${bookingId}/payment-proof`, {
        method: 'POST',
        body: paymentData,
      });
      return response.data;
    } catch (error) {
      logger.error('Upload payment proof failed:', error);
      throw new Error('Failed to upload payment proof');
    }
  }

  // Update booking status (for caregiver actions)
  async updateStatus(bookingId, status) {
    try {
      const response = await this.makeRequest(`/${bookingId}/status`, {
        method: 'PATCH',
        body: { status },
      });
      return response.data;
    } catch (error) {
      logger.error('Update booking status failed:', error);
      throw new Error('Failed to update booking status');
    }
  }

  // Get booking statistics
  async getBookingStats() {
    try {
      const response = await this.makeRequest('/stats');
      return response.data;
    } catch (error) {
      logger.error('Get booking stats failed:', error);
      throw new Error('Failed to load booking statistics');
    }
  }

  // Get available time slots for a caregiver
  async getAvailableSlots(caregiverId, date) {
    try {
      const response = await this.makeRequest(`/available-slots/${caregiverId}?date=${date}`);
      return response.data;
    } catch (error) {
      logger.error('Get available slots failed:', error);
      throw new Error('Failed to load available time slots');
    }
  }

  // Check for booking conflicts
  async checkConflicts(bookingData) {
    try {
      const response = await this.makeRequest('/check-conflicts', {
        method: 'POST',
        body: bookingData,
      });
      return response.data;
    } catch (error) {
      logger.error('Check conflicts failed:', error);
      throw new Error('Failed to check booking conflicts');
    }
  }
}

export default new BookingService();
