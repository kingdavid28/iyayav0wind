const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const jobController = require('../controllers/jobController');

// Get user's posted jobs
router.get('/my', authenticate, jobController.getMyJobs);

// Get all available jobs (for caregivers to browse)
router.get('/', authenticate, jobController.getAllJobs);

// Create new job
router.post('/', authenticate, jobController.createJob);

// Update job
router.put('/:id', authenticate, jobController.updateJob);

// Get job by ID
router.get('/:id', authenticate, jobController.getJobById);

// Apply to job (caregiver) - handled by applications routes
// router.post('/:id/apply', authenticate, applicationController.createApplication);

// Delete job
router.delete('/:id', authenticate, jobController.deleteJob);

// Get applications for a job (parent only)
router.get('/:id/applications', authenticate, jobController.getApplicationsForJob);

module.exports = router;