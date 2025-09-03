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

// Default profile template with rich mock data for new caregivers
const getDefaultProfileTemplate = () => ({
  name: "Ana Dela Cruz",
  bio: "Experienced and caring childcare provider with over 5 years of experience. I specialize in toddler care and creating engaging activities for children. CPR and First Aid certified.",
  skills: ["Toddlers", "Meal Prep", "Light Housekeeping"],
  hourlyRate: 25,
  experience: { years: 5, description: "5+ years of professional childcare experience" },
  education: [
    { institution: "University of Cebu", degree: "Early Childhood Education", year: "2018" }
  ],
  languages: ["English", "Filipino"],
  certifications: ["CPR Certified", "First Aid", "Child Development"],
  ageCareRanges: ["0-2 years", "3-5 years"],
  availability: {
    flexible: true,
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    weeklySchedule: {
      Monday: { available: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      Tuesday: { available: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      Wednesday: { available: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      Thursday: { available: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      Friday: { available: true, timeSlots: [{ start: "08:00", end: "18:00" }] },
      Saturday: { available: false, timeSlots: [] },
      Sunday: { available: false, timeSlots: [] }
    }
  },
  emergencyContacts: [
    { name: "Maria Santos", relationship: "Sister", phone: "+63 917 123 4567" }
  ],
  verification: {
    profileComplete: true,
    identityVerified: true,
    certificationsVerified: true,
    referencesVerified: true,
    trustScore: 95,
    badges: ["Top Rated", "Background Verified", "CPR Certified"]
  },
  backgroundCheck: {
    status: "approved",
    provider: "internal",
    checkTypes: ["identity", "criminal", "reference"]
  },
  rating: 4.9,
  reviewCount: 127,
  location: "Cebu City, Philippines"
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
    const { skills, minRate, maxRate, daysAvailable, search, page = 1, limit = 10 } = req.query;
    console.log('🔍 Caregiver search request:', { skills, minRate, maxRate, daysAvailable, search, page, limit });
    
    // First check if we have any caregivers at all
    const totalCaregivers = await Caregiver.countDocuments();
    console.log('📊 Total caregivers in database:', totalCaregivers);
    
    // If no caregivers exist, return sample data for testing
    if (totalCaregivers === 0) {
      console.log('❌ No caregivers found in database, returning sample data');
      const sampleCaregivers = [
        {
          _id: 'sample1',
          id: 'sample1',
          name: 'Sarah Johnson',
          skills: ['Childcare', 'Cooking', 'Cleaning'],
          experience: { years: 5, months: 0, description: '5+ years of childcare experience' },
          hourlyRate: 25,
          availability: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
          rating: 4.8,
          reviewCount: 124,
          location: 'Cebu City',
          ageCareRanges: ['INFANT', 'TODDLER', 'PRESCHOOL'],
          avatar: null,
          verified: true
        },
        {
          _id: 'sample2',
          id: 'sample2',
          name: 'Maria Garcia',
          skills: ['Childcare', 'Tutoring', 'First Aid'],
          experience: { years: 3, months: 6, description: 'Experienced with special needs children' },
          hourlyRate: 22,
          availability: { days: ['Monday', 'Wednesday', 'Friday', 'Saturday'] },
          rating: 4.6,
          reviewCount: 96,
          location: 'Mandaue, Cebu',
          ageCareRanges: ['TODDLER', 'PRESCHOOL', 'SCHOOL_AGE'],
          avatar: null,
          verified: true
        },
        {
          _id: 'sample3',
          id: 'sample3',
          name: 'Ana Dela Cruz',
          skills: ['Infant Care', 'CPR Certified', 'Meal Prep'],
          experience: { years: 7, months: 0, description: 'Specialized in infant care with CPR certification' },
          hourlyRate: 30,
          availability: { days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'] },
          rating: 4.9,
          reviewCount: 87,
          location: 'Lahug, Cebu',
          ageCareRanges: ['INFANT', 'TODDLER'],
          avatar: null,
          verified: true
        },
        {
          _id: 'sample4',
          id: 'sample4',
          name: 'Grace Santos',
          skills: ['Toddler Care', 'Arts & Crafts', 'Educational Activities'],
          experience: { years: 4, months: 0, description: 'Creative caregiver specializing in educational activities' },
          hourlyRate: 20,
          availability: { days: ['Monday', 'Tuesday', 'Wednesday', 'Friday'] },
          rating: 4.7,
          reviewCount: 152,
          location: 'Talisay, Cebu',
          ageCareRanges: ['TODDLER', 'PRESCHOOL'],
          avatar: null,
          verified: false
        },
        {
          _id: 'sample5',
          id: 'sample5',
          name: 'Jennifer Lee',
          skills: ['Tutoring', 'Language Skills', 'Homework Help'],
          experience: { years: 6, months: 0, description: 'Experienced tutor and caregiver for school-age children' },
          hourlyRate: 28,
          availability: { days: ['Monday', 'Wednesday', 'Thursday', 'Friday'] },
          rating: 4.8,
          reviewCount: 203,
          location: 'IT Park, Cebu',
          ageCareRanges: ['PRESCHOOL', 'SCHOOL_AGE'],
          avatar: null,
          verified: true
        }
      ];
      
      return res.json({
        success: true,
        count: sampleCaregivers.length,
        totalPages: 1,
        currentPage: 1,
        caregivers: sampleCaregivers
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
    const caregivers = await Caregiver.find(query)
      .populate('userId', 'name profileImage')
      .select('name skills experience hourlyRate availability rating ageCareRanges profileImage address location')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, 'verification.trustScore': -1 })
      .lean();
      
    const count = await Caregiver.countDocuments(query);
    
    console.log('📊 Search results:', { count, caregivers: caregivers.length });
    console.log('👥 Found caregivers:', caregivers.map(c => ({ id: c._id, name: c.name })));
    
    await logActivity('PROVIDER_SEARCH', { searchParams: req.query, results: count });
    
    // Map caregivers to public info only
    const publicCaregivers = caregivers.map(p => ({
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
// Get caregiver details (public info + conditional contact info)
exports.getCaregiverDetails = async (req, res) => {
  try {
    const caregiver = await Caregiver.findById(req.params.id)
      .populate('userId', 'name profileImage email phone role userType')
      .populate('reviews.userId', 'name profileImage');
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver not found' });
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

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const caregiver = await Caregiver.findOneAndUpdate(
      { userId: userMongoId },
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

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