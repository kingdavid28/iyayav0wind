const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const ErrorResponse = require('../utils/errorResponse');
const auditService = require('../services/auditService');
const emailService = require('../services/emailService');
const { jwtSecret, jwtExpiry, refreshTokenSecret, refreshTokenExpiry } = require('../config/auth');
const fs = require('fs');
const path = require('path');

// Normalize incoming human-friendly roles to backend-internal roles
function normalizeIncomingRole(input) {
  const v = String(input || '').toLowerCase();
  if (v === 'parent' || v === 'client') return { role: 'parent', userType: 'parent' };
  if (v === 'caregiver' || v === 'nanny') return { role: 'caregiver', userType: 'caregiver' };
  // Do NOT allow admin creation via public flows; map to parent
  if (v === 'admin') return { role: 'parent', userType: 'parent' };
  // Default to parent for safety
  return { role: 'parent', userType: 'parent' };
}

// Helper function to generate tokens
const generateTokens = (user) => {
  // Map legacy roles for JWT tokens
  let tokenRole = user.role;
  if (user.role === 'client' || user.userType === 'client') {
    tokenRole = 'parent';
  }
  
  const accessToken = jwt.sign(
    { id: user._id, role: tokenRole },
    jwtSecret,
    { expiresIn: jwtExpiry, algorithm: 'HS256' }
  );

  const refreshToken = jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiry, algorithm: 'HS256' }
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
      
      // Include email verification status
      const responseObj = {
        ...obj,
        role: mappedRole,
        emailVerified: obj.verification?.emailVerified || false
      };
      
      return res.status(200).json(responseObj);
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
  console.log('🌐 Login request received:', { email, hasPassword: !!password });

  // Validate email & password
  if (!email || !password) {
    console.log('❌ Missing credentials:', { email: !!email, password: !!password });
    return res.status(400).json({ success: false, error: 'Please provide an email and password' });
  }

  try {
    // Check total user count first
    const userCount = await User.countDocuments();
    console.log('📊 Total users in database:', userCount);

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    console.log('🔍 Login attempt for:', email, 'User found:', !!user);

    if (!user) {
      console.log('❌ User not found in database for email:', email);

      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if email is verified
    const isEmailVerified = user.verification?.emailVerified || user.emailVerified || false;
    if (!isEmailVerified) {
      console.log('❌ Email not verified for user:', email);
      return res.status(401).json({ 
        success: false, 
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        requiresVerification: true
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    console.log('🔐 Password match for', email, ':', isMatch);

    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
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
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('💥 Login error:', err);
    res.status(500).json({ success: false, error: 'Login failed: ' + err.message });
  }
};

// User registration
exports.register = async (req, res, next) => {
  const { name, email, password, role } = req.body;
  console.log('📝 Registration request:', { name, email, role, hasPassword: !!password });

  try {
    // Normalize incoming role to internal values
    const { role: internalRole, userType } = normalizeIncomingRole(role);
    console.log('🔄 Normalized role:', { input: role, internal: internalRole, userType });

      // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: internalRole,
      userType,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      middleInitial: req.body.middleInitial,
      birthDate: req.body.birthDate ? new Date(req.body.birthDate) : undefined,
      phone: req.body.phone
    });
    console.log('✅ User created:', user.email, 'with role:', user.role);

    // Send verification email
    try {
      const verificationToken = await user.createVerificationToken();

      
      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
      console.log('📧 Verification email sent to:', user.email);
      
      // Log for development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✉️ Email verification for ${user.email}:`);
        console.log(`Verification token: ${verificationToken}`);
      }
    } catch (emailError) {
      console.warn('⚠️ Failed to send verification email:', emailError.message);
    }

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

    console.log('✅ Registration successful for:', user.email);
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      requiresVerification: true
    });
  } catch (err) {
    // Provide clearer error responses for common failure cases
    console.error('💥 Registration error:', err && (err.message || err));
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
    return res.status(500).json({ success: false, error: 'Registration failed: ' + err.message });
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
      { expiresIn: jwtExpiry, algorithm: 'HS256' }
    );

    res.status(200).json({
      success: true,
      token: accessToken
    });
  } catch (err) {
    next(new ErrorResponse('Not authorized', 401));
  }
};

