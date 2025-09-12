import { bookingsAPI } from '../../config/api';
import { fetchAndProcessBookings } from '../../utils/bookingUtils';

export const fetchMyBookings = async () => {
  return await fetchAndProcessBookings(bookingsAPI);
};
