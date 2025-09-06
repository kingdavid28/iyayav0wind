const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const ErrorResponse = require('../utils/errorResponse');
const auditService = require('../services/auditService');
const { jwtSecret, jwtExpiry, refreshTokenSecret, refreshTokenExpiry } = require('../config/auth');
const fs = require('fs');
const path = require('path');

// Normalize incoming human-friendly roles to backend-internal roles
function normalizeIncomingRole(input) {
  const v = String(input || '').toLowerCase();
  if (v === 'parent' || v === 'client') return { role: 'parent', userType: 'parent' };
  if (v === 'caregiver' || v === 'provider' || v === 'nanny') return { role: 'caregiver', userType: 'caregiver' };
  // Do NOT allow admin creation via public flows; map to parent
  if (v === 'admin') return { role: 'parent', userType: 'parent' };
  // Default to parent for safety
  return { role: 'parent', userType: 'parent' };
}

// Helper function to generate tokens
const generateTokens = (user) => {
  // Map legacy roles for JWT tokens
  let tokenRole = user.role;
  if (user.role === 'provider' || user.userType === 'provider') {
    tokenRole = 'caregiver';
  } else if (user.role === 'client' || user.userType === 'client') {
    tokenRole = 'parent';
  }
  
  const accessToken = jwt.sign(
    { id: user._id, role: tokenRole },
    jwtSecret,
    { expiresIn: jwtExpiry }
  );

  const refreshToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiry }
  );

  return { accessToken, refreshToken };
};

