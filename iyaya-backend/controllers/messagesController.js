const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { errorHandler } = require('../utils/errorHandler');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

/**
 * Messages Controller
 * Handles real-time messaging functionality
 */

// Get all conversations for the current user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?.mongoId || req.user?._id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name avatar role')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })
    .lean();

    // Add unread message count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conversation) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          fromUserId: { $ne: userId },
          read: false
        });

        return {
          ...conversation,
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithUnread
    });

  } catch (error) {
    logger.error('Get conversations error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Get messages for a specific conversation
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.mongoId || req.user?._id;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate('fromUserId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Message.countDocuments({ conversationId })
    ]);

    // Reverse to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: {
        conversationId,
        messages,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get conversation messages error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.mongoId || req.user?._id;
    const { 
      conversationId, 
      recipientId, 
      text, 
      attachments = [],
      jobId,
      clientMessageId 
    } = req.body;

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Either text or attachments are required'
      });
    }

    let conversation;

    // If conversationId provided, verify it exists and user has access
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: 'Conversation not found or access denied'
        });
      }
    } else if (recipientId) {
      // Create or find existing conversation between users
      conversation = await Conversation.findOne({
        participants: { $all: [userId, recipientId] },
        type: 'direct'
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [userId, recipientId],
          type: 'direct',
          jobId: jobId || null
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either conversationId or recipientId is required'
      });
    }

    // Process attachments if any
    const processedAttachments = [];
    if (attachments && attachments.length > 0) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'messages');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      for (const attachment of attachments) {
        try {
          const { base64, mimeType, name } = attachment;
          if (!base64) continue;

          const ext = (mimeType && mimeType.split('/')[1]) || 'bin';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${name || 'file'}.${ext}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
          const filePath = path.join(uploadDir, fileName);
          const buffer = Buffer.from(base64, 'base64');
          
          fs.writeFileSync(filePath, buffer);
          
          processedAttachments.push({
            url: `/uploads/messages/${fileName}`,
            type: mimeType || 'application/octet-stream',
            name: name || fileName,
            size: buffer.length
          });
        } catch (error) {
          logger.error('Attachment processing error:', error);
          // Continue with other attachments
        }
      }
    }

    // Create the message
    const message = await Message.create({
      conversationId: conversation._id,
      fromUserId: userId,
      text: text || '',
      attachments: processedAttachments,
      jobId: jobId || null,
      clientMessageId: clientMessageId || null,
      delivered: true,
      read: false
    });

    // Update conversation's last message and timestamp
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('fromUserId', 'name avatar');

    // Emit real-time event (if Socket.IO is available)
    try {
      const { emitNewMessage } = require('../services/realtime');
      emitNewMessage(conversation._id.toString(), message);
    } catch (error) {
      logger.warn('Real-time emission failed:', error);
    }

    logger.info(`Message sent by user ${userId} in conversation ${conversation._id}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    logger.error('Send message error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.mongoId || req.user?._id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Mark all unread messages from other users as read
    const result = await Message.updateMany(
      {
        conversationId,
        fromUserId: { $ne: userId },
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    logger.info(`Marked ${result.modifiedCount} messages as read for user ${userId} in conversation ${conversationId}`);

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: {
        conversationId,
        markedCount: result.modifiedCount,
        readAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Mark messages as read error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Start a new conversation
exports.startConversation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.mongoId || req.user?._id;
    const { recipientId, jobId, initialMessage } = req.body;

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        type: 'direct',
        jobId: jobId || null
      });
    }

    // Send initial message if provided
    if (initialMessage) {
      const message = await Message.create({
        conversationId: conversation._id,
        fromUserId: userId,
        text: initialMessage,
        delivered: true,
        read: false
      });

      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      await message.populate('fromUserId', 'name avatar');

      // Emit real-time event
      try {
        const { emitNewMessage } = require('../services/realtime');
        emitNewMessage(conversation._id.toString(), message);
      } catch (error) {
        logger.warn('Real-time emission failed:', error);
      }
    }

    await conversation.populate('participants', 'name avatar role');

    logger.info(`Conversation started between users ${userId} and ${recipientId}`);

    res.status(201).json({
      success: true,
      message: 'Conversation started successfully',
      data: conversation
    });

  } catch (error) {
    logger.error('Start conversation error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.mongoId || req.user?._id;

    const message = await Message.findOne({
      _id: messageId,
      fromUserId: userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or not authorized to delete'
      });
    }

    // Soft delete - mark as deleted instead of removing
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    logger.info(`Message ${messageId} deleted by user ${userId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    logger.error('Delete message error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Get conversation info
exports.getConversationInfo = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.mongoId || req.user?._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    })
    .populate('participants', 'name avatar role')
    .populate('jobId', 'title status')
    .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found or access denied'
      });
    }

    // Get message statistics
    const messageStats = await Message.aggregate([
      { $match: { conversationId: new mongoose.Types.ObjectId(conversationId) } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$read', false] }, { $ne: ['$fromUserId', new mongoose.Types.ObjectId(userId)] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const stats = messageStats[0] || { totalMessages: 0, unreadCount: 0 };

    res.json({
      success: true,
      data: {
        ...conversation,
        messageStats: stats
      }
    });

  } catch (error) {
    logger.error('Get conversation info error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};
