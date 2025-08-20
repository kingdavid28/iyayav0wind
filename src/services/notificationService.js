import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { db } from '../config/firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

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

// Send a push notification to a specific user
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    // In a real app, you would use a cloud function to send push tokens
    // This is a simplified version that stores the notification in Firestore
    const notificationRef = doc(db, 'users', userId);
    await updateDoc(notificationRef, {
      notifications: arrayUnion({
        title,
        body,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      }),
    });
    
    // For local testing
    if (__DEV__) {
      await schedulePushNotification(title, body, data);
    }
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

// In-app messaging service
const messageService = {
  // Send a message
  sendMessage: async (senderId, receiverId, content, jobId = null) => {
    try {
      const messageRef = collection(db, 'messages');
      const newMessage = {
        senderId,
        receiverId,
        content,
        jobId,
        read: false,
        createdAt: new Date().toISOString(),
      };
      
      await addDoc(messageRef, newMessage);
      
      // Send push notification for new message
      await sendPushNotification(
        receiverId,
        'New Message',
        `You have a new message about ${jobId ? 'a job' : 'your application'}`,
        { type: 'message', jobId, senderId }
      );
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Mark message as read
  markAsRead: async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },
  
  // Listen for new messages
  subscribeToMessages: (userId, callback) => {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  },
};

export default messageService;
