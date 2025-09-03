const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { process: processError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// Ensure we always use a valid Mongo ObjectId for DB operations
const mongoose = require('mongoose');
const resolveMongoId = (user) => {
  const id = user?.mongoId || user?._id || user?.id;
  return mongoose.isValidObjectId(id) ? id : null;
};

// Caregiver applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const caregiverMongoId = resolveMongoId(req.user);
    if (!caregiverMongoId) {
      return res.status(401).json({ 
        success: false,
        error: 'User mapping not found. Ensure your account exists in the database.' 
      });
    }

    // Verify user is a caregiver
    const user = await User.findById(caregiverMongoId);
    if (!user || user.role !== 'caregiver') {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers can apply to jobs'
      });
    }

    const { jobId, coverLetter, proposedRate, message } = req.body;
    
    if (!jobId) {
      return res.status(400).json({ 
        success: false,
        error: 'Job ID is required' 
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found' 
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        error: 'This job is no longer accepting applications'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({ 
      jobId, 
      caregiverId: caregiverMongoId 
    });
    
    if (existingApplication) {
      return res.status(400).json({ 
        success: false,
        error: 'You have already applied to this job' 
      });
    }

    const application = await Application.create({ 
      jobId, 
      caregiverId: caregiverMongoId, 
      coverLetter, 
      proposedRate: proposedRate ? Number(proposedRate) : undefined, 
      message,
      status: 'pending'
    });

    await application.populate([
      { path: 'jobId', select: 'title location rate startDate' },
      { path: 'caregiverId', select: 'name avatar rating reviewCount' }
    ]);

    logger.info(`Application submitted by caregiver ${caregiverMongoId} for job ${jobId}`);

    res.status(201).json({ 
      success: true, 
      message: 'Application submitted successfully',
      data: application 
    });

  } catch (error) {
    logger.error('Apply to job error:', error);
    const processedError = processError(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || error.message || 'An error occurred'
    });
  }
};

// Parent updates application status (accept/reject/shortlist)
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
    
    const validStatuses = ['pending', 'accepted', 'rejected', 'shortlisted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const application = await Application.findById(id)
      .populate('caregiverId', 'name email avatar')
      .populate('jobId', 'title parentId');
      
    if (!application) {
      return res.status(404).json({ 
        success: false,
        error: 'Application not found' 
      });
    }

    // Verify parent owns the job
    if (application.jobId.parentId.toString() !== parentId.toString()) {
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

    // Update job status if application is accepted
    if (status === 'accepted' && previousStatus !== 'accepted') {
      const job = await Job.findById(application.jobId._id);
      job.status = 'filled';
      job.assignedCaregiver = application.caregiverId._id;
      await job.save();

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
    const caregiverMongoId = resolveMongoId(req.user);
    if (!caregiverMongoId) {
      return res.status(401).json({ 
        success: false,
        error: 'User mapping not found. Ensure your account exists in the database.' 
      });
    }

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

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'jobId', 
          select: 'title location rate startDate endDate status urgency',
          populate: {
            path: 'parentId',
            select: 'name avatar rating reviewCount'
          }
        })
        .lean(),
      Application.countDocuments(filter)
    ]);

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
    const job = await Job.findOne({ _id: jobId, parentId });
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
        .populate('caregiverId', 'name avatar rating reviewCount experience hourlyRate bio location')
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
        select: 'title description location rate startDate endDate parentId status',
        populate: {
          path: 'parentId',
          select: 'name avatar rating reviewCount'
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
    const isParent = application.jobId?.parentId?._id?.toString() === userId?.toString();

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
    const caregiverMongoId = resolveMongoId(req.user);

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

// Legacy alias for backward compatibility
exports.updateStatus = exports.updateApplicationStatus;
