const Caregiver = require('../models/Caregiver');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { jwtSecret, refreshTokenSecret } = require('../config/auth');
const { logActivity } = require('../services/auditService');
const backgroundCheckService = require('../services/backgroundCheckService');
const mongoose = require('mongoose');

const resolveMongoId = (user) => {
  console.log('🔍 resolveMongoId input:', user);
  
  // If we already have a valid MongoDB ObjectId
  const directId = user?.mongoId || user?._id || user?.id;
  if (mongoose.isValidObjectId(directId)) {
    console.log('🔍 Using direct MongoDB ID:', directId);
    return directId;
  }
  
  console.log('❌ Could not resolve MongoDB ID from:', { mongoId: user?.mongoId, _id: user?._id, id: user?.id });
  return null;
};

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
    console.log('🔍 Getting caregiver profile for user:', req.user);
    const userMongoId = resolveMongoId(req.user);
    console.log('🔍 Resolved MongoDB ID:', userMongoId);
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
    console.error('❌ Get caregiver profile error:', {
      name: err.name,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
      user: req.user
    });
    await logActivity('PROVIDER_PROFILE_ERROR', {
      userId: req.user?.id || 'unknown',
      error: err.message
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get caregiver profile',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : undefined
    });
  }
};

// Search caregivers with filters
// Search caregivers with filters (public info only) - Optimized
exports.searchCaregivers = async (req, res) => {
  try {
    const { skills, minRate, maxRate, daysAvailable, search, page = 1, limit = 50 } = req.query;
    console.log('🔍 Caregiver search request:', { skills, minRate, maxRate, daysAvailable, search, page, limit });
    
    // First check if we have any caregivers at all
    const totalCaregivers = await Caregiver.countDocuments();
    console.log('📊 Total caregivers in database:', totalCaregivers);
    
    // If no caregivers exist, return empty array
    if (totalCaregivers === 0) {
      console.log('❌ No caregivers found in database, returning empty array');
      return res.json({
        success: true,
        count: 0,
        totalPages: 0,
        currentPage: 1,
        caregivers: []
      });
    }
    
    let query = {};
    
    // Build query efficiently with input sanitization
    if (search && typeof search === 'string') {
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitizedSearch, $options: 'i' } },
        { skills: { $regex: sanitizedSearch, $options: 'i' } }
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
// Get caregiver details (complete profile for display)
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
      .populate('reviews.userId', 'name profileImage')
      .lean();
      
    if (!caregiver) {
      return res.status(404).json({ success: false, error: 'Caregiver not found' });
    }

    // Return complete profile details for display
    const result = {
      _id: caregiver._id,
      userId: caregiver.userId,
      name: caregiver.name,
      bio: caregiver.bio,
      profileImage: caregiver.profileImage || caregiver.userId?.profileImage,
      skills: caregiver.skills || [],
      experience: caregiver.experience,
      hourlyRate: caregiver.hourlyRate,
      education: caregiver.education || [],
      languages: caregiver.languages || [],
      certifications: caregiver.certifications || [],
      ageCareRanges: caregiver.ageCareRanges || [],
      availability: caregiver.availability,
      rating: caregiver.rating || 0,
      reviewCount: caregiver.reviews?.length || 0,
      reviews: caregiver.reviews || [],
      location: caregiver.location || caregiver.address,
      address: caregiver.address || caregiver.location,
      verification: caregiver.verification,
      backgroundCheck: caregiver.backgroundCheck,
      emergencyContacts: caregiver.emergencyContacts || [],
      createdAt: caregiver.createdAt,
      updatedAt: caregiver.updatedAt
    };

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
    console.log('🔄 Profile update request received:', {
      userId: req.user?.id,
      userEmail: req.user?.email,
      method: req.method,
      url: req.originalUrl,
      contentType: req.headers['content-type'],
      bodyKeys: Object.keys(req.body || {}),
      bodySize: JSON.stringify(req.body || {}).length,
      hasBody: !!req.body
    });
    
    console.log('📋 Request body sample:', {
      name: req.body?.name,
      bio: req.body?.bio?.substring(0, 50) + '...',
      skills: req.body?.skills?.length,
      experience: req.body?.experience,
      hourlyRate: req.body?.hourlyRate,
      ageCareRanges: req.body?.ageCareRanges?.length
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

    // Explicitly exclude email from updates - email should not be changed via profile update
    if (req.body.email) {
      console.log('⚠️ Email update attempted but blocked for security');
    }

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

    // Transform experience if it's a number (total months) to object format
    let transformedExperience = experience;
    if (typeof experience === 'number') {
      const totalMonths = experience;
      const years = Math.floor(totalMonths / 12);
      const months = totalMonths % 12;
      transformedExperience = {
        years,
        months,
        description: req.body.experienceDescription || ''
      };
      console.log('🔄 Transformed experience from number to object:', {
        original: experience,
        transformed: transformedExperience
      });
    } else if (experience && typeof experience === 'object') {
      // Ensure object has required structure
      transformedExperience = {
        years: experience.years || 0,
        months: experience.months || 0,
        description: experience.description || ''
      };
      console.log('🔄 Normalized experience object:', {
        original: experience,
        transformed: transformedExperience
      });
    }

    // Transform address if needed
    let transformedAddress = address;
    if (address && typeof address === 'object' && address.street) {
      // Keep as object since schema now supports Mixed type
      transformedAddress = address;
      console.log('🔄 Keeping address as object (Mixed type):', address);
    }

    // Transform portfolio to ensure it matches schema
    let transformedPortfolio = portfolio;
    if (portfolio && typeof portfolio === 'object') {
      transformedPortfolio = {
        images: Array.isArray(portfolio.images) ? portfolio.images : [],
        videos: Array.isArray(portfolio.videos) ? portfolio.videos : []
      };
      console.log('🔄 Normalized portfolio:', transformedPortfolio);
    }

    // Create minimal update data to avoid CastError
    const updateData = {};
    
    // Only add fields that exist and are valid
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (profileImage) updateData.profileImage = profileImage;
    if (transformedExperience) updateData.experience = transformedExperience;
    if (hourlyRate !== undefined && hourlyRate !== null) updateData.hourlyRate = Number(hourlyRate);
    if (education) updateData.education = education;
    if (Array.isArray(languages)) updateData.languages = languages;
    if (Array.isArray(skills)) updateData.skills = skills;
    if (Array.isArray(transformedCertifications)) updateData.certifications = transformedCertifications;
    if (Array.isArray(ageCareRanges)) updateData.ageCareRanges = ageCareRanges;
    if (transformedAddress) updateData.address = transformedAddress;
    if (Array.isArray(documents)) updateData.documents = documents;
    if (transformedPortfolio) updateData.portfolio = transformedPortfolio;
    if (availability && typeof availability === 'object') updateData.availability = availability;
    if (Array.isArray(emergencyContacts)) updateData.emergencyContacts = emergencyContacts;
    
    updateData.updatedAt = new Date();

    console.log('🔄 Caregiver profile update data:', {
      userId: userMongoId,
      hasProfileImage: !!profileImage,
      profileImageUrl: profileImage,
      updateFields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
    });

    console.log('🔍 Update data before MongoDB operation:', {
      keys: Object.keys(updateData),
      experience: updateData.experience,
      hourlyRate: updateData.hourlyRate,
      address: updateData.address,
      portfolio: updateData.portfolio
    });

    console.log('📝 Final update data after cleanup:', {
      fieldCount: Object.keys(updateData).length,
      fields: Object.keys(updateData),
      hasName: !!updateData.name,
      hasBio: !!updateData.bio,
      hasSkills: !!updateData.skills?.length,
      hasHourlyRate: !!updateData.hourlyRate,
      fullUpdateData: updateData
    });

    console.log('🔄 Attempting caregiver update:', {
      userId: userMongoId,
      updateFields: Object.keys(updateData),
      updateDataSample: {
        name: updateData.name,
        bio: updateData.bio?.substring(0, 50) + '...',
        skills: updateData.skills,
        hourlyRate: updateData.hourlyRate
      }
    });
    
    // Add timeout to prevent hanging
    const updateTimeout = setTimeout(() => {
      console.error('⏰ Update operation timeout after 30 seconds');
    }, 30000);

    // Check if caregiver exists first
    const existingCaregiver = await Caregiver.findOne({ userId: userMongoId });
    console.log('🔍 Existing caregiver found:', !!existingCaregiver, existingCaregiver?._id);

    let caregiver;
    try {
      console.log('🔄 Attempting MongoDB findOneAndUpdate with:', {
        userId: userMongoId,
        updateDataKeys: Object.keys(updateData),
        updateDataSample: {
          name: updateData.name,
          experience: updateData.experience,
          hourlyRate: updateData.hourlyRate
        }
      });
      
      caregiver = await Caregiver.findOneAndUpdate(
        { userId: userMongoId },
        updateData,
        { new: true, runValidators: true, upsert: false }
      ).populate('userId', 'name email');
      
      console.log('✅ MongoDB update successful');
    } catch (updateError) {
      clearTimeout(updateTimeout);
      console.error('❌ MongoDB update failed:', {
        name: updateError.name,
        message: updateError.message,
        path: updateError.path,
        value: updateError.value,
        kind: updateError.kind,
        stack: updateError.stack?.split('\n').slice(0, 3)
      });
      
      if (updateError.name === 'ValidationError') {
        console.error('❌ Validation errors:', Object.keys(updateError.errors));
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: Object.values(updateError.errors).map(e => e.message)
        });
      }
      
      if (updateError.name === 'CastError') {
        console.error('❌ CastError details:', {
          path: updateError.path,
          value: updateError.value,
          valueType: typeof updateError.value,
          kind: updateError.kind,
          reason: updateError.reason
        });
        return res.status(400).json({
          success: false,
          error: `Invalid data format for field '${updateError.path}': ${updateError.message}`,
          field: updateError.path,
          value: updateError.value
        });
      }
      
      throw updateError;
    }
    
    clearTimeout(updateTimeout);
    
    console.log('🔄 Caregiver profile update result:', {
      found: !!caregiver,
      caregiverId: caregiver?._id,
      name: caregiver?.name,
      bio: caregiver?.bio?.substring(0, 50) + '...',
      skills: caregiver?.skills,
      hourlyRate: caregiver?.hourlyRate,
      profileImage: caregiver?.profileImage,
      updatedAt: caregiver?.updatedAt
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
      const hydrated = await Caregiver.findById(created._id)
        .populate('userId', 'name email phone profileImage')
        .lean();
      await logActivity('PROVIDER_PROFILE_CREATE', { userId: userMongoId });
      console.log('✅ New caregiver profile created successfully:', hydrated._id);
      return res.json({ 
        success: true, 
        caregiver: hydrated,
        profileCompletionPercentage: 0,
        message: 'Profile created successfully'
      });
    }

    // Verify the update was actually saved
    const verifyUpdate = await Caregiver.findById(caregiver._id).select('name bio skills hourlyRate updatedAt');
    console.log('🔍 Post-update verification:', {
      caregiverId: verifyUpdate._id,
      name: verifyUpdate.name,
      bio: verifyUpdate.bio?.substring(0, 50) + '...',
      skillsCount: verifyUpdate.skills?.length,
      hourlyRate: verifyUpdate.hourlyRate,
      lastUpdated: verifyUpdate.updatedAt
    });

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

    // Return complete profile for navigation
    const completeProfile = await Caregiver.findById(caregiver._id)
      .populate('userId', 'name email phone profileImage')
      .lean();

    res.json({
      success: true,
      caregiver: completeProfile,
      profileCompletionPercentage: completionPercentage,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('❌ Update caregiver profile error:', err);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error details:', {
      message: err.message,
      name: err.name,
      code: err.code,
      validationErrors: err.errors
    });
    
    await logActivity('PROVIDER_UPDATE_ERROR', {
      userId: resolveMongoId(req.user) || req.user?.id,
      error: err.message,
      errorName: err.name,
      errorCode: err.code
    });
    
    let errorMessage = 'Failed to update caregiver profile';
    let statusCode = 500;
    
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation failed';
      statusCode = 400;
    } else if (err.name === 'CastError') {
      errorMessage = `Invalid data format for field '${err.path}': ${err.message}`;
      statusCode = 400;
      console.log('❌ CastError details:', {
        path: err.path,
        value: err.value,
        valueType: typeof err.value,
        kind: err.kind,
        message: err.message,
        stringifiedValue: JSON.stringify(err.value)
      });
    } else if (err.message && err.message.includes('Invalid data format')) {
      console.log('❌ Found "Invalid data format" error source:', {
        name: err.name,
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 5)
      });
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        name: err.name,
        stack: err.stack
      } : undefined
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

