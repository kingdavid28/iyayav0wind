const Job = require('../models/Job');
const Application = require('../models/Application');
const mongoose = require('mongoose');

// Create a new job (parent)
exports.createJob = async (req, res, next) => {
  try {
    const parentId = req.user?.mongoId || req.user?._id;
    if (!parentId) return res.status(400).json({ message: 'Missing user context' });

    const required = ['title', 'description', 'location', 'rate', 'startDate'];
    for (const k of required) {
      if (req.body[k] === undefined || req.body[k] === null || req.body[k] === '') {
        return res.status(400).json({ message: `Missing required field: ${k}` });
      }
    }

    const job = await Job.create({
      parentId,
      title: req.body.title,
      description: req.body.description,
      location: req.body.location,
      rate: Number(req.body.rate),
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      workingHours: req.body.workingHours,
      requirements: req.body.requirements || [],
      children: req.body.children || [],
      status: 'open',
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    next(err);
  }
};

// Get current parent's jobs
exports.getMyJobs = async (req, res, next) => {
  try {
    const parentId = req.user?.mongoId || req.user?._id;
    if (!parentId || !mongoose.Types.ObjectId.isValid(parentId)) {
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
