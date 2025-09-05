const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../utils/auth');
const jobs = require('../controllers/jobController');

// All routes here are authenticated
router.use(authenticate);

// GET /api/jobs - list jobs (optionally filter by status)
router.get('/', jobs.getAllJobs);

// POST /api/jobs - create job
router.post('/', jobs.createJob);

// GET /api/jobs/my - list my jobs (parent)
router.get('/my', jobs.getMyJobs);

// GET /api/jobs/:id - get job by id
router.get('/:id', jobs.getJobById);

// PATCH /api/jobs/:id - update job
router.patch('/:id', jobs.updateJob);

// DELETE /api/jobs/:id - delete job
router.delete('/:id', jobs.deleteJob);

// GET /api/jobs/:id/applications - list applications for a job
router.get('/:id/applications', jobs.getApplicationsForJob);

module.exports = router;
