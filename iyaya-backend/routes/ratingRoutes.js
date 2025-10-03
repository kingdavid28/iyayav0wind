const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  rateCaregiver,
  rateParent,
  getCaregiverRatings,
  getRatingSummary,
  getParentRatings,
  getBookingRating,
  canRateBooking
} = require('../controllers/ratingController');

// All rating routes require authentication
router.use(authenticate);

// Rate a caregiver
router.post('/caregiver', rateCaregiver);

// Rate a parent
router.post('/parent', rateParent);

// Get ratings for a specific caregiver
router.get('/caregiver/:caregiverId', getCaregiverRatings);

// Get ratings for a specific parent
router.get('/parent/:parentId', getParentRatings);

// Get rating summary for a user
router.get('/summary/:userId', getRatingSummary);

// Check existing rating for a booking by current user
router.get('/booking/:bookingId', getBookingRating);

// Determine if the current user can rate a booking
router.get('/can-rate/:bookingId', canRateBooking);

module.exports = router;
