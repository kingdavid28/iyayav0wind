const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const messagesController = require('../controllers/messagesController');
const { authenticate, authorize } = require('../utils/auth');

// Apply authentication to all routes
router.use(authenticate);

// GET /api/messages/conversations - Get all conversations for current user
router.get('/conversations', messagesController.getConversations);

// GET /api/messages/conversation/:id - Get messages for a specific conversation
router.get('/conversation/:id', messagesController.getConversationMessages);

// GET /api/messages/conversation/:id/info - Get conversation info
router.get('/conversation/:id/info', messagesController.getConversationInfo);

// POST /api/messages - Send a new message
router.post('/', [
  body('text').optional().isString().trim().isLength({ max: 5000 }),
  body('conversationId').optional().isMongoId(),
  body('recipientId').optional().isMongoId(),
  body('jobId').optional().isMongoId(),
  body('attachments').optional().isArray(),
  body('clientMessageId').optional().isString()
], messagesController.sendMessage);

// POST /api/messages/conversation/:id/read - Mark messages as read
router.post('/conversation/:id/read', messagesController.markMessagesAsRead);

// POST /api/messages/start - Start a new conversation
router.post('/start', [
  body('recipientId').isMongoId().withMessage('Valid recipient ID is required'),
  body('jobId').optional().isMongoId(),
  body('initialMessage').optional().isString().trim().isLength({ max: 5000 })
], messagesController.startConversation);

// DELETE /api/messages/:messageId - Delete a message
router.delete('/:messageId', messagesController.deleteMessage);

module.exports = router;
