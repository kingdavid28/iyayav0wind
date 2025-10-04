const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  resolveConnection
} = require('../controllers/messagingController');

// All messaging routes require authentication
router.use(authenticate);

// Get all conversations for the current user
router.get('/conversations', getConversations);

// Get messages for a specific conversation
router.get('/conversation/:conversationId', getMessages);

// Send a message
router.post('/', sendMessage);

// Start a new conversation
router.post('/start', startConversation);

// Debug endpoint to resolve connection IDs to user data
router.get('/resolve/:connectionId', resolveConnection);

// Mark messages as read
router.post('/conversation/:conversationId/read', markAsRead);

module.exports = router;
