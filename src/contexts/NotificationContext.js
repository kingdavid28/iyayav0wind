import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.fetchNotifications(page, limit);
      setNotifications(response.notifications);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Failed to load notifications', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const updated = await notificationService.markNotificationAsRead(notificationId);
      setNotifications((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
      setError(err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true, readAt: item.readAt || Date.now() })));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      setError(err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      pagination,
      loading,
      error,
      unreadCount,
      reload: loadNotifications,
      markAsRead,
      markAllAsRead
    }),
    [notifications, pagination, loading, error, unreadCount, loadNotifications, markAsRead, markAllAsRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
