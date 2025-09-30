import { ratingsService } from './index';

class RatingService {
  // Submit a rating for a caregiver
  async rateCaregiver(caregiverId, bookingId, rating, review = '') {
    try {
      const response = await ratingsService.rateCaregiver(
        caregiverId,
        bookingId,
        rating,
        review
      );
      return response?.data || response;
    } catch (error) {
      console.error('Error rating caregiver:', error);
      throw error;
    }
  }

  // Submit a rating for a parent
  async rateParent(parentId, bookingId, rating, review = '') {
    try {
      const response = await ratingsService.rateParent(
        parentId,
        bookingId,
        rating,
        review
      );
      return response?.data || response;
    } catch (error) {
      console.error('Error rating parent:', error);
      throw error;
    }
  }

  // Get ratings for a caregiver
  async getCaregiverRatings(caregiverId, page = 1, limit = 10) {
    try {
      const response = await ratingsService.getCaregiverRatings(caregiverId, page, limit);
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching caregiver ratings:', error);
      throw error;
    }
  }

  // Get ratings for a parent
  async getParentRatings(parentId, page = 1, limit = 10) {
    try {
      const response = await ratingsService.getParentRatings(parentId, page, limit);
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching parent ratings:', error);
      throw error;
    }
  }

  // Get rating summary for a user
  async getRatingSummary(userId, userType = 'caregiver') {
    try {
      const response = await ratingsService.getRatingSummary(userId, userType);
      return response?.data || response;
    } catch (error) {
      console.error('Error fetching rating summary:', error);
      return { averageRating: 0, totalRatings: 0 };
    }
  }

  // Check if user can rate a booking
  async canRate(bookingId) {
    try {
      const response = await ratingsService.canRate?.(bookingId);
      return response?.data?.canRate ?? response?.canRate ?? false;
    } catch (error) {
      console.error('Error checking rating eligibility:', error);
      return false;
    }
  }

  // Get existing rating for a booking
  async getBookingRating(bookingId) {
    try {
      const response = await ratingsService.getBookingRating?.(bookingId);
      return response?.data ?? response;
    } catch (error) {
      console.error('Error fetching booking rating:', error);
      return null;
    }
  }
}

export default new RatingService();