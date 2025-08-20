const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

// Enhanced authentication middleware that handles both Firebase ID tokens and custom JWT
const authenticate = async (req, res, next) => {
  try {
    // Get and validate authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing'
      });
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Use: Bearer <token>'
      });
    }

    try {
      // First try to verify as Firebase ID token
      const firebaseUser = await admin.auth().verifyIdToken(token);
      
      req.user = {
        id: firebaseUser.uid,
        role: firebaseUser.role || 'user', // Default role if not set
        email: firebaseUser.email,
        firebase: true // Flag to indicate this is a Firebase-authenticated user
      };

      // Attempt to map Firebase UID to our Mongo User _id
      try {
        const dbUser = await User.findOne({ firebaseUid: firebaseUser.uid }).select('_id role');
        if (dbUser) {
          req.user.mongoId = dbUser._id;
          // Prefer backend role if present
          if (dbUser.role) req.user.role = dbUser.role;
        }
      } catch (mapErr) {
        console.error('User mapping error:', mapErr.message);
      }
      
      return next();
    } catch (firebaseError) {
      // If Firebase verification fails, try as custom JWT
      try {
        const decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256'],
          ignoreExpiration: false
        });
        
        req.user = {
          id: decoded.id,
          role: decoded.role || 'user',
          ...(decoded.email && { email: decoded.email })
        };
        // For custom JWTs that carry Mongo id, expose it as mongoId
        if (decoded.id) {
          req.user.mongoId = decoded.id;
        }
        
        return next();
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError);
        // If both verifications fail, return error
        throw new Error('Invalid token');
      }
    }
  } catch (err) {
    console.error('Authentication error:', err.name, err.message);
    
    // Enhanced error responses
    let errorMessage = 'Authentication failed';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
    }

    return res.status(401).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Enhanced authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Requires one of these roles: ${roles.join(', ')}`,
        yourRole: req.user.role, // Debug info
        requiredRoles: roles
      });
    }

    next();
  };
};
// In auth.js
module.exports = {
  authenticate,
  authorize
};