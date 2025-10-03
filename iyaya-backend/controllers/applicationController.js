const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const { process: processError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
let socketService = null;
try {
  socketService = require('../services/socketService');
} catch (error) {
  console.warn('⚠️ Socket service not available, continuing without realtime updates:', error.message);
}

// Helper function to calculate total cost
const calculateTotalCost = (startTime, endTime, hourlyRate) => {
  const start = new Date(`2024-01-01T${startTime}`);
  const end = new Date(`2024-01-01T${endTime}`);
  const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Math.max(0, hours * hourlyRate);
};



// Helper to get consistent user ID
const getUserId = (user) => {
  return user?.id || user?.uid || user?.mongoId || 'demo-caregiver-id';
};

const normalizeObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return null;
};

const resolveUserMongoId = async (user) => {
  let candidate = normalizeObjectId(user?.mongoId || user?._id || user?.id);

  if (!candidate && user?.id && typeof user.id === 'string') {
    const userDoc = await User.findOne({ firebaseUid: user.id }).select('_id');
    if (userDoc) {
      candidate = userDoc._id;
    }
  }

  if (!candidate && user?.uid && typeof user.uid === 'string') {
    const userDoc = await User.findOne({ firebaseUid: user.uid }).select('_id');
    if (userDoc) {
      candidate = userDoc._id;
    }
  }

  return candidate;
};

const buildCaregiverDisplayData = async (caregiverIdValue, caregiverUserIdValue) => {
  const normalizedProfileId = normalizeObjectId(
    caregiverIdValue && caregiverIdValue._id ? caregiverIdValue._id : caregiverIdValue
  );
  const normalizedUserId = normalizeObjectId(
    caregiverUserIdValue && caregiverUserIdValue._id ? caregiverUserIdValue._id : caregiverUserIdValue
  );

  let caregiverProfile = null;
  let caregiverUser = null;

  if (normalizedProfileId) {
    caregiverProfile = await Caregiver.findById(normalizedProfileId)
      .populate('userId', 'name email profileImage avatar displayName')
      .lean();
  }

  if (!caregiverProfile && normalizedUserId) {
    caregiverProfile = await Caregiver.findOne({ userId: normalizedUserId })
      .populate('userId', 'name email profileImage avatar displayName')
      .lean();
  }

  const resolvedProfileId = caregiverProfile?._id || normalizedProfileId || null;
  const resolvedUserId = caregiverProfile?.userId?._id || normalizedUserId || null;

  if (caregiverProfile?.userId && caregiverProfile.userId._id) {
    caregiverUser = caregiverProfile.userId;
  }

  if (!caregiverUser && resolvedUserId) {
    caregiverUser = await User.findById(resolvedUserId)
      .select('name email profileImage avatar displayName')
      .lean();
  }

  const name = caregiverProfile?.name
    || caregiverProfile?.userId?.name
    || caregiverUser?.name
    || caregiverUser?.displayName
    || (caregiverUser?.email ? caregiverUser.email.split('@')[0] : null);

  const email = caregiverProfile?.email
    || caregiverProfile?.userId?.email
    || caregiverUser?.email
    || null;

  const profileImage = caregiverProfile?.profileImage
    || caregiverProfile?.avatar
    || caregiverProfile?.userId?.profileImage
    || caregiverUser?.profileImage
    || caregiverUser?.avatar
    || null;

  return {
    profileId: resolvedProfileId,
    userId: resolvedUserId,
    name: name || 'Caregiver',
    email,
    profileImage,
    rating: caregiverProfile?.rating ?? null,
    hourlyRate: caregiverProfile?.hourlyRate ?? null,
    location: caregiverProfile?.location ?? null,
    caregiverProfile,
    caregiverUser
  };
};

// Ensure we always use a valid Mongo ObjectId for DB operations
const resolveCaregiverIds = async (user) => {
  const userMongoId = await resolveUserMongoId(user);

  if (!userMongoId) {
    return {
      profileId: null,
      userId: null
    };
  }

  const caregiverProfile = await Caregiver.findOne({ userId: userMongoId })
    .select('_id userId')
    .lean();

  return {
    profileId: caregiverProfile?._id || null,
    userId: userMongoId
  };
};

const resolveMongoId = async (user) => {
  console.log('🔍 resolveMongoId called with user:', {
    id: user?.id,
    uid: user?.uid,
    mongoId: user?.mongoId,
    _id: user?._id
  });
  const { profileId, userId } = await resolveCaregiverIds(user);

  if (profileId) {
    console.log('✅ Found caregiver profile ID:', profileId);
    return profileId;
  }

  if (userId) {
    return userId;
  }

  console.log('❌ No MongoDB ID found for user');
  return null;
};

