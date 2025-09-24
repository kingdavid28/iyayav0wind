// Example usage of FirebaseRealtimeService for messaging:

import { firebaseRealtimeService } from '../services/firebaseRealtimeService';

// Initialize Firebase real-time auth (separate from JWT auth)
await firebaseRealtimeService.initializeRealtimeAuth();

// Send a message
const messageId = await firebaseRealtimeService.sendMessage('chat123', {
  text: 'Hello, how are you?',
  type: 'text'
});

// Listen to messages in a chat
const unsubscribe = firebaseRealtimeService.listenToMessages('chat123', (messages) => {
  console.log('New messages:', messages);
  // Update your UI with new messages
});

// Stop listening when component unmounts
// unsubscribe();

// Update user status
firebaseRealtimeService.updateUserStatus({
  isOnline: true,
  currentActivity: 'In a chat'
});

// Listen to another user's status
firebaseRealtimeService.listenToUserStatus('user456', (status) => {
  console.log('User status:', status);
});

// Clean up when app closes
// firebaseRealtimeService.cleanup();
