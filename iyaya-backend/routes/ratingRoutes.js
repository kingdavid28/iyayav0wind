const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  rateCaregiver,
  rateParent,
  getCaregiverRatings,
  getRatingSummary
} = require('../controllers/ratingController');

// All rating routes require authentication
router.use(authenticate);

// Rate a caregiver
router.post('/caregiver', rateCaregiver);

// Rate a parent
router.post('/parent', rateParent);

// Get ratings for a specific caregiver
router.get('/caregiver/:caregiverId', getCaregiverRatings);

// Get rating summary for a user
router.get('/summary/:userId', getRatingSummary);

module.exports = router;
