// bookingService.js
// Handles booking CRUD operations with backend API
import axios from 'axios';
import { API_CONFIG } from '../config/constants';

const API_BASE = `${API_CONFIG.BASE_URL}/bookings`;

export const getBookings = async (role, token) => {
  const url = role === 'parent'
    ? `${API_BASE}/parent`
    : `${API_BASE}/caregiver`;
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const createBooking = async (bookingData, token) => {
  const res = await axios.post(API_BASE, bookingData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateBookingStatus = async (bookingId, status, token) => {
  const res = await axios.patch(`${API_BASE}/${bookingId}`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export default {
  getBookings,
  createBooking,
  updateBookingStatus,
};