// Request password reset
exports.resetPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Please provide an email', 400));
  }

  try {
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate secure reset token
    const resetToken = await user.createPasswordResetToken();
    
    try {
      // Send email with reset link
      await emailService.sendPasswordResetEmail(user.email, resetToken);
      
      // Log for development
      if (process.env.NODE_ENV === 'development') {
        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/reset-password/${resetToken}`;
        console.log(`🔑 Password reset for ${email}:`);
        console.log(`Reset URL: ${resetURL}`);
        console.log(`Token expires in 10 minutes`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.'
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError.message);
      
      // Fallback for development
      if (process.env.NODE_ENV === 'development') {
        const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/reset-password/${resetToken}`;
        console.log(`🔑 Email failed, password reset for ${email}:`);
        console.log(`Reset URL: ${resetURL}`);
        
        res.status(200).json({
          success: true,
          message: 'Password reset link generated. Check console in development mode.',
          resetURL // Only in development
        });
      } else {
        throw new Error('Failed to send reset email');
      }
    }
  } catch (err) {
    console.error('Reset password error:', err);
    next(new ErrorResponse('Reset password failed', 500));
  }
};

// Check if email exists
exports.checkEmailExists = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('_id');
    
    res.status(200).json({
      success: true,
      exists: !!user
    });
  } catch (err) {
    console.error('Check email error:', err);
    res.status(500).json({ success: false, error: 'Failed to check email' });
  }
};

// Confirm password reset with token
exports.confirmPasswordReset = async (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return next(new ErrorResponse('Token and new password are required', 400));
  }

  const minLength = process.env.NODE_ENV === 'production' ? 12 : 8;
  if (newPassword.length < minLength) {
    return next(new ErrorResponse(`Password must be at least ${minLength} characters`, 400));
  }
  
  // Production password strength validation
  if (process.env.NODE_ENV === 'production') {
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      return next(new ErrorResponse('Password must contain uppercase, lowercase, number, and symbol', 400));
    }
  }

  try {
    // Hash the token to compare with stored hash
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = Date.now();
    
    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    // Log security event
    auditService.logSecurityEvent('PASSWORD_RESET_COMPLETED', {
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (err) {
    console.error('Confirm password reset error:', err);
    next(new ErrorResponse('Password reset failed', 500));
  }
};



// Verify email with token
exports.verifyEmail = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ErrorResponse('Verification token is required', 400));
  }

  try {
    console.log('🔍 Verifying token:', token);
    
    // Hash the token to compare with stored hash
    const hashedToken = require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    console.log('🔑 Hashed token:', hashedToken);

    // First check if any user has this token (regardless of expiry)
    const userWithToken = await User.findOne({
      'verification.token': hashedToken
    });
    
    console.log('👤 User with token found:', !!userWithToken);
    if (userWithToken) {
      console.log('⏰ Token expires at:', userWithToken.verification.expires);
      console.log('🕐 Current time:', new Date());
      console.log('✅ Token valid:', userWithToken.verification.expires > Date.now());
    }

    const user = await User.findOne({
      'verification.token': hashedToken,
      'verification.expires': { $gt: Date.now() }
    });

    if (!user) {
      // Check if token exists but expired
      if (userWithToken) {
        console.log('⚠️ Token expired for user:', userWithToken.email);
        return next(new ErrorResponse('Verification token has expired. Please request a new verification email.', 400));
      }
      console.log('❌ No user found with valid token');
      return next(new ErrorResponse('Invalid or expired verification token', 400));
    }

    // Mark email as verified
    user.verification.emailVerified = true;
    user.verification.token = undefined;
    user.verification.expires = undefined;
    
    await user.save();

    // Generate tokens for auto-login
    const { accessToken, refreshToken } = generateTokens(user);

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ Email verified for:', user.email);
    
    // Check if request is from browser (has Accept header) or app
    const isFromBrowser = req.headers.accept && req.headers.accept.includes('text/html');
    
    if (isFromBrowser) {
      // Try Expo Go first, then custom scheme
      const expoURL = `exp://192.168.1.26:8081/--/verify-email?token=${token}`;
      const customURL = `iyaya://verify-email?token=${token}`;
      
      // Create a redirect page that tries both
      const redirectHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Opening iYaya App...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Opening iYaya App...</h2>
          <p>If the app doesn't open automatically, try these links:</p>
          <p><a href="${expoURL}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px;">Open in Expo Go</a></p>
          <p><a href="${customURL}" style="background: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin: 10px;">Open in iYaya App</a></p>
          <script>
            // Try Expo Go first
            setTimeout(() => {
              window.location.href = '${expoURL}';
            }, 1000);
            
            // Fallback to custom scheme after 3 seconds
            setTimeout(() => {
              window.location.href = '${customURL}';
            }, 3000);
          </script>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(redirectHTML);
    } else {
      // Return JSON for app requests
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        token: accessToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true
        }
      });
    }
  } catch (err) {
    console.error('Email verification error:', err);
    next(new ErrorResponse('Email verification failed', 500));
  }
};

