import { ratingsService } from './index';

const deriveStatusFromError = (error) => {
  const serviceStatus =
    error?.serviceStatus ||
    error?.response?.data?.serviceStatus ||
    error?.response?.serviceStatus ||
    error?.data?.serviceStatus;

  if (serviceStatus === 'maintenance') {
    return 'maintenance';
  }

  const statusCode = error?.status || error?.statusCode || error?.response?.status;
  if (statusCode === 503) {
    return 'maintenance';
  }

  return 'error';
};

const parseRatingsPayload = (payload) => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  const candidates = [payload?.data, payload?.results, payload?.items, payload?.ratings, payload?.docs];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const toReviewItem = (item, fallbackId = null) => ({
  id: item?._id || item?.id || item?.reviewId || item?.ratingId || fallbackId,
  rating: item?.rating ?? item?.score ?? item?.stars ?? item?.value ?? 0,
  reviewerId: item?.reviewerId || item?.parentId || item?.userId || item?.rater?._id,
  reviewerName:
    item?.reviewerName ||
    item?.parentName ||
    item?.authorName ||
    item?.from ||
    item?.rater?.name ||
    item?.rater?.fullName ||
    'Parent',
  comment: item?.review || item?.comment || item?.notes || item?.feedback || '',
  timestamp: item?.createdAt || item?.timestamp || item?.date || item?.updatedAt || Date.now(),
  bookingId: item?.bookingId || item?.booking?._id || item?.booking?.id,
  raw: __DEV__ ? item : undefined,
});

const extractPagination = (payload = {}, fallback = { page: 1, limit: 10, total: 0 }) => {
  const source = payload?.pagination || payload;
  const page = Number(source?.page ?? fallback.page ?? 1) || 1;
  const limit = Number(source?.limit ?? fallback.limit ?? 10) || 10;
  const total = Number(source?.total ?? fallback.total ?? 0) || 0;
  const pages = Number(source?.pages ?? Math.ceil(total / (limit || 1))) || 0;

  return { page, limit, total, pages };
};

const normalizeRatingsResponse = (response, fallback = { page: 1, limit: 10 }) => {
  const payload = response?.data ?? response ?? {};
  const items = parseRatingsPayload(payload);
  return {
    items: items.map((item, index) => toReviewItem(item, index)),
    pagination: extractPagination(payload, {
      page: fallback.page,
      limit: fallback.limit,
      total: items.length,
    }),
    raw: payload,
  };
};

const attachStatusAndRethrow = (error) => {
  const status = deriveStatusFromError(error);
  if (status) {
    error.serviceStatus = status === 'maintenance' ? 'maintenance' : error.serviceStatus;
    error.statusType = status;
  }
  throw error;
};

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
      return normalizeRatingsResponse(response, { page, limit });
    } catch (error) {
      console.error('Error fetching caregiver ratings:', error);
      attachStatusAndRethrow(error);
    }
  }

  // Get ratings for a parent
  async getParentRatings(parentId, page = 1, limit = 10) {
    try {
      const response = await ratingsService.getParentRatings(parentId, page, limit);
      return normalizeRatingsResponse(response, { page, limit });
    } catch (error) {
      console.error('Error fetching parent ratings:', error);
      attachStatusAndRethrow(error);
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
      attachStatusAndRethrow(error);
    }
  }
}

export default new RatingService();