// Caregiver applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const { jobId, coverLetter, proposedRate, message } = req.body;
    const { profileId: caregiverProfileId, userId: caregiverUserId } = await resolveCaregiverIds(req.user);

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!caregiverProfileId && !caregiverUserId) {
      return res.status(400).json({
        success: false,
        error: 'Caregiver profile not found. Please complete your caregiver registration.'
      });
    }

      const primaryCaregiverId = caregiverProfileId || caregiverUserId;

    // Check for duplicate application using caregiver identifiers
    const existingApp = await Application.findOne({
      jobId,
      $or: [
        { caregiverId: primaryCaregiverId },
        { caregiverUserId: caregiverUserId || caregiverProfileId }
      ]
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        error: 'You have already applied to this job'
      });
    }

    // Create application in database
    const application = new Application({
      jobId,
      caregiverId: caregiverProfileId,
      caregiverUserId: caregiverUserId || caregiverProfileId,
      coverLetter: coverLetter || '',
      proposedRate: proposedRate ? Number(proposedRate) : undefined,
      message: message || '',
      status: 'pending'
    });

    await application.save();

    // Get job and parent info for notification
    const job = await Job.findById(jobId).populate('clientId', 'name');
    const caregiverInfo = await buildCaregiverDisplayData(caregiverProfileId, caregiverUserId);

    if (job && caregiverInfo?.name) {
      // Send real-time notification to parent
      socketService.notifyNewApplication(job.clientId._id, {
        applicationId: application._id,
        jobTitle: job.title,
        caregiverName: caregiverInfo.name,
        jobId: job._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application,
        caregiver: caregiverInfo
      }
    });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit application'
    });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const parentId = req.user?.mongoId || req.user?._id;
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    const validStatuses = ['pending', 'accepted', 'rejected', 'shortlisted', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const application = await Application.findById(id)
      .populate('caregiverId', 'name email avatar')
      .populate('jobId', 'title clientId');
      
    if (!application) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    // Verify parent owns the job
    if (!application.jobId || !application.jobId.clientId) {
      return res.status(404).json({ 
        success: false,
        error: 'Job or client information not found' 
      });
    }
    
    if (application.jobId.clientId.toString() !== parentId.toString()) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to modify this application' 
      });
    }

    const previousStatus = application.status;
    application.status = status;
    application.reviewedAt = new Date();
    application.reviewedBy = parentId;

    if (feedback) {
      application.feedback = feedback;
    }

    await application.save();

    const caregiverObjectId = application.caregiverId?._id
      || application.caregiverId
      || application.caregiverUserId;

    // Update caregiver's hasCompletedJobs flag when application is completed
    if (status === 'completed' && previousStatus !== 'completed' && caregiverObjectId) {
      try {
        await Caregiver.findByIdAndUpdate(
          caregiverObjectId,
          { hasCompletedJobs: true },
          { new: true }
        );
        console.log(`✅ Updated hasCompletedJobs for caregiver: ${caregiverObjectId}`);
      } catch (error) {
        console.error('❌ Error updating caregiver hasCompletedJobs:', error);
      }
    }
    
    // Send booking confirmation notification to parent if accepted
    if (status === 'accepted' && previousStatus !== 'accepted' && caregiverObjectId) {
      const caregiver = await Caregiver.findById(caregiverObjectId).select('name');
      if (caregiver && socketService?.notifyBookingConfirmed) {
        socketService.notifyBookingConfirmed(parentId, {
          applicationId: application._id,
          caregiverName: caregiver.name,
          jobTitle: application.jobId.title
        });
      }
    }

    // Update job status based on applications
    if (application.jobId && application.jobId._id) {
      const job = await Job.findById(application.jobId._id);
      
      if (job) {
        // If this is the first application, change job status to pending
        const applicationCount = await Application.countDocuments({ 
          jobId: application.jobId._id,
          status: { $in: ['pending', 'shortlisted'] }
        });
        
        if (job.status === 'open' && applicationCount > 0) {
          job.status = 'pending';
          await job.save();
        }
      }
    }

    // Update job status if application is accepted
    if (status === 'accepted' && previousStatus !== 'accepted' && application.jobId && application.jobId._id) {
      const job = await Job.findById(application.jobId._id);
      if (job && caregiverObjectId) {
        job.status = 'filled';
        job.assignedCaregiver = caregiverObjectId;
        await job.save();

        // Create booking from accepted application
        const Booking = require('../models/Booking');
        const booking = new Booking({
          clientId: parentId,
          caregiverId: caregiverObjectId,
          date: job.date,
          startTime: job.startTime,
          endTime: job.endTime,
          address: job.location,
          hourlyRate: job.hourlyRate,
          totalCost: calculateTotalCost(job.startTime, job.endTime, job.hourlyRate),
          status: 'confirmed',
          jobId: job._id,
          applicationId: application._id
        });
        
        await booking.save();
        console.log('✅ Booking created from accepted application:', booking._id);

        // Reject other pending applications for this job
        await Application.updateMany(
          { 
            jobId: application.jobId._id, 
            _id: { $ne: application._id },
            status: 'pending'
          },
          { 
            status: 'rejected',
            feedback: 'Position has been filled',
            reviewedAt: new Date(),
            reviewedBy: parentId
          }
        );
      }
    }

    logger.info(`Application ${id} status updated to ${status} by parent ${parentId}`);

    res.json({ 
      success: true, 
      message: `Application ${status} successfully`,
      data: application 
    });

  } catch (error) {
    logger.error('Update application status error:', error);
    const processedError = processError(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || error.message || 'An error occurred'
    });
  }
};

