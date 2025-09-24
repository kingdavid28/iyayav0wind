const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../../config/auth');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8081",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO service initialized');
  }

  authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;

      if (!token || !userId) {
        return next(new Error('Authentication failed'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.id || userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  handleConnection(socket) {
    console.log(`User connected: ${socket.userId}`);
    
    // Store user connection
    this.connectedUsers.set(socket.userId, socket);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle user joining conversation
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Handle user leaving conversation
    socket.on('conversation:leave', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('message:send', ({ conversationId, message }) => {
      socket.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        text: message,
        fromUserId: socket.userId,
        createdAt: new Date(),
        senderName: socket.userName || 'User'
      });
    });

    // Handle user joining their room
    socket.on('user:join', ({ userId }) => {
      socket.join(`user:${userId}`);
      socket.userId = userId;
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      this.connectedUsers.delete(socket.userId);
    });
  }

  // Emit to specific user
  emitToUser(userId, event, data) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  // Emit new booking notification to caregivers
  notifyNewBooking(caregiverId, bookingData) {
    this.emitToUser(caregiverId, 'booking:created', {
      ...bookingData,
      type: 'booking_created',
      timestamp: new Date()
    });
  }

  // Emit new job notification to caregivers
  notifyNewJob(jobData) {
    if (this.io) {
      this.io.emit('job:created', {
        ...jobData,
        type: 'job_created',
        timestamp: new Date()
      });
    }
  }

  // Emit booking confirmation to parent
  notifyBookingConfirmed(parentId, bookingData) {
    this.emitToUser(parentId, 'booking:confirmed', {
      ...bookingData,
      type: 'booking_confirmed',
      timestamp: new Date()
    });
  }

  // Emit new application to parent
  notifyNewApplication(parentId, applicationData) {
    this.emitToUser(parentId, 'application:created', {
      ...applicationData,
      type: 'application_created',
      timestamp: new Date()
    });
  }

  // Emit new message notification
  notifyNewMessage(userId, messageData) {
    this.emitToUser(userId, 'message:new', {
      ...messageData,
      type: 'message_new',
      timestamp: new Date()
    });
  }
}

module.exports = new SocketService();