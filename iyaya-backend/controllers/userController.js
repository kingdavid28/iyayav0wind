// controllers/userController.js
const User = require('../models/User');

// Get current user profile
exports.getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.user?.mongoId || req.user?._id || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await User.findById(userId)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user profile with consistent format
    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      address: user.address,
      children: user.children,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: profile,
      ...profile // Also include at root level for compatibility
    });
  } catch (error) {
    console.error('Get current user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password -refreshToken') // Keep email and phone for messaging
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user profile with consistent format
    const profile = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      address: user.address,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: profile,
      ...profile // Also include at root level for compatibility
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
};

// Update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.mongoId || req.user?._id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.password;
    delete updateData.email; // Email should be updated separately with verification
    delete updateData.role;
    delete updateData._id;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Get users list
exports.getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};

// Get caregivers list
exports.getCaregivers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'caregiver' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }

    const caregivers = await User.find(query)
      .select('-password -refreshToken -email -phone')
      .sort({ rating: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        caregivers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get caregivers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get caregivers'
    });
  }
};

// Get families list
exports.getFamilies = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { role: 'family' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const families = await User.find(query)
      .select('-password -refreshToken -email -phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        families,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get families'
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};