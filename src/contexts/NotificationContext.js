import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../core/contexts/AuthContext';
import socketService from '../services/socketService';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    // Initialize notifications
    const initNotifications = async () => {
      try {
        await notificationService.initNotifications();
        
        // Listen for real-time notifications
        socketService.onNotification((notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show in-app notification
          if (notification.title && notification.body) {
            Alert.alert(notification.title, notification.body);
          }
        });

        // Listen for booking updates
        socketService.onBookingUpdate((update) => {
          const notification = {
            id: Date.now(),
            type: 'booking_update',
            title: 'Booking Update',
            body: `Your booking has been ${update.status}`,
            data: update,
            createdAt: new Date().toISOString(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });

        // Listen for job updates
        socketService.onJobUpdate((update) => {
          const notification = {
            id: Date.now(),
            type: 'job_update',
            title: 'Job Update',
            body: `New application for your job: ${update.jobTitle}`,
            data: update,
            createdAt: new Date().toISOString(),
            read: false,
          };
          
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        });

      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, [user?.uid]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const sendNotification = async (userId, title, body, data = {}) => {
    try {
      await notificationService.sendPushNotification(userId, title, body, data);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;