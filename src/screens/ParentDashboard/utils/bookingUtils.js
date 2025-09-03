import { buildSchedule, formatDateFriendly, formatTimeRange } from './dateUtils';

export const fetchMyBookings = async (bookingsAPI) => {
  try {
    const response = await bookingsAPI.getMyBookings();
    if (response.success && Array.isArray(response.bookings)) {
      return response.bookings.map(booking => ({
        id: booking._id || booking.id,
        caregiver: booking.caregiverId,
        caregiverId: booking.caregiverId,
        caregiverAvatar: booking.caregiverAvatar,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        children: Array.isArray(booking.children) ? booking.children : [],
        status: normalizeStatus(booking.status),
        totalCost: booking.totalCost || 0,
        address: booking.address || '',
        schedule: buildSchedule(booking.date, booking.startTime, booking.endTime)
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const normalizeStatus = (s) => {
  if (!s) return 'pending';
  return s === 'pending_confirmation' ? 'pending' : s;
};

export const getCaregiverDisplayName = (caregiver) => {
  if (typeof caregiver === 'string') return caregiver;
  if (caregiver?.name) return caregiver.name;
  return 'Caregiver';
};

// These functions are already imported from dateUtils, so you don't need to re-export them
// unless you want to provide fallback implementations or proxy them

// If you want to ensure they exist even if dateUtils doesn't provide them:
/*
export const formatDateFriendly = (dateStr) => {
  // Fallback implementation if not provided by dateUtils
  return new Date(dateStr).toLocaleDateString();
};

export const formatTimeRange = (start, end) => {
  // Fallback implementation if not provided by dateUtils
  return `${start} - ${end}`;
};
*/