// Accept base64 image, store to uploads/, update user.profileImage, return URL
exports.uploadProfileImageBase64 = async (req, res, next) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 is required' });
    }

    // Support data URLs like: data:image/png;base64,XXXX
    let base64String = imageBase64;
    let detectedMime = mimeType;
    const dataUrlMatch = /^data:(.+);base64,(.*)$/.exec(imageBase64);
    if (dataUrlMatch) {
      detectedMime = dataUrlMatch[1];
      base64String = dataUrlMatch[2];
    }

    // Determine extension
    const extFromMime = (mt) => {
      if (!mt) return 'png';
      const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/jpg': 'jpg' };
      return map[mt] || 'png';
    };
    const ext = extFromMime(detectedMime);

    // Create uploads dir if not exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    // File name by user id and timestamp
    const fileName = `profile_${req.user.id}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    // Write file
    const buffer = Buffer.from(base64String, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Public URL
    const publicUrl = `/uploads/${fileName}`;

    // Update user profileImage
    let query = { _id: req.user.id };
    const user = await User.findOneAndUpdate(query, { profileImage: publicUrl }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ success: true, data: { url: publicUrl, user } });
  } catch (err) {
    console.error('Error in uploadProfileImageBase64:', err);
    return next(new ErrorResponse('Failed to upload image', 500));
  }
};

// Update current authenticated user's basic profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, profileImage, children } = req.body || {};

    // Build update object only with provided fields
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof phone === 'string') update.phone = phone;
    if (profileImage) update.profileImage = profileImage;
    // Allow parents to update children via /auth/profile as well
    if (Array.isArray(children)) {
      try {
        // Fetch user to verify role
        const current = await User.findById(req.user.id).select('role userType');
        const isParent = current && (current.role === 'client' || current.role === 'parent' || current.userType === 'client' || current.userType === 'parent');
        if (!isParent) {
          return res.status(403).json({ success: false, error: 'Only parent users can update children.' });
        }
        // Basic sanitization of children payload
        update.children = children
          .filter(c => c && typeof c.name === 'string' && c.name.trim().length > 0)
          .map(c => ({
            name: String(c.name).trim(),
            birthdate: c.birthdate ? new Date(c.birthdate) : undefined,
            notes: typeof c.notes === 'string' ? c.notes : undefined
          }));
      } catch (e) {
        return res.status(400).json({ success: false, error: 'Invalid children data' });
      }
    }
    if (address && typeof address === 'object') {
      update.address = {
        ...(address.street && { street: address.street }),
        ...(address.city && { city: address.city }),
        ...(address.province && { province: address.province }),
        ...(address.postalCode && { postalCode: address.postalCode }),
        ...(address.country && { country: address.country })
      };
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    // JWT lookup
    let query = { _id: req.user.id };

    const user = await User.findOneAndUpdate(query, update, { new: true, runValidators: true }).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Error in updateProfile:', err);
    return next(new ErrorResponse('Failed to update profile', 500));
  }
};

// Update children array for logged-in parent user
exports.updateChildren = async (req, res, next) => {
  try {
    const { children } = req.body;
    if (!Array.isArray(children)) {
      return res.status(400).json({ success: false, error: 'Children must be an array.' });
    }
    // Only allow parents to update children
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'client' || user.userType !== 'client') {
      return res.status(403).json({ success: false, error: 'Only parent users can update children.' });
    }
    user.children = children;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update children.' });
  }
};

// Update role for current authenticated user (parent/caregiver)
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!role) {
      return res.status(400).json({ success: false, error: 'role is required' });
    }

    const { role: internalRole, userType } = normalizeIncomingRole(role);

    // JWT lookup
    let query = { _id: req.user.id };

    const user = await User.findOneAndUpdate(
      query,
      { role: internalRole, userType },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    auditService.logSecurityEvent('USER_ROLE_UPDATED', {
      userId: user._id?.toString?.() || req.user.id,
      newRole: internalRole,
      newUserType: userType,
      via: req.user.firebase ? 'firebase' : 'jwt',
      timestamp: new Date(),
    });

    // If moving to caregiver role, make sure a caregiver profile exists with proper name
    if (internalRole === 'caregiver' && user && user._id) {
      try {
        const existing = await Caregiver.findOne({ userId: user._id }).select('_id');
        if (!existing) {
          await Caregiver.create({
            userId: user._id,
            name: (user.name && user.name.trim().length > 0) ? user.name.trim() : (user.email ? user.email.split('@')[0] : 'Caregiver'),
            bio: '',
            profileImage: user.profileImage || '',
            skills: [],
            certifications: [],
            ageCareRanges: [],
            emergencyContacts: [],
            documents: [],
            portfolio: { images: [], videos: [] },
            availability: {
              days: [],
              hours: { start: '08:00', end: '18:00' },
              flexible: false,
              weeklySchedule: {
                Monday: { available: false, timeSlots: [] },
                Tuesday: { available: false, timeSlots: [] },
                Wednesday: { available: false, timeSlots: [] },
                Thursday: { available: false, timeSlots: [] },
                Friday: { available: false, timeSlots: [] },
                Saturday: { available: false, timeSlots: [] },
                Sunday: { available: false, timeSlots: [] }
              }
            },
            verification: {
              profileComplete: false,
              identityVerified: false,
              certificationsVerified: false,
              referencesVerified: false,
              trustScore: 0,
              badges: []
            },
            backgroundCheck: { status: 'not_started', provider: 'internal', checkTypes: [] }
          });
        }
      } catch (cgErr) {
        console.warn('Warning: failed to ensure caregiver profile on role update:', cgErr?.message || cgErr);
      }
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('Error in updateRole:', err);
    return next(new ErrorResponse('Failed to update role', 500));
  }
};

// Get current authenticated user
const Contract = require('../models/Contract');

// Helper: check if user is admin
function isAdmin(user) {
  return user && (user.role === 'admin' || user.userType === 'admin');
}

// Helper: check if user has contract with parent (client)
async function hasActiveContractWithParent(requesterId, parentId) {
  if (!requesterId || !parentId) return false;
  const contract = await Contract.findOne({
    $or: [
      { clientId: parentId, providerId: requesterId },
      { clientId: requesterId, providerId: parentId }
    ],
    status: { $in: ['active', 'completed'] }
  });
  return !!contract;
}

// Get current authenticated user (works with both Firebase and custom JWT)
exports.getCurrentUser = async (req, res, next) => {
  try {
    // For JWT users
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    
    // If self-access (user requesting own profile), return all info
    if (req.user.id === String(user._id)) {
      const obj = user.toObject ? user.toObject() : user;
      const mappedRole = (obj.role === 'admin' || obj.userType === 'admin')
        ? 'parent'
        : (obj.role === 'client' || obj.userType === 'client')
          ? 'parent'
          : (obj.role === 'provider' || obj.userType === 'provider')
            ? 'caregiver'
            : (obj.role || 'parent');
      return res.status(200).json({ ...obj, role: mappedRole });
    }
    
    // For other users, only expose public info
    let publicUser = {
      _id: user._id,
      name: user.name,
      children: user.children,
      status: user.status
    };
    
    // Include contact info only for admin or users with active contracts
    let includeContact = false;
    if (req.user && (isAdmin(req.user) || (await hasActiveContractWithParent(req.user.id, user._id)))) {
      includeContact = true;
    }
    
    if (includeContact) {
      publicUser.email = user.email;
      publicUser.phone = user.phone;
    }
    
    const mappedRole = (user.role === 'admin' || user.userType === 'admin')
      ? 'parent'
      : (user.role === 'client' || user.userType === 'client')
        ? 'parent'
        : (user.role === 'provider' || user.userType === 'provider')
          ? 'caregiver'
          : (user.role || 'parent');
    return res.status(200).json({ ...publicUser, role: mappedRole });
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    next(new ErrorResponse('Server error', 500));
  }
};

// User login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  try {
    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 Login attempt for:', email, 'User found:', !!user);

    if (!user) {
      console.log('❌ User not found in database for email:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('🔐 Password match for', email, ':', isMatch);

    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ Login successful for user:', email, 'ID:', user._id);
    res.status(200).json({
      success: true,
      token: accessToken
    });
  } catch (err) {
    next(new ErrorResponse('Login failed', 500));
  }
};

// User registration
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  try {
    // Normalize incoming role to internal values
    const { role: internalRole, userType } = normalizeIncomingRole(role);

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: internalRole,
      userType
    });

    // If registering as caregiver, auto-create a minimal caregiver profile using real name
    if (internalRole === 'caregiver') {
      try {
        const existing = await Caregiver.findOne({ userId: user._id }).select('_id');
        if (!existing) {
          await Caregiver.create({
            userId: user._id,
            name: (user.name && user.name.trim().length > 0) ? user.name.trim() : (user.email ? user.email.split('@')[0] : 'Caregiver'),
            bio: '',
            profileImage: user.profileImage || '',
            skills: [],
            certifications: [],
            ageCareRanges: [],
            emergencyContacts: [],
            documents: [],
            portfolio: { images: [], videos: [] },
            availability: {
              days: [],
              hours: { start: '08:00', end: '18:00' },
              flexible: false,
              weeklySchedule: {
                Monday: { available: false, timeSlots: [] },
                Tuesday: { available: false, timeSlots: [] },
                Wednesday: { available: false, timeSlots: [] },
                Thursday: { available: false, timeSlots: [] },
                Friday: { available: false, timeSlots: [] },
                Saturday: { available: false, timeSlots: [] },
                Sunday: { available: false, timeSlots: [] }
              }
            },
            verification: {
              profileComplete: false,
              identityVerified: false,
              certificationsVerified: false,
              referencesVerified: false,
              trustScore: 0,
              badges: []
            },
            backgroundCheck: { status: 'not_started', provider: 'internal', checkTypes: [] }
          });
        }
      } catch (cgErr) {
        // Log but do not block registration
        console.warn('Warning: failed to auto-create caregiver profile on register:', cgErr?.message || cgErr);
      }
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      token: accessToken
    });
  } catch (err) {
    // Provide clearer error responses for common failure cases
    console.error('Registration error:', err && (err.message || err));
    // Duplicate email error from Mongo/Mongoose (various shapes)
    const msg = (err && err.message) || '';
    const isDupCode = err && (err.code === 11000 || err.code === 'E11000');
    const isDupMsg = /duplicate key/i.test(msg) || /email already exists/i.test(msg);
    const isDupKey = err && (err.keyPattern?.email || err.keyValue?.email);
    if (isDupCode || isDupMsg || isDupKey) {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }
    // Mongoose validation error
    if (err && err.name === 'ValidationError') {
      const details = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ success: false, error: 'Validation error', details });
    }
    return next(new ErrorResponse('Registration failed', 500));
  }
};

// User logout
exports.logout = async (req, res, next) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    // Invalidate refresh token by incrementing tokenVersion
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { tokenVersion: 1 }
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(new ErrorResponse('Logout failed', 500));
  }
};

// Refresh access token
exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(new ErrorResponse('Not authorized', 401));
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshTokenSecret);

    // Check if user exists and token version matches
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      return next(new ErrorResponse('Not authorized', 401));
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: jwtExpiry }
    );

    res.status(200).json({
      success: true,
      token: accessToken
    });
  } catch (err) {
    next(new ErrorResponse('Not authorized', 401));
  }
};

// Reset password
exports.resetPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    
    // Hash and save temporary password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    console.log(`🔑 Temporary password for ${email}: ${tempPassword}`);

    res.status(200).json({
      success: true,
      message: 'Temporary password generated. Check console for password.',
      tempPassword // Remove in production
    });
  } catch (err) {
    next(new ErrorResponse('Reset password failed', 500));
  }
};

// Make sure all required methods are exported
module.exports = {
  getCurrentUser: exports.getCurrentUser,
  login: exports.login,
  logout: exports.logout,
  register: exports.register,
  refreshToken: exports.refreshToken,
  updateChildren: exports.updateChildren,
  updateProfile: exports.updateProfile,
  updateRole: exports.updateRole,
  uploadProfileImageBase64: exports.uploadProfileImageBase64,
  resetPassword: exports.resetPassword
};