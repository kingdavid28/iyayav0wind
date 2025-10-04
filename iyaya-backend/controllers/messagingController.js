const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { authenticate } = require('../middleware/auth');
const { errorHandler } = require('../utils/errorHandler');
const { createMessageNotification } = require('../services/notificationService');
const { getUserByFirebaseUid, resolveConnectionToUser } = require('../services/userService');
const { backendFirebaseRealtimeService } = require('../services/backendFirebaseRealtimeService');

// Debug endpoint to resolve connection IDs to user data
const resolveConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;

    if (!connectionId) {
      return res.status(400).json({
        success: false,
        error: 'Connection ID is required'
      });
    }

    const userData = await resolveConnectionToUser(connectionId);

    if (userData) {
      res.status(200).json({
        success: true,
        data: {
          connectionId,
          userId: userData._id,
          firebaseUid: userData.firebaseUid,
          role: userData.role,
          name: userData.name
        }
      });
    } else {
      console.warn('⚠️ No user data found for connectionId:', connectionId);
      res.status(404).json({
        success: false,
        error: 'No user data found for connection ID',
        connectionId
      });
    }
  } catch (error) {
    console.error('❌ Error resolving connection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve connection'
    });
  }
};

// Get all conversations for the current user
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'name email')
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
};

// Get messages for a specific conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    console.log('📨 Getting messages for conversation:', {
      conversationId,
      userId,
      page,
      limit,
      authMethod: req.authMethod
    });

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get messages from MongoDB (existing functionality)
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`📨 Retrieved ${messages.length} messages from MongoDB`);

    // Also try to get messages from Firebase for real-time sync
    let firebaseMessages = [];
    try {
      firebaseMessages = await backendFirebaseRealtimeService.getMessagesFromFirebase(conversationId);
      console.log(`🔥 Retrieved ${firebaseMessages.length} messages from Firebase`);
    } catch (firebaseError) {
      console.error('⚠️ Failed to get messages from Firebase:', firebaseError);
      // Continue with MongoDB messages if Firebase fails
    }

    // Combine and deduplicate messages (Firebase messages take precedence for real-time updates)
    const allMessages = [...messages.reverse(), ...firebaseMessages];

    // Remove duplicates based on message ID
    const uniqueMessages = allMessages.reduce((acc, message) => {
      const existingIndex = acc.findIndex(m => m.id === message.id || m._id?.toString() === message.id);
      if (existingIndex === -1) {
        acc.push(message);
      }
      return acc;
    }, []);

    // Sort by timestamp
    uniqueMessages.sort((a, b) => (a.timestamp || a.createdAt) - (b.timestamp || b.createdAt));

    res.status(200).json({
      success: true,
      data: {
        messages: uniqueMessages,
        page: parseInt(page),
        limit: parseInt(limit),
        total: uniqueMessages.length,
        sources: {
          mongodb: messages.length,
          firebase: firebaseMessages.length
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', conversationId } = req.body;
    const senderId = req.user.id;

    console.log('📨 Sending message:', {
      senderId,
      recipientId,
      content,
      messageType,
      conversationId,
      authMethod: req.authMethod
    });

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId],
        lastMessage: {
          content,
          sender: senderId,
          timestamp: new Date()
        }
      });
      await conversation.save();
      console.log('🆕 Created new conversation:', conversation._id);
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      recipient: recipientId,
      content,
      messageType
    });

    await message.save();
    console.log('💾 Message saved to MongoDB:', message._id);

    // Send message to Firebase real-time database for instant delivery
    try {
      const firebaseMessageId = await backendFirebaseRealtimeService.sendMessageToFirebase(
        conversation._id.toString(),
        {
          content,
          sender: senderId,
          recipient: recipientId,
          messageType,
          timestamp: message.createdAt
        }
      );

      console.log('🔥 Message sent to Firebase:', firebaseMessageId);

      // Update conversation's last message in Firebase as well
      await backendFirebaseRealtimeService.updateMessageStatusInFirebase(
        conversation._id.toString(),
        firebaseMessageId,
        'sent',
        senderId
      );

    } catch (firebaseError) {
      console.error('⚠️ Failed to send message to Firebase (continuing with MongoDB):', firebaseError);
      // Don't fail the request if Firebase fails - MongoDB message is saved
    }

    // Send notification to recipient
    try {
      await createMessageNotification(message, recipientId, senderId);
    } catch (notificationError) {
      console.error('Failed to send message notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Update conversation's last message
    conversation.lastMessage = {
      content,
      sender: senderId,
      timestamp: new Date()
    };
    conversation.updatedAt = new Date();
    await conversation.save();

    // Populate sender info for response
    await message.populate('sender', 'name email');

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// Start a new conversation
const startConversation = async (req, res) => {
  try {
    const { recipientId, initialMessage } = req.body;
    const senderId = req.user.id;

    console.log('🚀 Starting new conversation:', {
      senderId,
      recipientId,
      initialMessage,
      authMethod: req.authMethod
    });

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (existingConversation) {
      return res.status(400).json({
        success: false,
        error: 'Conversation already exists'
      });
    }

    // Create new conversation
    const conversation = new Conversation({
      participants: [senderId, recipientId],
      lastMessage: {
        content: initialMessage,
        sender: senderId,
        timestamp: new Date()
      }
    });

    await conversation.save();
    console.log('🆕 Created new conversation:', conversation._id);

    // Create initial message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      recipient: recipientId,
      content: initialMessage,
      messageType: 'text'
    });

    await message.save();
    console.log('💾 Initial message saved to MongoDB:', message._id);

    // Send initial message to Firebase real-time database
    try {
      const firebaseMessageId = await backendFirebaseRealtimeService.sendMessageToFirebase(
        conversation._id.toString(),
        {
          content: initialMessage,
          sender: senderId,
          recipient: recipientId,
          messageType: 'text',
          timestamp: message.createdAt
        }
      );

      console.log('🔥 Initial message sent to Firebase:', firebaseMessageId);

    } catch (firebaseError) {
      console.error('⚠️ Failed to send initial message to Firebase (continuing with MongoDB):', firebaseError);
      // Don't fail the request if Firebase fails
    }

    // Send notification to recipient for initial message
    try {
      await createMessageNotification(message, recipientId, senderId);
    } catch (notificationError) {
      console.error('Failed to send initial message notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: {
        conversation,
        message
      }
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversation'
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  startConversation,
  markAsRead,
  resolveConnection
};
