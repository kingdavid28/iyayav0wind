const Application = require('../models/Application');
const Job = require('../models/Job');

// Caregiver applies to a job
exports.applyToJob = async (req, res, next) => {
  try {
    const caregiverId = req.user && req.user.id ? req.user.id : req.user?._id;
    const { jobId, coverLetter, proposedRate, message } = req.body;
    if (!jobId) return res.status(400).json({ message: 'jobId is required' });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const exists = await Application.findOne({ jobId, caregiverId });
    if (exists) return res.status(400).json({ message: 'Already applied to this job' });

    const app = await Application.create({ jobId, caregiverId, coverLetter, proposedRate, message });
    res.status(201).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

// Parent updates application status (accept/reject/shortlist)
exports.updateStatus = async (req, res, next) => {
  try {
    const parentId = req.user && req.user.id ? req.user.id : req.user?._id;
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'accepted', 'rejected', 'shortlisted'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const job = await Job.findOne({ _id: app.jobId, parentId });
    if (!job) return res.status(403).json({ message: 'Not authorized to modify this application' });

    app.status = status;
    app.reviewedAt = new Date();
    app.reviewedBy = parentId;
    await app.save();

    if (status === 'accepted') {
      job.status = 'in_progress';
      job.assignedCaregiver = app.caregiverId;
      await job.save();
    }

    res.json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

// Get my applications (caregiver)
exports.getMyApplications = async (req, res, next) => {
  try {
    const caregiverId = req.user && req.user.id ? req.user.id : req.user?._id;
    const apps = await Application.find({ caregiverId })
      .sort({ createdAt: -1 })
      .populate({ path: 'jobId', select: 'title location rate startDate status' });

    res.json({ success: true, applications: apps });
  } catch (err) {
    next(err);
  }
};
