// src/services/notificationService.js
import { apiService } from './index';
import { isNotification } from '../shared/types/notifications';
import { notificationEvents } from '../utils/notificationEvents';
import socketService from './socketService';
import { Platform } from 'react-native';

const BASE_PATH = '/notifications';

const toUnix = (value) => (value ? new Date(value).getTime() : undefined);

const handleApiError = (error) => {
  console.error('Notification API error:', error);
  throw new Error(error.response?.data?.message || 'Notification operation failed');
};

const mapNotification = (payload) => {
  if (!payload) return null;
  if (isNotification(payload)) return payload;

  const actor = payload.actor || payload.sender;

  return {
    id: payload._id || payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    read: payload.read ?? false,
    createdAt: toUnix(payload.createdAt) ?? Date.now(),
    readAt: toUnix(payload.readAt),
    actor: actor && (actor.id || actor._id)
      ? {
          id: actor.id || actor._id,
          displayName: actor.displayName || actor.name || actor.email || '',
          avatarUrl: actor.avatarUrl || actor.avatar || actor.profileImage
        }
      : undefined,
    relatedBooking: payload.relatedBooking,
    data: payload.data || {},
    metadata: payload.metadata || {}
  };
};

export const fetchNotifications = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const result = await apiService.notifications.getNotifications({ page, limit });
    const notifications = Array.isArray(result?.data)
      ? result.data.map(mapNotification).filter(Boolean)
      : [];

    const pagination = result?.pagination || {
      page,
      limit,
      total: notifications.length,
      pages: notifications.length > 0 ? 1 : 0
    };

    return { notifications, pagination };
  } catch (error) {
    handleApiError(error);
  }
};

export const fetchFilteredNotifications = async ({
  page = 1,
  limit = 20,
  types = [],
  readStatus
}) => {
  const params = { page, limit };
  if (types.length) params.types = types.join(',');
  if (readStatus !== undefined) params.read = readStatus;

  try {
    const result = await apiService.notifications.getNotifications(params);
    return {
      notifications: result.data.map(mapNotification).filter(Boolean),
      pagination: result.pagination
    };
  } catch (error) {
    handleApiError(error);
  }
};

export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) throw new Error('Notification ID is required');
  
  try {
    const result = await apiService.notifications.markAsRead(notificationId);
    return mapNotification(result?.data || result);
  } catch (error) {
    handleApiError(error);
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    await apiService.notifications.markAllAsRead();
    return true;
  } catch (error) {
    handleApiError(error);
  }
};

export const subscribeToNotifications = (callback) => {
  return notificationEvents.subscribe('notification', (payload) => {
    callback(mapNotification(payload));
  });
};

export const registerPushToken = async (token) => {
  try {
    return apiService.notifications.registerToken({
      token,
      platform: Platform.OS
    });
  } catch (error) {
    handleApiError(error);
  }
};

export const initializeRealtimeNotifications = () => {
  // Check if socketService exists before calling methods
  if (socketService && typeof socketService.onNewNotification === 'function') {
    socketService.onNewNotification((payload) => {
      notificationEvents.emit('notification', payload);
    });
  } else {
    console.warn('SocketService not available for real-time notifications');
  }
};

export default {
  fetchNotifications,
  fetchFilteredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
  registerPushToken,
  initializeRealtimeNotifications
};