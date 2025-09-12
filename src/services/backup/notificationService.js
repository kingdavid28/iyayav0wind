// Expo Go compatible notification service (stub implementation)
const isExpoGo = __DEV__ && !process.env.EAS_BUILD;

// Stub implementations for Expo Go compatibility
const requestPermissions = async () => {
  if (isExpoGo) {
    console.log('📱 [NOTIFICATIONS] Stub: Permissions granted (Expo Go mode)');
    return true;
  }
  // Real implementation would go here for production builds
  return false;
};

const schedulePushNotification = async (title, body, data = {}) => {
  if (isExpoGo) {
    console.log('📱 [NOTIFICATIONS] Stub notification:', { title, body, data });
    return;
  }
  // Real implementation would go here for production builds
};

const handleNotificationReceived = (notification) => {
  console.log('📱 [NOTIFICATIONS] Received:', notification);
};

const handleNotificationResponse = (response) => {
  console.log('📱 [NOTIFICATIONS] Response:', response);
  return response?.data || {};
};

const sendPushNotification = async (_userId, title, body, data = {}) => {
  try {
    await schedulePushNotification(title, body, data);
  } catch (error) {
    console.error('📱 [NOTIFICATIONS] Error:', error);
  }
};

const initNotifications = async () => {
  if (isExpoGo) {
    console.log('📱 [NOTIFICATIONS] Stub: Initialized (Expo Go mode)');
    return 'expo-go-stub-token';
  }
  // Real implementation would go here for production builds
  return null;
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
