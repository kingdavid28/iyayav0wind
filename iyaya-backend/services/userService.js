const User = require('../models/User');

exports.getUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

/**
 * Get user by Firebase UID for messaging system
 * @param {string} firebaseUid - Firebase user ID
 * @returns {Object|null} User document or null if not found
 */
exports.getUserByFirebaseUid = async (firebaseUid) => {
  try {
    if (!firebaseUid) {
      console.warn('⚠️ getUserByFirebaseUid called with empty firebaseUid');
      return null;
    }

    const user = await User.findOne({ firebaseUid: firebaseUid }).select('-password');

    if (user) {
      console.log('✅ Found user by Firebase UID:', {
        firebaseUid,
        mongoId: user._id,
        role: user.role
      });
      return user;
    } else {
      console.warn('⚠️ No user found for Firebase UID:', firebaseUid);
      return null;
    }
  } catch (error) {
    console.error('❌ Error looking up user by Firebase UID:', firebaseUid, error);
    return null;
  }
};

/**
 * Get MongoDB user ID from Firebase UID
 * @param {string} firebaseUid - Firebase user ID
 * @returns {string|null} MongoDB user ID or null if not found
 */
exports.getMongoIdFromFirebaseUid = async (firebaseUid) => {
  try {
    const user = await exports.getUserByFirebaseUid(firebaseUid);
    return user ? user._id.toString() : null;
  } catch (error) {
    console.error('❌ Error getting MongoDB ID from Firebase UID:', firebaseUid, error);
    return null;
  }
};

/**
 * Resolve connection ID to user data for messaging system
 * Handles both Firebase UIDs and MongoDB ObjectIds
 * @param {string} connectionId - Either Firebase UID or MongoDB ObjectId
 * @returns {Object|null} User data or null if not found
 */
exports.resolveConnectionToUser = async (connectionId) => {
  try {
    if (!connectionId) {
      console.warn('⚠️ resolveConnectionToUser called with empty connectionId');
      return null;
    }

    // First try to find by Firebase UID (for Firebase connections)
    if (connectionId.length > 20) { // Firebase UIDs are typically longer
      const userByFirebase = await exports.getUserByFirebaseUid(connectionId);
      if (userByFirebase) {
        console.log('✅ Resolved Firebase UID to user:', {
          connectionId,
          mongoId: userByFirebase._id,
          role: userByFirebase.role
        });
        return userByFirebase;
      }
    }

    // Then try to find by MongoDB ObjectId (for direct database connections)
    if (connectionId.length === 24 && /^[0-9a-fA-F]{24}$/.test(connectionId)) {
      const User = require('../models/User');
      const userByMongoId = await User.findById(connectionId).select('-password');
      if (userByMongoId) {
        console.log('✅ Resolved MongoDB ID to user:', {
          connectionId,
          role: userByMongoId.role
        });
        return userByMongoId;
      }
    }

    // If neither worked, log the failed lookup
    console.warn('⚠️ No user data found for connectionId:', connectionId);
    return null;

  } catch (error) {
    console.error('❌ Error resolving connection to user:', connectionId, error);
    return null;
  }
};