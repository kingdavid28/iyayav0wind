const { getUserByFirebaseUid, getMongoIdFromFirebaseUid } = require('../services/userService');

/**
 * Middleware to handle Firebase UID authentication for messaging
 * Supports both MongoDB user IDs and Firebase UIDs for backward compatibility
 */
const messagingAuth = async (req, res, next) => {
  try {
    const { firebaseUid, userId } = req.body || req.query || req.params || {};

    if (firebaseUid) {
      // Try to find user by Firebase UID
      const userByFirebase = await getUserByFirebaseUid(firebaseUid);

      if (userByFirebase) {
        // Found user by Firebase UID
        req.user = userByFirebase;
        req.authMethod = 'firebase';
        console.log('✅ Messaging auth successful via Firebase UID:', firebaseUid);
        return next();
      } else {
        console.warn('⚠️ No user found for Firebase UID in messaging auth:', firebaseUid);
        return res.status(401).json({
          success: false,
          error: 'Invalid Firebase UID'
        });
      }
    } else if (userId) {
      // Fall back to MongoDB user ID lookup
      const User = require('../models/User');
      const userByMongoId = await User.findById(userId).select('-password');

      if (userByMongoId) {
        req.user = userByMongoId;
        req.authMethod = 'mongodb';
        console.log('✅ Messaging auth successful via MongoDB ID:', userId);
        return next();
      } else {
        console.warn('⚠️ No user found for MongoDB ID in messaging auth:', userId);
        return res.status(401).json({
          success: false,
          error: 'Invalid user ID'
        });
      }
    } else {
      console.warn('⚠️ No authentication provided for messaging');
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
  } catch (error) {
    console.error('❌ Messaging authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Middleware specifically for Socket.IO connections
 * Handles Firebase UID authentication for real-time messaging
 */
const socketAuth = async (socket, next) => {
  try {
    const { firebaseUid, userId } = socket.handshake.auth || {};

    if (firebaseUid) {
      const user = await getUserByFirebaseUid(firebaseUid);

      if (user) {
        socket.data.user = user;
        socket.data.firebaseUid = firebaseUid;
        socket.data.authMethod = 'firebase';
        console.log('✅ Socket auth successful via Firebase UID:', firebaseUid);
        return next();
      } else {
        console.warn('⚠️ Socket auth failed - no user found for Firebase UID:', firebaseUid);
        return next(new Error('Authentication failed'));
      }
    } else if (userId) {
      const User = require('../models/User');
      const user = await User.findById(userId).select('-password');

      if (user) {
        socket.data.user = user;
        socket.data.userId = userId;
        socket.data.authMethod = 'mongodb';
        console.log('✅ Socket auth successful via MongoDB ID:', userId);
        return next();
      } else {
        console.warn('⚠️ Socket auth failed - no user found for MongoDB ID:', userId);
        return next(new Error('Authentication failed'));
      }
    } else {
      console.warn('⚠️ Socket auth failed - no authentication provided');
      return next(new Error('Authentication required'));
    }
  } catch (error) {
    console.error('❌ Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
};

module.exports = {
  messagingAuth,
  socketAuth
};
