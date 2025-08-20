const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const auditService = require('../services/auditService');
const { jwtSecret, jwtExpiry, refreshTokenSecret, refreshTokenExpiry } = require('../config/auth');
const fs = require('fs');
const path = require('path');

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
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
    if (req.user.firebase) {
      query = { firebaseUid: req.user.id };
    }
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
    const { name, phone, address, profileImage } = req.body || {};

    // Build update object only with provided fields
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof phone === 'string') update.phone = phone;
    if (profileImage) update.profileImage = profileImage;
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

    // Determine lookup for Firebase vs JWT
    let query = { _id: req.user.id };
    if (req.user.firebase) {
      query = { firebaseUid: req.user.id };
    }

    const user = await User.findOneAndUpdate(query, update, { new: true }).select('-password');

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
    // Check if this is a Firebase-authenticated user
    if (req.user.firebase) {
      try {
        // For Firebase users, we need to find by firebaseUid
        let user = await User.findOne({ firebaseUid: req.user.id }).select('-password');
        
        // If user not found, create a new user record
        if (!user) {
          console.log('Creating new user record for Firebase UID:', req.user.id);
          
          // Generate a simple random password for Firebase users (not used for authentication)
          const randomPassword = 'FIREBASE_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          user = new User({
            firebaseUid: req.user.id,
            email: req.user.email,
            name: req.user.name || (req.user.email ? req.user.email.split('@')[0] : 'New User'),
            password: randomPassword, // Set a random password to satisfy validation
            role: 'client', // Default role
            userType: 'client', // Default userType
            isEmailVerified: true, // Firebase email is already verified
            // Add any other default fields as needed
          });
          
          // Skip password hashing for Firebase users
          user.password = randomPassword;
          user.passwordConfirm = randomPassword;
          
          await user.save({ validateBeforeSave: false });
          console.log('Created new Firebase user:', user._id);
          
          // Fetch the user again to get the full user object
          user = await User.findById(user._id).select('-password');
        }
        
        // Return user data (Firebase users can always see their own data)
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        console.error('Error in Firebase user lookup/creation:', error);
        return next(new ErrorResponse('Error processing user data', 500));
      }
    }
    
    // For custom JWT users
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }
    
    // If self-access (user requesting own profile), return all info
    if (req.user.id === String(user._id)) {
      return res.status(200).json({ success: true, data: user });
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
    
    return res.status(200).json({ success: true, data: publicUser });
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

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
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
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

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
    next(new ErrorResponse('Registration failed', 500));
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

// Make sure all required methods are exported
module.exports = {
  getCurrentUser: exports.getCurrentUser,
  login: exports.login,
  logout: exports.logout,
  register: exports.register,
  refreshToken: exports.refreshToken,
  updateChildren: exports.updateChildren,
  updateProfile: exports.updateProfile,
  uploadProfileImageBase64: exports.uploadProfileImageBase64
};