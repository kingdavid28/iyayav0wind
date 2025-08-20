const Provider = require('../models/Provider');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { jwtSecret, refreshTokenSecret } = require('../config/auth');
const { logActivity } = require('../services/auditService');

// Get current provider's profile
exports.getProviderProfile = async (req, res) => {
  try {
    const provider = await Provider.findOne({ userId: req.user.id })
      .populate('userId', 'name email phone')
      .populate('reviews.userId', 'name profileImage');

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    await logActivity('PROVIDER_PROFILE_VIEW', {
      userId: req.user.id,
      providerId: provider._id
    });

    res.json({
      success: true,
      provider
    });
  } catch (err) {
    console.error('Get provider profile error:', err);
    await logActivity('PROVIDER_PROFILE_ERROR', {
      userId: req.user.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get provider profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Search providers with filters
// Search providers with filters (public info only)
exports.searchProviders = async (req, res) => {
  try {
    const { skills, minRate, maxRate, daysAvailable, search, page = 1, limit = 10 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { 'userId.name': { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }
    if (skills) {
      query.skills = { $in: skills.split(',') };
    }
    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) query.hourlyRate.$gte = Number(minRate);
      if (maxRate) query.hourlyRate.$lte = Number(maxRate);
    }
    if (daysAvailable) {
      query['availability.days'] = { $in: daysAvailable.split(',') };
    }
    // Only select public fields from Provider and User
    const providers = await Provider.find(query)
      .populate('userId', 'name profileImage')
      .select('skills experience hourlyRate availability rating reviews')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });
    const count = await Provider.countDocuments(query);
    await logActivity('PROVIDER_SEARCH', { searchParams: req.query, results: count });
    // Map providers to public info only
    const publicProviders = providers.map(p => ({
      _id: p._id,
      user: p.userId, // only name, profileImage
      skills: p.skills,
      experience: p.experience,
      hourlyRate: p.hourlyRate,
      availability: p.availability,
      rating: p.rating,
      reviews: p.reviews
    }));
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      providers: publicProviders
    });
  } catch (err) {
    console.error('Search error:', err);
    await logActivity('PROVIDER_SEARCH_ERROR', { error: err.message });
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get provider details
// Get provider details (public info + conditional contact info)
exports.getProviderDetails = async (req, res) => {
  try {
    const provider = await Provider.findById(req.params.id)
      .populate('userId', 'name profileImage email phone role userType')
      .populate('reviews.userId', 'name profileImage');
    if (!provider) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    // By default, only public info
    let result = {
      _id: provider._id,
      user: {
        _id: provider.userId._id,
        name: provider.userId.name,
        profileImage: provider.userId.profileImage
      },
      skills: provider.skills,
      experience: provider.experience,
      hourlyRate: provider.hourlyRate,
      availability: provider.availability,
      rating: provider.rating,
      reviews: provider.reviews
    };
    // If requester is admin or has contract, expose contact info
    let includeContact = false;
    if (req.user && (isAdmin(req.user) || (await hasActiveContract(req.user.id, provider.userId._id)))) {
      includeContact = true;
    }
    if (includeContact) {
      result.user.email = provider.userId.email;
      result.user.phone = provider.userId.phone;
    }
    await logActivity('PROVIDER_VIEW', { providerId: req.params.id, requestedBy: req.user?.id });
    res.json({ success: true, provider: result });
  } catch (err) {
    console.error('Provider details error:', err);
    await logActivity('PROVIDER_VIEW_ERROR', { providerId: req.params.id, error: err.message });
    res.status(500).json({ success: false, error: 'Server error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// Update provider profile
exports.updateProviderProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { skills, hourlyRate, experience, availability } = req.body;

    const provider = await Provider.findOneAndUpdate(
      { userId: req.user.id },
      { 
        skills,
        hourlyRate,
        experience,
        availability,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider profile not found'
      });
    }

    await logActivity('PROVIDER_PROFILE_UPDATE', {
      userId: req.user.id,
      updates: req.body
    });

    res.json({
      success: true,
      provider
    });
  } catch (err) {
    console.error('Update provider profile error:', err);
    await logActivity('PROVIDER_UPDATE_ERROR', {
      userId: req.user.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update provider profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Upload provider documents
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const documents = req.files.map(file => ({
      name: file.originalname,
      url: file.path,
      type: file.mimetype,
      size: file.size
    }));

    const provider = await Provider.findOneAndUpdate(
      { userId: req.user.id },
      { $push: { documents: { $each: documents } } },
      { new: true }
    );

    await logActivity('PROVIDER_DOCUMENTS_UPLOAD', {
      userId: req.user.id,
      documentCount: documents.length
    });

    res.json({
      success: true,
      documents: provider.documents
    });
  } catch (err) {
    console.error('Upload documents error:', err);
    await logActivity('DOCUMENT_UPLOAD_ERROR', {
      userId: req.user.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to upload documents',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.rt;
    if (!refreshToken) {
      await logActivity('REFRESH_TOKEN_MISSING', { userId: req.user?.id });
      return res.status(401).json({
        success: false,
        error: 'Refresh token required'
      });
    }

    const decoded = jwt.verify(refreshToken, refreshTokenSecret);
    const user = await User.findById(decoded.id);

    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      await logActivity('REFRESH_TOKEN_INVALID', { userId: decoded.id });
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: '15m', algorithm: 'HS256' }
    );

    await logActivity('TOKEN_REFRESHED', { userId: user._id });
    
    res.json({
      success: true,
      token: accessToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    await logActivity('REFRESH_TOKEN_ERROR', { 
      error: err.name,
      message: err.message 
    });
    
    const errorResponse = {
      success: false,
      error: 'Invalid refresh token'
    };

    if (err.name === 'TokenExpiredError') {
      errorResponse.error = 'Refresh token expired';
    }

    res.status(401).json(errorResponse);
  }
};

// Debug check
console.log('Provider Controller Methods:', {
  getProviderProfile: typeof exports.getProviderProfile,
  searchProviders: typeof exports.searchProviders,
  getProviderDetails: typeof exports.getProviderDetails,
  updateProviderProfile: typeof exports.updateProviderProfile,
  uploadDocuments: typeof exports.uploadDocuments,
  refreshToken: typeof exports.refreshToken
});