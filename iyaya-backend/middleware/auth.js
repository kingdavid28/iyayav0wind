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
        : { role: 'parent', userType: 'parent' };
      
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

    // Check for mock token first in development (before JWT verification)
    if (process.env.NODE_ENV === 'development' && token.includes('mock-signature')) {
      console.log('🔧 Mock token detected, bypassing JWT verification');
      req.user = {
        id: 'mock-user-123',
        mongoId: 'mock-user-123',
        role: 'parent',
        userType: 'parent',
        email: 'mock@example.com',
        mock: true
      };
      return next();
    }

    // Try real JWT verification only for non-mock tokens
    try {
      const decoded = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
        ignoreExpiration: false
      });

      // Check if user still exists in database
      const user = await User.findById(decoded.id).select('role userType email');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User no longer exists'
        });
      }

      // Map JWT token roles to correct userType using actual DB data
      let userType = user.userType || user.role || 'user';
      if (user.role === 'provider' || user.userType === 'provider') {
        userType = 'caregiver';
      } else if (user.role === 'caregiver' || user.userType === 'caregiver') {
        userType = 'caregiver';
      } else if (user.role === 'client' || user.userType === 'client') {
        userType = 'parent';
      } else if (user.role === 'parent' || user.userType === 'parent') {
        userType = 'parent';
      }

      req.user = {
        id: decoded.id,
        role: user.role || 'user',
        userType: userType,
        email: user.email
      };
      
      if (decoded.id) {
        req.user.mongoId = decoded.id;
      }

      return next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      throw new Error('Invalid token');
    }
  } catch (err) {
    console.error('Authentication error:', err.name, err.message);
    
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
        yourRole: req.user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};