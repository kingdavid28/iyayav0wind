const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const User = require('../models/User');

// Debug JWT configuration
if (!jwtSecret) {
  console.error('❌ JWT_SECRET not configured!');
} else {
  console.log('✅ JWT_SECRET loaded:', jwtSecret.substring(0, 10) + '...');
}

// Authentication middleware: Handles both JWT and Firebase tokens
const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware - Headers:', {
      authorization: req.header('Authorization') ? 'Present' : 'Missing',
      devBypass: req.header('X-Dev-Bypass'),
      devRole: req.header('X-Dev-Role'),
      allowDevBypass: process.env.ALLOW_DEV_BYPASS
    });

    // FIRST: Check for dev bypass with X-Dev-Bypass header
    if (process.env.ALLOW_DEV_BYPASS === 'true' && req.header('X-Dev-Bypass') === '1') {
      console.log('🔧 Dev bypass activated with X-Dev-Bypass header');
      const incoming = (req.header('X-Dev-Role') || 'caregiver').toLowerCase();
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
      return next();
    }

    // SECOND: Check for dev mode without auth header
    if (process.env.ALLOW_DEV_BYPASS === 'true') {
      const authHeader = req.header('Authorization');
      if (!authHeader) {
        console.log('🔧 Dev mode: No auth header, creating mock user');
        const devRole = req.header('X-Dev-Role') || 'caregiver';
        req.user = {
          id: 'dev-mock-user',
          mongoId: 'dev-mock-user',
          role: devRole,
          userType: devRole,
          email: 'dev@example.com',
          mock: true
        };
        return next();
      }
    }

    // Get and validate authorization header (only reached if not in dev mode)
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No authorization header found');
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

    // Determine token type by checking the header
    let isFirebaseToken = false;
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
        console.log('🔍 Token header:', header);
        // Firebase tokens use RS256, our JWT tokens use HS256
        isFirebaseToken = header.alg === 'RS256' || header.typ === 'JWT' && !header.alg;
      } catch (e) {
        console.log('⚠️ Could not decode token header, assuming Firebase token');
        isFirebaseToken = true;
      }
    }

    // Handle Firebase tokens first (most common case)
    if (isFirebaseToken) {
      try {
        console.log('🔥 Processing Firebase token...');
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
            console.log('🔥 Firebase token payload:', {
              iss: payload.iss,
              aud: payload.aud,
              user_id: payload.user_id,
              sub: payload.sub,
              exp: payload.exp,
              iat: payload.iat,
              email: payload.email
            });
          } catch (decodeError) {
            console.log('⚠️ Firebase token payload decode failed:', decodeError.message);
            throw decodeError;
          }
          
          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            console.log('⚠️ Firebase token expired:', new Date(payload.exp * 1000));
            throw new Error('Firebase token expired');
          }
          
          const firebaseUid = payload.user_id || payload.uid || payload.sub;
          const email = payload.email;
          
          if (firebaseUid || email) {
            console.log('🔍 Looking for Firebase user:', firebaseUid || email);
            // Find user by Firebase UID or email
            let user = null;
            if (firebaseUid) {
              console.log('🔍 Searching by firebaseUid:', firebaseUid);
              user = await User.findOne({ firebaseUid }).select('_id role userType email');
              console.log('🔍 User found by firebaseUid:', !!user);
            }
            if (!user && email) {
              console.log('🔍 Searching by email:', email.toLowerCase());
              user = await User.findOne({ email: email.toLowerCase() }).select('_id role userType email firebaseUid');
              console.log('🔍 User found by email:', !!user);
              // Update firebaseUid if found by email but missing firebaseUid
              if (user && !user.firebaseUid && firebaseUid) {
                console.log('🔧 Updating user with missing firebaseUid');
                await User.findByIdAndUpdate(user._id, { firebaseUid });
                user.firebaseUid = firebaseUid;
                console.log('✅ FirebaseUid updated for user:', user.email);
              }
            }
            
            if (!user) {
              console.log('❌ Firebase user not found in database:', firebaseUid || email);
              return res.status(401).json({
                success: false,
                error: 'Firebase user not found in database'
              });
            }

            console.log('✅ Firebase user found:', user.email);
            // Ensure role mapping
            let mappedRole = user.role || 'parent';
            let mappedUserType = user.userType || user.role || 'parent';
            
            // Handle caregiver role mapping
            if (mappedRole === 'caregiver' || mappedUserType === 'caregiver') {
              mappedRole = 'caregiver';
              mappedUserType = 'caregiver';
            }
            
            req.user = {
              id: user._id.toString(),
              mongoId: user._id,
              role: mappedRole,
              userType: mappedUserType,
              email: user.email,
              firebaseUid: firebaseUid || user.firebaseUid
            };
            
            console.log('👤 Authenticated user:', {
              id: req.user.id,
              email: req.user.email,
              role: req.user.role,
              userType: req.user.userType
            });
            
            return next();
          } else {
            console.log('⚠️ No Firebase UID or email found in token payload');
            throw new Error('Invalid Firebase token payload');
          }
        } else {
          console.log('⚠️ Invalid token format - not 3 parts:', parts.length);
          throw new Error('Invalid token format');
        }
      } catch (firebaseError) {
        console.log('❌ Firebase token processing failed:', firebaseError.message);
        // Don't fall back to JWT if Firebase token processing fails
        throw new Error('Invalid Firebase token');
      }
    } else {
      // Handle JWT tokens (our internal tokens)
      try {
        console.log('🔑 Processing JWT token...');
        // Verify with HS256 algorithm (our JWT tokens)
        const decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256']
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
        if (user.role === 'caregiver' || user.userType === 'caregiver') {
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

        console.log('✅ JWT user authenticated:', {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          userType: req.user.userType
        });

        return next();
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.name, jwtError.message);
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