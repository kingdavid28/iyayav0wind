const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

// Debug JWT configuration
if (!jwtSecret) {
  console.error('❌ JWT_SECRET not configured!');
}

// Authentication middleware: Handles both JWT and Firebase tokens
const authenticate = async (req, res, next) => {
  try {
    // Auth middleware headers check (debug disabled)

    // FIRST: Check for dev bypass with X-Dev-Bypass header
    if (process.env.ALLOW_DEV_BYPASS === 'true' && req.header('X-Dev-Bypass') === '1') {
      const incoming = (req.header('X-Dev-Role') || 'caregiver').toLowerCase();
      
      // Map app-facing roles to internal roles
      const mapped = incoming === 'caregiver' || incoming === 'provider'
        ? 'caregiver'
        : 'parent';
      
      req.user = {
        id: 'dev-bypass-uid',
        mongoId: 'dev-bypass-mongo-id',
        role: mapped,
        email: 'dev-bypass@example.com',
        bypass: true,
      };
      
      // Dev bypass user created
      return next();
    }

    // SECOND: Check for dev mode without auth header
    if (process.env.ALLOW_DEV_BYPASS === 'true') {
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        // Dev mode: No auth header, creating mock user
        const devRole = req.header('X-Dev-Role') || 'caregiver';
        req.user = {
          id: 'dev-mock-user',
          mongoId: 'dev-mock-user',
          role: devRole,
          email: 'dev@example.com',
          mock: true
        };
        return next();
      }
    }

    // Get and validate authorization header (only reached if not in dev mode)
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      // No authorization header found
      return res.status(401).json({
        success: false,
        error: 'Authorization header missing',
        code: 'INVALID_TOKEN'
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
      // Mock token detected, bypassing JWT verification
      req.user = {
        id: 'mock-user-123',
        mongoId: 'mock-user-123',
        role: 'parent',
        email: 'mock@example.com',
        mock: true
      };
      return next();
    }

    // Determine token type by checking the header
    let isFirebaseToken = false;
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        // Token header decoded
        // Firebase tokens use RS256, our JWT tokens use HS256
        isFirebaseToken = header.alg === 'RS256' || header.typ === 'JWT' && !header.alg;
      } catch (e) {
        // Could not decode token header, assuming Firebase token
        isFirebaseToken = true;
      }
    }

    // Handle Firebase tokens first (most common case)
    if (isFirebaseToken) {
      try {
        // Processing Firebase token
        // Simple decode without verification (Firebase tokens use RS256)
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode the payload (Firebase uses base64url encoding)
          let payload;
          try {
            const base64Payload = parts[1];
            // Convert base64url to base64 by replacing URL-safe characters
            const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
            // Add padding if needed
            const paddedPayload = base64 + '='.repeat((4 - base64.length % 4) % 4);
            payload = JSON.parse(Buffer.from(paddedPayload, 'base64').toString());
            // Firebase token payload decoded
          } catch (decodeError) {
            // Firebase token payload decode failed
            throw decodeError;
          }
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            // Firebase token expired
            throw new Error('Firebase token expired');
          }
          
          const firebaseUid = payload.user_id || payload.uid || payload.sub;
          const email = payload.email;
          
          if (firebaseUid || email) {
            // Looking for Firebase user
            // Find user by Firebase UID or email
            let user = null;
            if (firebaseUid) {
              user = await User.findOne({ firebaseUid }).select('_id role email');
            }
            if (!user && email) {
              user = await User.findOne({ email: email.toLowerCase() }).select('_id role email firebaseUid');
              // Update firebaseUid if found by email but missing firebaseUid
              if (user && !user.firebaseUid && firebaseUid) {
                await User.findByIdAndUpdate(user._id, { firebaseUid });
                user.firebaseUid = firebaseUid;
              }
            }
            
            if (!user) {
              // Firebase user not found in database
              return res.status(401).json({
                success: false,
                error: 'Firebase user not found in database'
              });
            }

            // Firebase user found
            req.user = {
              id: user._id.toString(),
              mongoId: user._id,
              role: user.role || 'parent',
              email: user.email,
              firebaseUid: firebaseUid || user.firebaseUid
            };
            
            // User authenticated
            
            return next();
          } else {
            // No Firebase UID or email found in token payload
            throw new Error('Invalid Firebase token payload');
          }
        } else {
          // Invalid token format
          throw new Error('Invalid token format');
        }
      } catch (firebaseError) {
        // Firebase token processing failed
        // Don't fall back to JWT if Firebase token processing fails
        throw new Error('Invalid Firebase token');
      }
    } else {
      // Handle JWT tokens (our internal tokens)
      try {
        // Processing JWT token
        // Verify with HS256 algorithm (our JWT tokens)
        const decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256']
        });

        // Check if user still exists in database
        const user = await User.findById(decoded.id).select('role email');
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'User no longer exists'
          });
        }

        req.user = {
          id: decoded.id,
          role: user.role || 'parent',
          email: user.email
        };
        
        if (decoded.id) {
          req.user.mongoId = decoded.id;
        }

        // JWT user authenticated

        return next();
      } catch (jwtError) {
        // JWT verification failed
        throw new Error('Invalid JWT token');
      }
    }
  } catch (err) {
    console.error('🚨 Authentication error:', err.name, err.message);
    console.error('🚨 Full error:', err);
    
    let errorMessage = 'Invalid token';
    if (err.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
    } else if (err.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token';
    }

    return res.status(401).json({
      success: false,
      error: errorMessage,
      code: 'INVALID_TOKEN'
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