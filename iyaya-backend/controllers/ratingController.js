const Rating = require('../models/Rating');
const Booking = require('../models/Booking');
const { authenticate } = require('../middleware/auth');
const { createReviewNotification } = require('../services/notificationService');

const ensureUserCanAccessBooking = (booking, user) => {
  if (!booking || !user) {
    return { allowed: false, reason: 'Booking not found' };
    }

  const userId = user.id?.toString();
  const role = user.role;

  if (role === 'parent') {
    if (booking.parent?.toString() === userId) {
      return { allowed: true, type: 'caregiver', ratee: booking.caregiver };
    }
    return { allowed: false, reason: 'You are not the parent for this booking' };
  }

  if (role === 'caregiver') {
    if (booking.caregiver?.toString() === userId) {
      return { allowed: true, type: 'parent', ratee: booking.parent };
    }
    return { allowed: false, reason: 'You are not the caregiver for this booking' };
  }

  return { allowed: false, reason: 'Unsupported user role' };
};

// Rate a caregiver
const rateCaregiver = async (req, res) => {
  try {
    const { caregiverId, bookingId, rating, review } = req.body;
    const userId = req.user.id;

    // Verify the booking exists and belongs to the user
    const booking = await Booking.findOne({
      _id: bookingId,
      parent: userId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      booking: bookingId,
      rater: userId,
      ratee: caregiverId,
      type: 'caregiver'
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this caregiver for this booking'
      });
    }

    const newRating = new Rating({
      booking: bookingId,
      rater: userId,
      ratee: caregiverId,
      rating,
      review,
      type: 'caregiver'
    });

    await newRating.save();

    // Send notification to caregiver
    try {
      await createReviewNotification(newRating, caregiverId, userId);
    } catch (notificationError) {
      console.error('Failed to send review notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: newRating
    });
  } catch (error) {
    console.error('Rate caregiver error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate caregiver'
    });
  }
};

// Rate a parent
const rateParent = async (req, res) => {
  try {
    const { parentId, bookingId, rating, review } = req.body;
    const userId = req.user.id;

    // Verify the booking exists and belongs to the user
    const booking = await Booking.findOne({
      _id: bookingId,
      caregiver: userId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if rating already exists
    const existingRating = await Rating.findOne({
      booking: bookingId,
      rater: userId,
      ratee: parentId,
      type: 'parent'
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this parent for this booking'
      });
    }

    const newRating = new Rating({
      booking: bookingId,
      rater: userId,
      ratee: parentId,
      rating,
      review,
      type: 'parent'
    });

    await newRating.save();

    // Send notification to parent
    try {
      await createReviewNotification(newRating, parentId, userId);
    } catch (notificationError) {
      console.error('Failed to send review notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: newRating
    });
  } catch (error) {
    console.error('Rate parent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate parent'
    });
  }
};

// Get ratings for a specific caregiver
const getCaregiverRatings = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({
      ratee: caregiverId,
      type: 'caregiver'
    })
    .populate('rater', 'name email')
    .populate('booking', 'id')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Rating.countDocuments({
      ratee: caregiverId,
      type: 'caregiver'
    });

    res.status(200).json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get caregiver ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch caregiver ratings'
    });
  }
};

// Get ratings for a specific parent
const getParentRatings = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({
      ratee: parentId,
      type: 'parent'
    })
    .populate('rater', 'name email')
    .populate('booking', 'id')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Rating.countDocuments({
      ratee: parentId,
      type: 'parent'
    });

    res.status(200).json({
      success: true,
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get parent ratings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent ratings'
    });
  }
};

// Get rating summary for a user
const getRatingSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = 'caregiver' } = req.query;

    const type = role === 'caregiver' ? 'caregiver' : 'parent';

    const ratings = await Rating.find({
      ratee: userId,
      type
    });

    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
      : 0;

    res.status(200).json({
      success: true,
      data: {
        userId,
        role,
        totalRatings,
        averageRating: Math.round(averageRating * 10) / 10,
        ratings: ratings.slice(0, 5) // Return last 5 ratings
      }
    });
  } catch (error) {
    console.error('Get rating summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rating summary'
    });
  }
};

// Get an existing rating for a booking made by the current user
const getBookingRating = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select('parent caregiver');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const access = ensureUserCanAccessBooking(booking, req.user);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: access.reason
      });
    }

    const rating = await Rating.findOne({
      booking: bookingId,
      rater: req.user.id,
      type: access.type
    }).populate('ratee', 'name email').populate('rater', 'name email');

    return res.status(200).json({
      success: true,
      data: rating || null
    });
  } catch (error) {
    console.error('Get booking rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking rating'
    });
  }
};

// Determine if the current user can still rate a booking
const canRateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select('parent caregiver status');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    const access = ensureUserCanAccessBooking(booking, req.user);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        error: access.reason,
        canRate: false
      });
    }

    const existingRating = await Rating.findOne({
      booking: bookingId,
      rater: req.user.id,
      type: access.type
    });

    const canRate = !existingRating;

    return res.status(200).json({
      success: true,
      canRate,
      existingRating: existingRating || null
    });
  } catch (error) {
    console.error('Can rate booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify rating eligibility',
      canRate: false
    });
  }
};

module.exports = {
  rateCaregiver,
  rateParent,
  getCaregiverRatings,
  getParentRatings,
  getRatingSummary,
  getBookingRating,
  canRateBooking
};
