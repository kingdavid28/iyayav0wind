// Example usage of the new Firebase-based MessagingService:

import { messagingService } from '../services/messagingService';
import { authService } from '../services/authService';

// Get current user ID from JWT auth system
const currentUserId = authService.getCurrentUserId();

// Send a message to another user
const messageId = await messagingService.sendMessage('user456', 'Hello! How are you?');

// Listen to messages in a conversation
const unsubscribe = messagingService.listenToMessages('user123_user456', (messages) => {
  console.log('New messages:', messages);
  // Update your chat UI with new messages
});

// Listen to all user conversations
const conversationsUnsubscribe = messagingService.listenToUserConversations(currentUserId, (conversations) => {
  console.log('User conversations:', conversations);
  // Update conversations list in UI
});

// Get conversation messages with pagination
const messages = await messagingService.getConversationMessages('user123_user456', 20);

// Search messages in a conversation
const searchResults = await messagingService.searchMessages('user123_user456', 'hello');

// Edit a message
await messagingService.editMessage('user123_user456', messageId, 'Hello! How are you doing?');

// Delete a message
await messagingService.deleteMessage('user123_user456', messageId);

// Set typing status
await messagingService.setTypingStatus('user123_user456', true);

// Listen to typing indicators
const typingUnsubscribe = messagingService.listenToTypingStatus('user123_user456', (typingUsers) => {
  console.log('Users typing:', typingUsers);
  // Show typing indicators in UI
});

// Get user profile info for conversation
const userProfile = await messagingService.getConversationMetadata('user123_user456');

// Mark message as delivered (for read receipts)
await messagingService.markMessageAsDelivered('user123_user456', messageId);

// Clean up listeners when component unmounts
// unsubscribe();
// conversationsUnsubscribe();
// typingUnsubscribe();
