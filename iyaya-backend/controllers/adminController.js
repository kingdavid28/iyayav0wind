const User = require('../models/User');
const Provider = require('../models/Provider');
const { sendStatusEmail } = require('../services/emailService');
const { logAdminAction } = require('../services/auditService');

// Admin Dashboard - Show Statistics
exports.dashboard = async (req, res) => {
  try {
    const [userCount, providerCount] = await Promise.all([
      User.countDocuments(),
      Provider.countDocuments()
    ]);
    
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-password -__v -verification.token -refreshToken')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        userCount,
        providerCount,
        recentUsers
      }
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// List All Users (with pagination and search)
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, userType, search } = req.query;
    
    const query = {};
    if (userType) query.role = userType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, count] = await Promise.all([
      User.find(query)
        .select('-password -__v -verification.token -refreshToken')
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(query)
    ]);
      
    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: users
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get Single User by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -__v -verification.token -refreshToken')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update User Status
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    // Validate status
    const validStatuses = ['active', 'suspended', 'banned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent modifying admin accounts
    if (user.role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify admin accounts'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        status,
        statusReason: reason || undefined,
        statusUpdatedBy: adminId,
        statusUpdatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    ).select('-password -__v');

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'UPDATE_USER_STATUS',
      targetId: userId,
      details: {
        from: user.status,
        to: status,
        reason
      }
    });

    // Send notification email
    if (user.email) {
      await sendStatusEmail({
        email: user.email,
        name: user.name,
        status,
        reason
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
      message: `User status updated to ${status}`
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify Provider Documents
exports.verifyProviderDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Require reason for rejections
    if (status === 'rejected' && !reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required when rejecting documents'
      });
    }

    const provider = await Provider.findOneAndUpdate(
      { userId },
      { 
        'backgroundCheck.status': status,
        'backgroundCheck.verifiedAt': status === 'approved' ? new Date() : null,
        'backgroundCheck.verifiedBy': adminId,
        'backgroundCheck.reason': status === 'rejected' ? reason : undefined
      },
      { 
        new: true,
        runValidators: true 
      }
    ).populate('userId', 'name email phone');

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Update user verification status if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(
        userId,
        { 'verification.backgroundCheckVerified': true }
      );
    }

    // Log admin action
    await logAdminAction({
      adminId,
      action: 'VERIFY_PROVIDER_DOCUMENTS',
      targetId: userId,
      details: {
        status,
        reason
      }
    });

    // Send notification email
    if (provider.userId?.email) {
      await sendStatusEmail({
        email: provider.userId.email,
        name: provider.userId.name,
        status,
        reason,
        type: 'DOCUMENT_VERIFICATION'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...provider.toObject(),
        userId: undefined,
        user: provider.userId
      },
      message: `Provider documents ${status} successfully`
    });
  } catch (err) {
    console.error('Verify documents error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to verify documents',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Verify all exports are functions
const functionChecks = {
  dashboard: typeof exports.dashboard,
  listUsers: typeof exports.listUsers,
  getUserById: typeof exports.getUserById,
  updateUserStatus: typeof exports.updateUserStatus,
  verifyProviderDocuments: typeof exports.verifyProviderDocuments
};

console.log('Controller Function Verification:', functionChecks);

// Check all required methods exist
Object.entries(functionChecks).forEach(([name, type]) => {
  if (type !== 'function') {
    console.error(`❌ Missing function: ${name}`);
    process.exit(1);
  }
  console.log(`✅ ${name} is a function`);
});