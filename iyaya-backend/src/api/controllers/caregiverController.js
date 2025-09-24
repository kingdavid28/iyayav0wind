const Caregiver = require('../models/Caregiver');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { jwtSecret, refreshTokenSecret } = require('../config/auth');
const { logActivity } = require('../services/auditService');
const backgroundCheckService = require('../services/backgroundCheckService');
const mongoose = require('mongoose');

const resolveMongoId = (user) => {
  const id = user?.mongoId || user?._id || user?.id;
  return mongoose.isValidObjectId(id) ? id : null;
};

// Helper: check if user is admin
function isAdmin(user) {
  return user && (user.role === 'admin' || user.userType === 'admin');
}

// Helper: check if user has contract with parent (client)
async function hasActiveContract(requesterId, parentId) {
  if (!requesterId || !parentId) return false;
  try {
    const Contract = require('../models/Contract');
    const contract = await Contract.findOne({
      $or: [
        { clientId: parentId, providerId: requesterId },
        { clientId: requesterId, providerId: parentId }
      ],
      status: { $in: ['active', 'completed'] }
    });
    return !!contract;
  } catch (error) {
    console.error('Error checking contract:', error);
    return false;
  }
}

// Empty profile template for new caregivers
const getDefaultProfileTemplate = () => ({
  name: "",
  bio: "",
  skills: [],
  hourlyRate: 0,
  experience: { years: 0, months: 0, description: "" },
  education: [],
  languages: [],
  certifications: [],
  ageCareRanges: [],
  availability: {
    flexible: false,
    days: [],
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
  emergencyContacts: [],
  verification: {
    profileComplete: false,
    identityVerified: false,
    certificationsVerified: false,
    referencesVerified: false,
    trustScore: 0,
    badges: []
  },
  backgroundCheck: {
    status: "not_started",
    provider: "internal",
    checkTypes: []
  },
  rating: 0,
  reviewCount: 0,
  location: ""
});

// Get current caregiver's profile (Optimized)
exports.getCaregiverProfile = async (req, res) => {
  try {
    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    // Optimized query with lean() for better performance
    let caregiver = await Caregiver.findOne({ userId: userMongoId })
      .populate('userId', 'name email phone')
      .select('-portfolio -documents -reviews') // Exclude heavy fields for basic profile
      .lean();

    if (!caregiver) {
      // Auto-create minimal caregiver profile for this user
      // Ensure we use the persisted User's name, not just req.user payload
      const userDoc = await User.findById(userMongoId).select('name');
      const derivedName = (userDoc && typeof userDoc.name === 'string' && userDoc.name.trim().length > 0)
        ? userDoc.name.trim()
        : (req.user?.name && String(req.user.name).trim().length > 0
            ? String(req.user.name).trim()
            : 'Caregiver');

      const newCaregiver = await Caregiver.create({ 
        userId: userMongoId,
        name: derivedName,
        bio: '',
        profileImage: '',
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
        backgroundCheck: {
          status: 'not_started',
          provider: 'internal',
          checkTypes: []
        }
      });
      
      caregiver = await Caregiver.findById(newCaregiver._id)
        .populate('userId', 'name email phone')
        .select('-portfolio -documents -reviews')
        .lean();
    }

    // Add calculated fields without heavy computation
    if (caregiver) {
      caregiver.includeCalculations = false; // Skip trust score calculation in toJSON
    }

    await logActivity('PROVIDER_PROFILE_VIEW', {
      userId: userMongoId,
      caregiverId: caregiver._id
    });

    res.json({
      success: true,
      caregiver
    });
  } catch (err) {
    console.error('Get caregiver profile error:', err);
    await logActivity('PROVIDER_PROFILE_ERROR', {
      userId: resolveMongoId(req.user) || req.user?.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get caregiver profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Search caregivers with filters
// Search caregivers with filters (public info only) - Optimized
exports.searchCaregivers = async (req, res) => {
  try {
    const { skills, minRate, maxRate, daysAvailable, search, page = 1, limit = 50 } = req.query;

    
    // First check if we have any caregivers at all
    const totalCaregivers = await Caregiver.countDocuments();

    
    // Debug: Check what's in the database
    const allCaregivers = await Caregiver.find({}).populate('userId', 'name role userType').lean();

    
    // If no caregivers exist, return empty array
    if (totalCaregivers === 0) {
  
      return res.json({
        success: true,
        count: 0,
        totalPages: 0,
        currentPage: 1,
        caregivers: []
      });
    }
    
    let query = {};
    
    // Build query efficiently
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
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
    
    console.log('📋 MongoDB query:', JSON.stringify(query, null, 2));
    
    // Optimized query with lean() and minimal fields
    // CRITICAL: Filter by User role to exclude parents who have caregiver profiles
    const caregivers = await Caregiver.find(query)
      .populate({
        path: 'userId',
        select: 'name profileImage role userType',
        match: { 
          $or: [
            { role: 'caregiver' },
            { userType: 'caregiver' }
          ]
        }
      })
      .select('name skills experience hourlyRate availability rating ageCareRanges profileImage address location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, 'verification.trustScore': -1 })
      .lean();
    
    // Filter out caregivers where userId is null (means User role doesn't match)
    const validCaregivers = caregivers.filter(c => c.userId !== null);
      
    const count = validCaregivers.length;
    
    console.log('📊 Search results:', { total: caregivers.length, valid: validCaregivers.length });
    console.log('👥 Valid caregivers:', validCaregivers.map(c => ({ 
      id: c._id, 
      name: c.name, 
      userRole: c.userId?.role,
      userType: c.userId?.userType 
    })));
    
    await logActivity('PROVIDER_SEARCH', { searchParams: req.query, results: count });
    
    // Map caregivers to public info only
    const publicCaregivers = validCaregivers.map(p => ({
      _id: p._id,
      id: p._id, // Add id field for frontend compatibility
      user: p.userId,
      name: p.name,
      skills: p.skills,
      experience: p.experience,
      hourlyRate: p.hourlyRate,
      availability: p.availability,
      rating: p.rating,
      ageCareRanges: p.ageCareRanges,
      // Prefer user profile image; fall back to caregiver.profileImage
      avatar: p.userId?.profileImage || p.profileImage || null,
      // Provide both location and address for clients
      location: p.location || p.address || undefined,
      address: p.address || p.location || undefined
    }));
    
    console.log('✅ Sending response with', publicCaregivers.length, 'caregivers');
    
    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      caregivers: publicCaregivers
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

// Get caregiver details
exports.getCaregiverDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle special case for "my-profile" - redirect to profile endpoint
    if (id === 'my-profile') {
      return res.status(400).json({ 
        success: false, 
        error: 'Use /profile endpoint for your own profile' 
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid caregiver ID format' 
      });
    }
    
    const caregiver = await Caregiver.findById(id)
      .populate('userId', 'name profileImage email phone role userType')
      .populate('reviews.userId', 'name profileImage');
    
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver not found' });
    }
    
    // Check if the associated user is actually a caregiver
    const user = caregiver.userId;
    if (!user || (user.role !== 'caregiver' && user.userType !== 'caregiver')) {
      return res.status(404).json({ success: false, error: 'Caregiver profile not available' });
    }
    
    // By default, only public info
    let result = {
      _id: caregiver._id,
      user: {
        _id: caregiver.userId._id,
        name: caregiver.userId.name,
        profileImage: caregiver.userId.profileImage
      },
      skills: caregiver.skills,
      experience: caregiver.experience,
      hourlyRate: caregiver.hourlyRate,
      availability: caregiver.availability,
      rating: caregiver.rating,
      reviews: caregiver.reviews
    };
    // If requester is admin or has contract, expose contact info
    let includeContact = false;
    if (req.user && (isAdmin(req.user) || (await hasActiveContract(req.user.id, caregiver.userId._id)))) {
      includeContact = true;
    }
    if (includeContact) {
      result.user.email = caregiver.userId.email;
      result.user.phone = caregiver.userId.phone;
    }
    await logActivity('PROVIDER_VIEW', { caregiverId: req.params.id, requestedBy: req.user?.id });
    res.json({ success: true, caregiver: result });
  } catch (err) {
    console.error('Caregiver details error:', err);
    await logActivity('PROVIDER_VIEW_ERROR', { caregiverId: req.params.id, error: err.message });
    res.status(500).json({ success: false, error: 'Server error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// Update caregiver profile (Enhanced)
exports.updateCaregiverProfile = async (req, res) => {
  try {
    console.log('🔄 Profile update request:', {
      userId: req.user?.id,
      body: req.body
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const {
      name,
      bio,
      profileImage,
      skills,
      hourlyRate,
      experience,
      education,
      languages,
      certifications,
      ageCareRanges,
      address,
      documents,
      portfolio,
      availability,
      emergencyContacts
    } = req.body;

    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    // Prepare update data
    // Transform certifications from string array to object array
    const transformedCertifications = certifications?.map(cert => {
      if (typeof cert === 'string') {
        return {
          name: cert,
          verified: false
        };
      }
      return cert;
    }) || [];

    const updateData = {
      name,
      bio,
      profileImage,
      experience,
      hourlyRate,
      education,
      languages,
      skills,
      certifications: transformedCertifications,
      ageCareRanges,
      address,
      documents,
      portfolio,
      availability,
      emergencyContacts,
      updatedAt: new Date()
    };

    console.log('🔄 Caregiver profile update data:', {
      userId: userMongoId,
      hasProfileImage: !!profileImage,
      profileImageUrl: profileImage,
      updateFields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
    });

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    let caregiver = await Caregiver.findOneAndUpdate(
      { userId: userMongoId },
      updateData,
      { new: true, runValidators: true, upsert: false }
    ).populate('userId', 'name email');
    
    console.log('🔄 Caregiver profile update result:', {
      found: !!caregiver,
      profileImage: caregiver?.profileImage
    });

    if (!caregiver) {
      // Auto-create with default template then merge with user data
      const defaultTemplate = getDefaultProfileTemplate();
      const mergedData = { ...defaultTemplate, ...updateData, userId: userMongoId };
      
      console.log('🎯 Creating new caregiver profile with template:', {
        userId: userMongoId,
        templateFields: Object.keys(defaultTemplate),
        userFields: Object.keys(updateData)
      });
      
      const created = await Caregiver.create(mergedData);
      const hydrated = await Caregiver.findById(created._id).populate('userId', 'name email');
      await logActivity('PROVIDER_PROFILE_CREATE', { userId: userMongoId });
      return res.json({ success: true, caregiver: hydrated });
    }

    // Update verification status based on profile completeness (async to avoid blocking)
    setImmediate(async () => {
      try {
        const freshCaregiver = await Caregiver.findById(caregiver._id);
        if (freshCaregiver) {
          const completionPercentage = freshCaregiver.profileCompletionPercentage;
          if (completionPercentage >= 80 && !freshCaregiver.verification.profileComplete) {
            await Caregiver.findByIdAndUpdate(caregiver._id, {
              'verification.profileComplete': true,
              'verification.trustScore': freshCaregiver.calculateTrustScore()
            });
          }
        }
      } catch (err) {
        console.error('Background verification update failed:', err);
      }
    });

    // Calculate completion percentage for response
    const completionPercentage = caregiver.profileCompletionPercentage || 0;

    await logActivity('PROVIDER_PROFILE_UPDATE', {
      userId: userMongoId,
      updates: req.body,
      completionPercentage
    });

    console.log('✅ Profile updated successfully:', {
      caregiverId: caregiver._id,
      name: caregiver.name,
      skills: caregiver.skills,
      hourlyRate: caregiver.hourlyRate,
      completionPercentage
    });

    res.json({
      success: true,
      caregiver,
      profileCompletionPercentage: completionPercentage
    });
  } catch (err) {
    console.error('Update caregiver profile error:', err);
    await logActivity('PROVIDER_UPDATE_ERROR', {
      userId: resolveMongoId(req.user) || req.user?.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to update caregiver profile',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Upload caregiver documents
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

    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: userMongoId },
      { $push: { documents: { $each: documents } } },
      { new: true }
    );

    await logActivity('PROVIDER_DOCUMENTS_UPLOAD', {
      userId: userMongoId,
      documentCount: documents.length
    });

    res.json({
      success: true,
      documents: caregiver.documents
    });
  } catch (err) {
    console.error('Upload documents error:', err);
    await logActivity('DOCUMENT_UPLOAD_ERROR', {
      userId: resolveMongoId(req.user) || req.user?.id,
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

    const decoded = jwt.verify(refreshToken, refreshTokenSecret, { algorithms: ['HS256'] });
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

// Request background check
exports.requestBackgroundCheck = async (req, res) => {
  try {
    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    const caregiver = await Caregiver.findOne({ userId: userMongoId });
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver profile not found' });
    }

    // Check if background check is already in progress or completed
    if (['pending', 'in_progress', 'approved'].includes(caregiver.backgroundCheck.status)) {
      return res.status(400).json({
        success: false,
        error: 'Background check already requested or completed',
        status: caregiver.backgroundCheck.status
      });
    }

    const { personalInfo } = req.body;
    const result = await backgroundCheckService.requestBackgroundCheck(caregiver._id, personalInfo);

    await logActivity('BACKGROUND_CHECK_REQUESTED', {
      userId: userMongoId,
      caregiverId: caregiver._id,
      reportId: result.reportId
    });

    res.json({
      success: true,
      message: 'Background check requested successfully',
      ...result
    });
  } catch (err) {
    console.error('Request background check error:', err);
    await logActivity('BACKGROUND_CHECK_REQUEST_ERROR', {
      userId: resolveMongoId(req.user) || req.user?.id,
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to request background check',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get background check status
exports.getBackgroundCheckStatus = async (req, res) => {
  try {
    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    const caregiver = await Caregiver.findOne({ userId: userMongoId });
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver profile not found' });
    }

    const status = await backgroundCheckService.getBackgroundCheckStatus(caregiver._id);

    res.json({
      success: true,
      backgroundCheck: status
    });
  } catch (err) {
    console.error('Get background check status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get background check status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Upload portfolio images
exports.uploadPortfolioImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    const caregiver = await Caregiver.findOne({ userId: userMongoId });
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver profile not found' });
    }

    const portfolioImages = req.files.map(file => ({
      url: file.path,
      caption: req.body.caption || '',
      category: req.body.category || 'other',
      uploadedAt: new Date()
    }));

    await Caregiver.findByIdAndUpdate(caregiver._id, {
      $push: { 'portfolio.images': { $each: portfolioImages } }
    });

    await logActivity('PORTFOLIO_IMAGES_UPLOAD', {
      userId: userMongoId,
      caregiverId: caregiver._id,
      imageCount: portfolioImages.length
    });

    res.json({
      success: true,
      message: 'Portfolio images uploaded successfully',
      images: portfolioImages
    });
  } catch (err) {
    console.error('Upload portfolio images error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to upload portfolio images',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get caregiver verification status
exports.getVerificationStatus = async (req, res) => {
  try {
    const userMongoId = resolveMongoId(req.user);
    if (!userMongoId) {
      return res.status(401).json({ success: false, error: 'User mapping not found' });
    }

    const caregiver = await Caregiver.findOne({ userId: userMongoId })
      .select('verification backgroundCheck profileCompletionPercentage');
    
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver profile not found' });
    }

    const trustScore = caregiver.calculateTrustScore();
    const completionPercentage = caregiver.profileCompletionPercentage;

    res.json({
      success: true,
      verification: {
        ...caregiver.verification.toObject(),
        trustScore,
        profileCompletionPercentage: completionPercentage,
        backgroundCheckStatus: caregiver.backgroundCheck.status
      }
    });
  } catch (err) {
    console.error('Get verification status error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get verification status',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Debug check
console.log('Caregiver Controller Methods:', {
  getCaregiverProfile: typeof exports.getCaregiverProfile,
  searchCaregivers: typeof exports.searchCaregivers,
  getCaregiverDetails: typeof exports.getCaregiverDetails,
  updateCaregiverProfile: typeof exports.updateCaregiverProfile,
  uploadDocuments: typeof exports.uploadDocuments,
  requestBackgroundCheck: typeof exports.requestBackgroundCheck,
  getBackgroundCheckStatus: typeof exports.getBackgroundCheckStatus,
  uploadPortfolioImages: typeof exports.uploadPortfolioImages,
  getVerificationStatus: typeof exports.getVerificationStatus,
  refreshToken: typeof exports.refreshToken
});