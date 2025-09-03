import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
const requestPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// Schedule a local notification
const schedulePushNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Send immediately
  });
};

// Handle notification received when app is in foreground
const handleNotificationReceived = (notification) => {
  // You can add custom handling here
  console.log('Notification received:', notification);
};

// Handle notification response (user taps on notification)
const handleNotificationResponse = (response) => {
  const { data } = response.notification.request.content;
  // Handle navigation based on notification data
  console.log('Notification response:', data);
  return data;
};

// Send a push notification to a specific user (stub; backend should handle distribution)
const sendPushNotification = async (_userId, title, body, data = {}) => {
  try {
    // For local testing only
    await schedulePushNotification(title, body, data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Initialize notifications
const initNotifications = async () => {
  await requestPermissions();
  
  // Get the token for this device
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log('Push token:', token);
  
  // In a real app, you would save this token to your backend
  // to send push notifications to this device
  
  return token;
};

export {
  requestPermissions,
  schedulePushNotification,
  handleNotificationReceived,
  handleNotificationResponse,
  sendPushNotification,
  initNotifications,
};

// In-app messaging service (placeholder; to be replaced with backend REST + Socket.IO)
const messageService = {
  sendMessage: async (_senderId, _receiverId, _content, _jobId = null) => {
    console.warn('messageService.sendMessage: backend integration pending');
    return null;
  },
  markAsRead: async (_messageId) => {
    console.warn('messageService.markAsRead: backend integration pending');
  },
  subscribeToMessages: (_userId, _callback) => {
    console.warn('messageService.subscribeToMessages: backend integration pending');
    return () => {};
  },
};

export default messageService;
