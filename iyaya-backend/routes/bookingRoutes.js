const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// All booking routes require authentication
router.use(authenticate);

// Create a new booking
router.post('/', bookingController.createBooking);

// Get current user's (parent) bookings
router.get('/my', bookingController.getMyBookings);

module.exports = router;
