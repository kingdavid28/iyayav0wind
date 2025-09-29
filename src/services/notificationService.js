import { apiService } from './index';
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
  const result = await apiService.notifications.getNotifications({ page, limit });

  const notifications = Array.isArray(result?.data)
    ? result.data.map(mapNotification).filter(Boolean)
    : [];

  return {
    notifications,
    pagination:
      result?.pagination ||
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

  const result = await apiService.notifications.markAsRead(notificationId);
  return mapNotification(result?.data || result);
};

export const markAllNotificationsAsRead = async () => {
  return apiService.notifications.markAllAsRead();
};

export default {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};