// Get my applications (caregiver)
exports.getMyApplications = async (req, res) => {
  try {
    console.log('🔍 getMyApplications - User role check:', {
      userId: req.user?.id,
      role: req.user?.role,
      role: req.user?.role
    });
    
    // Check if user is a caregiver
    if (req.user?.role !== 'caregiver') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Only caregivers can view applications.'
      });
    }
    
    const caregiverMongoId = await resolveMongoId(req.user);
    console.log('🔍 Resolved caregiver MongoDB ID:', caregiverMongoId);
    
    if (!caregiverMongoId) {
      return res.status(400).json({
        success: false,
        error: 'Caregiver profile not found. Please complete your caregiver registration.'
      });
    }
    
    // Check if any applications exist for this caregiver
    const applicationCount = await Application.countDocuments({ caregiverId: caregiverMongoId });
    console.log('🔍 Applications count in DB for caregiver ID:', applicationCount);

    const { 
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { caregiverId: caregiverMongoId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    console.log('🔍 Query filter:', filter);
    
    const applications = await Application.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();
    
    // Manually populate job data with parent information
    console.log('🔍 Starting job population for', applications.length, 'applications');
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      console.log('🔍 Processing application', i, 'with jobId:', app.jobId);
      if (app.jobId) {
        try {
          const job = await Job.findById(app.jobId).populate('clientId', 'name email').lean();
          if (job) {
            app.jobId = job;
            // Add parent ID directly to application for easy access
            app.parentId = job.clientId?._id || job.clientId;
            console.log('✅ Populated job with parent ID:', job.title, 'Parent ID:', app.parentId);
          } else {
            console.log('❌ Job not found for ID:', app.jobId);
          }
        } catch (error) {
          console.log('❌ Error populating job:', error.message);
        }
      }
    }
    console.log('🔍 Job population completed');
    
    const total = await Application.countDocuments(filter);
    
    console.log('🔍 Found applications:', applications.length, 'Total:', total);
    
    if (applications.length > 0) {
      console.log('🔍 First application data:', JSON.stringify(applications[0], null, 2));
    }

    res.json({ 
      success: true, 
      data: {
        applications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get my applications error:', error);
    const processedError = processError(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || error.message || 'An error occurred'
    });
  }
};

// Get applications for a specific job (parent)
exports.getJobApplications = async (req, res) => {
  try {
    const parentId = req.user?.mongoId || req.user?._id;
    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify parent owns the job
    const job = await Job.findOne({ _id: jobId, clientId: parentId });
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or not authorized'
      });
    }

    // Build filter
    const filter = { jobId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'caregiverId',
          model: 'Caregiver',
          select: 'name profileImage rating experience hourlyRate bio location'
        })
        .lean(),
      Application.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        applications,
        job: {
          id: job._id,
          title: job.title,
          status: job.status
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get job applications error:', error);
    const processedError = processError(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || error.message || 'An error occurred'
    });
  }
};

// Get single application details
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.mongoId || req.user?._id;

    const application = await Application.findById(id)
      .populate('caregiverId', 'name avatar rating reviewCount experience hourlyRate bio location')
      .populate({
        path: 'jobId',
        select: 'title description location hourlyRate date startTime endTime clientId status',
        populate: {
          path: 'clientId',
          select: 'name avatar'
        }
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Check authorization - either the caregiver who applied or the parent who owns the job
    const isCaregiver = application.caregiverId?._id?.toString() === userId?.toString();
    const isParent = application.jobId?.clientId?._id?.toString() === userId?.toString();

    if (!isCaregiver && !isParent) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this application'
      });
    }

    res.json({
      success: true,
      data: application
    });

  } catch (error) {
    logger.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred'
    });
  }
};

// Withdraw application (caregiver)
exports.withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiverMongoId = await resolveMongoId(req.user);

    const application = await Application.findOne({
      _id: id,
      caregiverId: caregiverMongoId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Cannot withdraw an accepted application'
      });
    }

    await Application.findByIdAndDelete(id);

    logger.info(`Application ${id} withdrawn by caregiver ${caregiverMongoId}`);

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });

  } catch (error) {
    logger.error('Withdraw application error:', error);
    const processedError = processError(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || error.message || 'An error occurred'
    });
  }
};

// Debug endpoint to check caregiver ID resolution
exports.debugCaregiverInfo = async (req, res) => {
  try {
    const caregiverMongoId = await resolveMongoId(req.user);
    const applicationCount = await Application.countDocuments({ caregiverId: caregiverMongoId });
    
    res.json({
      success: true,
      debug: {
        userInfo: {
          id: req.user?.id,
          role: req.user?.role,
          mongoId: req.user?.mongoId
        },
        resolvedCaregiverMongoId: caregiverMongoId,
        applicationsInDB: applicationCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        userInfo: {
          id: req.user?.id,
          role: req.user?.role
        }
      }
    });
  }
};

// Legacy alias for backward compatibility
exports.updateStatus = exports.updateApplicationStatus;
