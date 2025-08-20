const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const applications = require('../controllers/applicationController');

router.use(authenticate);

// POST /api/applications - caregiver applies to a job
router.post('/', applications.applyToJob);

// GET /api/applications/my-applications - caregiver's applications
router.get('/my-applications', applications.getMyApplications);

// PATCH /api/applications/:id - parent updates status (accept/reject/shortlist)
router.patch('/:id', applications.updateStatus);

module.exports = router;