// Simple test update endpoint
exports.testUpdate = async (req, res) => {
  try {
    console.log('🧪 TEST UPDATE - Request body:', req.body);
    
    const userMongoId = resolveMongoId(req.user);
    console.log('🧪 TEST UPDATE - User ID:', userMongoId);
    
    // Try minimal update
    const result = await Caregiver.findOneAndUpdate(
      { userId: userMongoId },
      { 
        name: req.body.name || 'Test Name',
        bio: req.body.bio || 'Test Bio',
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    console.log('✅ TEST UPDATE - Success:', result._id);
    res.json({ success: true, result });
    
  } catch (error) {
    console.error('❌ TEST UPDATE - Error:', {
      name: error.name,
      message: error.message,
      path: error.path,
      value: error.value,
      kind: error.kind
    });
    res.status(400).json({ 
      success: false, 
      error: error.message,
      details: {
        name: error.name,
        path: error.path,
        value: error.value
      }
    });
  }
};

// Debug check
console.log('Caregiver Controller Methods:', {
  getCaregiverProfile: typeof exports.getCaregiverProfile,
  searchCaregivers: typeof exports.searchCaregivers,
  getCaregiverDetails: typeof exports.getCaregiverDetails,
  updateCaregiverProfile: typeof exports.updateCaregiverProfile,
  testUpdate: typeof exports.testUpdate,
  uploadDocuments: typeof exports.uploadDocuments,
  requestBackgroundCheck: typeof exports.requestBackgroundCheck,
  getBackgroundCheckStatus: typeof exports.getBackgroundCheckStatus,
  uploadPortfolioImages: typeof exports.uploadPortfolioImages,
  getVerificationStatus: typeof exports.getVerificationStatus,
  refreshToken: typeof exports.refreshToken
});