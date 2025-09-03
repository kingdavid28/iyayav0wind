const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

// Authentication middleware: JWT-only (Firebase Admin removed)
const authenticate = async (req, res, next) => {
  try {
    // Dev-only bypass to help Expo Go flows without a real token
    if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_BYPASS === 'true' && req.header('X-Dev-Bypass') === '1') {
      console.log('🔧 Dev bypass activated');
      const incoming = (req.header('X-Dev-Role') || 'parent').toLowerCase();
      console.log('🔧 Dev bypass role:', incoming);
      
      // Map app-facing roles to internal roles
      const mapped = incoming === 'caregiver' || incoming === 'provider'
        ? { role: 'caregiver', userType: 'caregiver' }
        : { role: 'parent', userType: 'parent' }; // Fixed: use 'parent' instead of 'client'
      
      req.user = {
        id: 'dev-bypass-uid',
        mongoId: 'dev-bypass-mongo-id',
        role: mapped.role,
        userType: mapped.userType,
        email: 'dev-bypass@example.com',
        bypass: true,
      };
      
      console.log('🔧 Dev bypass user created:', req.user);
      
      try {
        // Optionally map to an existing user if present
        const dbUser = await User.findOne({ email: req.user.email.toLowerCase() }).select('_id role userType');
        if (dbUser) {
          req.user.mongoId = dbUser._id;
          if (dbUser.role) req.user.role = dbUser.role;
          if (dbUser.userType) req.user.userType = dbUser.userType;
          console.log('🔧 Dev bypass mapped to DB user:', dbUser._id);
        }
      } catch (_) {}
      return next();
    }

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

    // Verify as custom JWT (HS256)
    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });

      // Map JWT token roles to correct userType
      let userType = decoded.role || 'user';
      if (decoded.role === 'provider') {
        userType = 'caregiver';
      } else if (decoded.role === 'caregiver') {
        userType = 'caregiver';
      } else if (decoded.role === 'client') {
        // For legacy tokens with 'client' role, check actual user profile
        try {
          const User = require('../models/User');
          const user = await User.findById(decoded.id).select('role userType');
          if (user && (user.role === 'caregiver' || user.userType === 'provider')) {
            userType = 'caregiver';
          } else {
            userType = 'parent';
          }
        } catch (dbError) {
          console.error('Error checking user profile for role mapping:', dbError);
          userType = 'parent'; // fallback
        }
      } else if (decoded.role === 'parent') {
        userType = 'parent';
      }

      req.user = {
        id: decoded.id,
        role: decoded.role || 'user',
        userType: userType,
        ...(decoded.email && { email: decoded.email })
      };
      // For custom JWTs that carry Mongo id, expose it as mongoId
      if (decoded.id) {
        req.user.mongoId = decoded.id;
      }

      return next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      throw new Error('Invalid token');
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