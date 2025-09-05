const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const errorHandler = require('../utils/errorHandler');
const { logger } = require('../utils/logger');

// Get all jobs (public listing for caregivers)
exports.getAllJobs = async (req, res) => {
  try {
    const { 
      status = 'open',
      location,
      minRate,
      maxRate,
      startDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { status };
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (minRate || maxRate) {
      filter.rate = {};
      if (minRate) filter.rate.$gte = Number(minRate);
      if (maxRate) filter.rate.$lte = Number(maxRate);
    }
    
    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate('parentId', 'name avatar rating reviewCount')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Job.countDocuments(filter)
    ]);

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await Application.countDocuments({ 
          jobId: job._id,
          status: { $in: ['pending', 'accepted'] }
        });
        return { ...job, applicationCount };
      })
    );

    res.json({
      success: true,
      data: {
        jobs: jobsWithCounts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Get all jobs error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || 'Failed to fetch jobs'
    });
  }
};

// Create a new job (parent)
exports.createJob = async (req, res) => {
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
    if (!parentId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing user context' 
      });
    }

    // Verify user is a parent
    const user = await User.findById(parentId);
    if (!user || user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can create job postings'
      });
    }

    const {
      title,
      description,
      location,
      rate,
      salary,
      startDate,
      endDate,
      workingHours,
      requirements = [],
      children = [],
      urgency = 'normal'
    } = req.body;
    
    // Basic validation
    if (!title || !description || !location || (!rate && !salary)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, description, location, and salary are required'
      });
    }
    
    const jobRate = rate || salary;

    const job = await Job.create({
      parentId,
      title,
      description,
      location,
      rate: Number(jobRate),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      workingHours,
      requirements,
      children,
      urgency,
      status: 'open'
    });

    await job.populate('parentId', 'name avatar');

    logger.info(`Job created by parent ${parentId}: ${job._id}`);

    res.status(201).json({ 
      success: true, 
      message: 'Job posted successfully',
      data: job 
    });

  } catch (error) {
    logger.error('Create job error:', error);
    const processedError = errorHandler.process(error);
    res.status(500).json({
      success: false,
      error: processedError?.userMessage || 'Failed to create job'
    });
  }
};

// Get current parent's jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    let parentId = req.user?.mongoId || req.user?._id;

    // Fallback: resolve Mongo user by firebaseUid if mongoId missing
    if ((!parentId || !mongoose.Types.ObjectId.isValid(parentId)) && req.user?.id) {
      try {
        const dbUser = await User.findOne({ firebaseUid: req.user.id }).select('_id');
        if (dbUser?._id) {
          parentId = dbUser._id;
        }
      } catch (resolveErr) {
        console.warn('[jobs.getMyJobs] Failed to resolve mongoId by firebaseUid:', resolveErr?.message || resolveErr);
      }
    }

    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
      // In development with dev-bypass, gracefully return empty jobs instead of 400
      if (req.user?.bypass === true) {
        return res.json({ success: true, jobs: [] });
      }
      return res.status(400).json({ message: 'Invalid or missing user id for jobs query' });
    }

    const jobs = await Job.find({ parentId }).sort({ createdAt: -1 });
    res.json({ success: true, jobs });
  } catch (err) {
    next(err);
  }
};

// Get a job by id (with applications count)
exports.getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const applicationsCount = await Application.countDocuments({ jobId: job._id });
    res.json({ success: true, job, applicationsCount });
  } catch (err) {
    next(err);
  }
};

// Update job (only parent owner)
exports.updateJob = async (req, res, next) => {
  try {
    const parentId = req.user?.mongoId || req.user?._id;
    const job = await Job.findOne({ _id: req.params.id, parentId });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const updatable = ['title', 'description', 'location', 'rate', 'startDate', 'endDate', 'workingHours', 'requirements', 'children', 'status'];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) job[k] = req.body[k];
    });

    await job.save();
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// Delete job (only parent owner)
exports.deleteJob = async (req, res, next) => {
  try {
    const parentId = req.user?.mongoId || req.user?._id;
    const job = await Job.findOneAndDelete({ _id: req.params.id, parentId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    await Application.deleteMany({ jobId: job._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// List applications for a job (parent owner)
exports.getApplicationsForJob = async (req, res, next) => {
  try {
    const parentId = req.user && req.user.id ? req.user.id : req.user?._id;
    const job = await Job.findOne({ _id: req.params.id, parentId });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const apps = await Application.find({ jobId: job._id })
      .sort({ createdAt: -1 })
      .populate({ path: 'caregiverId', select: 'displayName photoURL email phoneNumber role' });

    const applications = apps.map((a) => ({
      _id: a._id,
      jobId: a.jobId,
      caregiverId: a.caregiverId?._id || a.caregiverId,
      caregiver: a.caregiverId && a.caregiverId.displayName ? {
        displayName: a.caregiverId.displayName,
        photoURL: a.caregiverId.photoURL,
        email: a.caregiverId.email,
        phoneNumber: a.caregiverId.phoneNumber,
      } : undefined,
      coverLetter: a.coverLetter,
      proposedRate: a.proposedRate,
      message: a.message,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));

    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
};
