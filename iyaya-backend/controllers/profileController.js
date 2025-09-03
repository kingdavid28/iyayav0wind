const User = require('../models/User');
const { validationResult } = require('express-validator');
const { errorHandler } = require('../utils/errorHandler');
const { logger } = require('../utils/logger');

/**
 * Profile Controller
 * Handles user profile management operations
 */

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId)
      .select('-password -refreshTokens')
      .populate('children', 'name age specialNeeds')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Format response based on user role
    const profileData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    // Add role-specific data
    if (user.role === 'parent') {
      profileData.children = user.children || [];
      profileData.address = user.address;
      profileData.emergencyContact = user.emergencyContact;
    } else if (user.role === 'caregiver') {
      profileData.age = user.age;
      profileData.experience = user.experience;
      profileData.hourlyRate = user.hourlyRate;
      profileData.bio = user.bio;
      profileData.specialties = user.specialties || [];
      profileData.certifications = user.certifications || [];
      profileData.availability = user.availability;
      profileData.location = user.location;
      profileData.rating = user.rating || 0;
      profileData.reviewCount = user.reviewCount || 0;
    }

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id || req.user._id;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated here
    delete updates.password;
    delete updates.email; // Email changes require verification
    delete updates.role;
    delete updates.verified;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        ...updates,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true,
        select: '-password -refreshTokens'
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Profile updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Update profile image
exports.updateProfileImage = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Image data is required'
      });
    }

    // In a real app, you'd upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll store the base64 data directly (not recommended for production)
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        avatar: imageBase64,
        updatedAt: new Date()
      },
      { 
        new: true,
        select: '-password -refreshTokens'
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Profile image updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        avatar: user.avatar
      }
    });

  } catch (error) {
    logger.error('Update profile image error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Update children (for parents)
exports.updateChildren = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id || req.user._id;
    const { children } = req.body;

    // Verify user is a parent
    const user = await User.findById(userId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can update children information'
      });
    }

    // Validate children data
    if (!Array.isArray(children)) {
      return res.status(400).json({
        success: false,
        error: 'Children must be an array'
      });
    }

    // Update user with children data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        children: children.map(child => ({
          name: child.name,
          age: child.age,
          gender: child.gender,
          specialNeeds: child.specialNeeds || [],
          notes: child.notes || ''
        })),
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true,
        select: '-password -refreshTokens'
      }
    );

    logger.info(`Children updated for parent ${userId}`);

    res.json({
      success: true,
      message: 'Children information updated successfully',
      data: {
        children: updatedUser.children
      }
    });

  } catch (error) {
    logger.error('Update children error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Get caregiver availability
exports.getAvailability = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const user = await User.findById(userId).select('availability role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role !== 'caregiver') {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers have availability schedules'
      });
    }

    res.json({
      success: true,
      data: {
        availability: user.availability || {}
      }
    });

  } catch (error) {
    logger.error('Get availability error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Update caregiver availability
exports.updateAvailability = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user.id || req.user._id;
    const { availability } = req.body;

    // Verify user is a caregiver
    const user = await User.findById(userId);
    if (!user || user.role !== 'caregiver') {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers can update availability'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        availability,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true,
        select: 'availability'
      }
    );

    logger.info(`Availability updated for caregiver ${userId}`);

    res.json({
      success: true,
      message: 'Availability updated successfully',
      data: {
        availability: updatedUser.availability
      }
    });

  } catch (error) {
    logger.error('Update availability error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};
