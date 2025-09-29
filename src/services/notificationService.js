import { apiService } from './apiService';
import { isNotification } from '../shared/types/notifications';

const BASE_PATH = '/notifications';

const mapNotification = (payload) => {
  if (!payload) {
    return null;
  }

  if (isNotification(payload)) {
    return payload;
  }

  return {
    id: payload._id || payload.id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    read: payload.read ?? false,
    createdAt: payload.createdAt ? new Date(payload.createdAt).getTime() : Date.now(),
    readAt: payload.readAt ? new Date(payload.readAt).getTime() : undefined,
    actor: payload.sender
      ? {
          id: payload.sender._id || payload.sender.id,
          displayName: payload.sender.name || payload.sender.displayName || '',
          avatarUrl: payload.sender.avatar || payload.sender.avatarUrl
        }
      : undefined,
    data: payload.data || {},
    relatedBooking: payload.relatedBooking
  };
};

export const fetchNotifications = async (page = 1, limit = 20) => {
  const response = await apiService.get(`${BASE_PATH}`, {
    params: { page, limit }
  });

  const notifications = Array.isArray(response.data?.data)
    ? response.data.data.map(mapNotification).filter(Boolean)
    : [];

  return {
    notifications,
    pagination:
      response.data?.pagination ||
      {
        page,
        limit,
        total: notifications.length,
        pages: 1
      }
  };
};

export const markNotificationAsRead = async (notificationId) => {
  if (!notificationId) {
    throw new Error('Notification ID is required');
  }

  const response = await apiService.patch(`${BASE_PATH}/${notificationId}/read`);
  return mapNotification(response.data?.data);
};

export const markAllNotificationsAsRead = async () => {
  const response = await apiService.patch(`${BASE_PATH}/read-all`);
  return response.data;
};

export default {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