// Resend verification email
exports.resendVerification = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.verification?.emailVerified) {
      return res.status(400).json({ success: false, error: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = await user.createVerificationToken();

    // Send verification email
    await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    console.log('📧 New verification email sent to:', user.email);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    next(new ErrorResponse('Failed to resend verification email', 500));
  }
};

// Firebase sync - create/update user from Firebase
exports.firebaseSync = async (req, res, next) => {
  try {
    const { 
      firebaseUid, 
      email, 
      name, 
      firstName, 
      lastName, 
      middleInitial, 
      birthDate, 
      phone, 
      role, 
      emailVerified 
    } = req.body;
    
    let user = await User.findOne({ firebaseUid });
    
    if (!user) {
      user = await User.create({
        firebaseUid,
        email,
        name,
        firstName,
        lastName,
        middleInitial,
        birthDate,
        phone,
        role: role || 'parent',
        userType: role || 'parent',
        verification: { emailVerified: emailVerified || false }
      });
      
      // Auto-create caregiver profile if role is caregiver
      if (role === 'caregiver') {
        try {
          await Caregiver.create({
            userId: user._id,
            name: name || `${firstName || ''} ${lastName || ''}`.trim() || 'Caregiver',
            bio: '',
            skills: [],
            certifications: [],
            ageCareRanges: [],
            availability: {
              days: [],
              hours: { start: '08:00', end: '18:00' },
              flexible: false
            },
            verification: {
              profileComplete: false,
              identityVerified: false,
              certificationsVerified: false,
              referencesVerified: false,
              trustScore: 0,
              badges: []
            }
          });
        } catch (cgErr) {
          console.warn('Failed to create caregiver profile:', cgErr.message);
        }
      }
    } else {
      // Update existing user
      if (user.verification) {
        user.verification.emailVerified = emailVerified || false;
      } else {
        user.verification = { emailVerified: emailVerified || false };
      }
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (middleInitial) user.middleInitial = middleInitial;
      if (birthDate) user.birthDate = birthDate;
      if (phone) user.phone = phone;
      await user.save();
    }
    
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error('Firebase sync error:', err);
    return res.status(500).json({ success: false, error: 'Firebase sync failed' });
  }
};

// Send custom verification email
exports.sendCustomVerification = async (req, res, next) => {
  try {
    const { email, name, role, uid } = req.body;
    
    const verifyURL = `https://iyayav0.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=${encodeURIComponent(uid)}&continueUrl=${encodeURIComponent(`exp://192.168.1.10:8081/--/verify-success?role=${encodeURIComponent(role)}`)}`;
    const expoGoURL = `exp://192.168.1.10:8081/--/verify-success?role=${role}`;
    const customSchemeURL = `iyaya://verify-success?role=${role}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify Your iYaya Account',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your iYaya Account</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <tr>
      <td style="padding: 40px 30px; text-align: center;">
        <h2 style="color: #db2777; margin: 0 0 20px 0;">Welcome to iYaya!</h2>
        <p style="margin: 0 0 15px 0; color: #333;">Hi ${name.replace(/[<>&"']/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;'})[c])},</p>
        <p style="margin: 0 0 30px 0; color: #666; line-height: 1.5;">Thank you for creating an account with iYaya. Please click the button below to verify your email address and activate your account:</p>
        
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="background-color: #db2777; border-radius: 8px;">
              <a href="${verifyURL}" style="display: block; padding: 15px 30px; color: white; text-decoration: none; font-weight: bold; font-size: 16px;">Verify Email Address</a>
            </td>
          </tr>
        </table>
        
        <p style="margin: 30px 0 15px 0; color: #333; font-weight: bold;">Alternative Options:</p>
        
        <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
          <tr>
            <td style="padding: 5px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 6px;">
                    <a href="${expoGoURL}" style="display: block; padding: 10px 20px; color: white; text-decoration: none; font-size: 14px;">Open in Expo Go</a>
                  </td>
                </tr>
              </table>
            </td>
            <td style="padding: 5px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #16a34a; border-radius: 6px;">
                    <a href="${customSchemeURL}" style="display: block; padding: 10px 20px; color: white; text-decoration: none; font-size: 14px;">Open in iYaya App</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <p style="margin: 30px 0 10px 0; color: #333;">If the buttons don't work, copy this link:</p>
        <p style="word-break: break-all; color: #0066cc; background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; margin: 0 0 20px 0;">${verifyURL}</p>
        
        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        <p style="margin: 0; color: #666; font-size: 14px;">If you didn't create this account, please ignore this email.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px; margin: 0;">iYaya - Connecting Families with Trusted Caregivers</p>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    };
    
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('Custom verification email error:', err);
    next(new ErrorResponse('Failed to send verification email', 500));
  }
};

// Get Firebase user profile
exports.getFirebaseProfile = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    // Extract token from Bearer header
    const token = authHeader.split(' ')[1];
    
    // Decode Firebase token to get UID
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const firebaseUid = payload.user_id || payload.uid;
      
      if (firebaseUid) {
        // Find user by Firebase UID with complete profile
        const user = await User.findOne({ firebaseUid }).select('-password');
        console.log('🔍 Looking for user with Firebase UID:', firebaseUid);
        console.log('👤 Found user in MongoDB:', !!user);
        if (user) {
          console.log('📋 User data:', {
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            birthDate: user.birthDate,
            phone: user.phone,
            role: user.role
          });
          let profileData = {
            id: user._id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            middleInitial: user.middleInitial,
            birthDate: user.birthDate,
            phone: user.phone,
            role: user.role || 'parent',
            userType: user.userType || 'parent',
            profileImage: user.profileImage,
            address: user.address,
            children: user.children || [],
            emailVerified: user.verification?.emailVerified || false
          };
          
          // If caregiver, include caregiver-specific data
          if (user.role === 'caregiver') {
            const caregiverProfile = await Caregiver.findOne({ userId: user._id });
            if (caregiverProfile) {
              profileData.caregiverProfile = {
                bio: caregiverProfile.bio,
                skills: caregiverProfile.skills,
                certifications: caregiverProfile.certifications,
                hourlyRate: caregiverProfile.hourlyRate,
                availability: caregiverProfile.availability,
                rating: caregiverProfile.rating,
                reviewCount: caregiverProfile.reviewCount
              };
            }
          }
          
          return res.status(200).json(profileData);
        }
      }
    } catch (decodeError) {
      console.warn('Token decode failed:', decodeError.message);
    }
    
    // Return default profile if user not found
    res.status(200).json({ role: 'parent', userType: 'parent' });
  } catch (err) {
    console.error('Firebase profile error:', err);
    next(new ErrorResponse('Failed to get Firebase profile', 500));
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
  resetPassword: exports.resetPassword,
  confirmPasswordReset: exports.confirmPasswordReset,
  checkEmailExists: exports.checkEmailExists,
  verifyEmail: exports.verifyEmail,
  resendVerification: exports.resendVerification,
  firebaseSync: exports.firebaseSync,
  getFirebaseProfile: exports.getFirebaseProfile,
  sendCustomVerification: exports.sendCustomVerification
};