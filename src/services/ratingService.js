import { apiService } from './apiService';

class RatingService {
  // Submit a rating for a caregiver
  async rateCaregiver(caregiverId, bookingId, rating, review = '') {
    try {
      const response = await apiService.post('/ratings/caregiver', {
        caregiverId,
        bookingId,
        rating,
        review: review.trim(),
      });
      return response.data;
    } catch (error) {
      console.error('Error rating caregiver:', error);
      throw error;
    }
  }

  // Submit a rating for a parent
  async rateParent(parentId, bookingId, rating, review = '') {
    try {
      const response = await apiService.post('/ratings/parent', {
        parentId,
        bookingId,
        rating,
        review: review.trim(),
      });
      return response.data;
    } catch (error) {
      console.error('Error rating parent:', error);
      throw error;
    }
  }

  // Get ratings for a caregiver
  async getCaregiverRatings(caregiverId, page = 1, limit = 10) {
    try {
      const response = await apiService.get(`/ratings/caregiver/${caregiverId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching caregiver ratings:', error);
      throw error;
    }
  }

  // Get ratings for a parent
  async getParentRatings(parentId, page = 1, limit = 10) {
    try {
      const response = await apiService.get(`/ratings/parent/${parentId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching parent ratings:', error);
      throw error;
    }
  }

  // Get rating summary for a user
  async getRatingSummary(userId, userType = 'caregiver') {
    try {
      const response = await apiService.get(`/ratings/summary/${userId}`, {
        params: { userType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching rating summary:', error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }

  // Check if user can rate a booking
  async canRate(bookingId) {
    try {
      const response = await apiService.get(`/ratings/can-rate/${bookingId}`);
      return response.data.canRate;
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
      return false;
    }
  }

  // Get existing rating for a booking
  async getBookingRating(bookingId) {
    try {
      const response = await apiService.get(`/ratings/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking rating:', error);
      return null;
    }
  }
}

export default new RatingService();