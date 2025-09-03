const Booking = require('../models/Booking');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const { validationResult } = require('express-validator');
const { errorHandler } = require('../utils/errorHandler');
const { logger } = require('../utils/logger');
const mongoose = require('mongoose');

// Safe logging and error processing fallbacks
const safeLogError = (...args) => {
  if (logger && typeof logger.error === 'function') {
    try { logger.error(...args); } catch (_) { console.error(...args); }
  } else {
    console.error(...args);
  }
};

const safeLogInfo = (...args) => {
  if (logger && typeof logger.info === 'function') {
    try { logger.info(...args); } catch (_) { console.log(...args); }
  } else {
    console.log(...args);
  }
};

const safeProcessError = (err) => {
  try {
    if (errorHandler && typeof errorHandler.process === 'function') {
      const processed = errorHandler.process(err);
      if (processed && processed.userMessage) return processed;
    }
  } catch (_) { /* ignore */ }
  return { userMessage: 'An unexpected error occurred. Please try again.' };
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      caregiverId,
      date,
      startTime,
      endTime,
      children,
      address,
      contact,
      emergencyContact,
      specialInstructions,
      hourlyRate,
      totalCost,
      paymentMethod = 'cash'
    } = req.body;

    // Verify caregiver exists and is a caregiver (accepts User _id or Caregiver profile _id)
    if (!caregiverId || !mongoose.Types.ObjectId.isValid(caregiverId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid caregiver ID format' 
      });
    }
    
    // Try direct User lookup first
    let caregiverUser = await User.findById(caregiverId);

    // Fallback: if not a User, treat caregiverId as Caregiver profile _id and resolve its userId
    if (!caregiverUser) {
      const caregiverProfile = await Caregiver.findById(caregiverId).select('userId').lean();
      if (caregiverProfile?.userId) {
        caregiverUser = await User.findById(caregiverProfile.userId);
      }
    }
    
    if (!caregiverUser) {
      return res.status(404).json({ 
        success: false, 
        error: 'Caregiver not found in database' 
      });
    }
    
    const allowedCaregiverRoles = ['caregiver', 'provider'];
    if (!allowedCaregiverRoles.includes(caregiverUser.role)) {
      return res.status(400).json({ 
        success: false, 
        error: `User is not a caregiver (role: ${caregiverUser.role})` 
      });
    }

    // Get parent ID
    let parentMongoId = req.user?.mongoId || req.user?._id;
    if (!parentMongoId) {
      try {
        const parentUser = await User.findOne({ firebaseUid: req.user.id }).select('_id');
        if (parentUser) parentMongoId = parentUser._id;
      } catch (err) {
        safeLogError('Failed to resolve parent ID:', err);
      }
    }

    if (!parentMongoId) {
      return res.status(400).json({
        success: false,
        error: 'Unable to identify parent user'
      });
    }

    // Verify parent role
    const parent = await User.findById(parentMongoId);
    if (!parent || parent.role !== 'parent') {
      return res.status(403).json({
        success: false,
        error: 'Only parents can create bookings'
      });
    }

    // Check for booking conflicts
    const bookingDate = new Date(date);
    
    // Validate date
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }
    
    const conflictingBooking = await Booking.findOne({
      caregiverId: caregiverUser._id,
      date: bookingDate,
      status: { $in: ['confirmed', 'in_progress'] },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        },
        {
          startTime: { $gte: startTime },
          endTime: { $lte: endTime }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: 'Caregiver is not available during the requested time'
      });
    }

    // Calculate total cost if not provided
    let calculatedTotalCost = totalCost;
    if (!calculatedTotalCost && hourlyRate) {
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const hours = (end - start) / (1000 * 60 * 60);
      calculatedTotalCost = hours * hourlyRate;
    }

    // Get caregiver profile data
    const caregiverProfile = await Caregiver.findOne({ userId: caregiverUser._id })
      .select('displayName bio experience education certifications languages skills avatar availability')
      .lean();

    // Create booking with caregiver details
    const booking = await Booking.create({
      parentId: parentMongoId,
      caregiverId: caregiverUser._id,
      // Include caregiver details directly to avoid stale data
      caregiver: {
        _id: caregiverUser._id,
        name: caregiverUser.name || (caregiverProfile ? caregiverProfile.displayName : 'Unknown Caregiver'),
        email: caregiverUser.email,
        phone: caregiverUser.phone,
        profileImage: caregiverUser.profileImage || (caregiverProfile ? caregiverProfile.avatar : null),
        // Include additional profile data that might be useful
        profile: caregiverProfile ? {
          displayName: caregiverProfile.displayName,
          bio: caregiverProfile.bio,
          experience: caregiverProfile.experience,
          education: caregiverProfile.education,
          certifications: caregiverProfile.certifications,
          languages: caregiverProfile.languages,
          skills: caregiverProfile.skills
        } : null
      },
      date: bookingDate,
      startTime,
      endTime,
      children,
      address,
      contact,
      emergencyContact,
      specialInstructions,
      hourlyRate: Number(hourlyRate),
      totalCost: Number(calculatedTotalCost),
      paymentMethod,
      status: 'pending_confirmation',
      paymentStatus: 'pending'
    });

    // Populate the parent data
    await booking.populate({
      path: 'parentId',
      select: 'name email phone avatar'
    });

    safeLogInfo(`Booking created by parent ${parentMongoId} with caregiver ${caregiverId}`);

    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully',
      data: booking 
    });

  } catch (error) {
    safeLogError('Create booking error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Get current user's bookings with caregiver profile data
// Get current user's bookings with caregiver profile data
exports.getMyBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Resolve parent MongoDB ID (handle both Firebase UID and MongoDB ID)
    let parentMongoId = req.user?.mongoId || req.user?._id;
    if (!parentMongoId) {
      try {
        // If we have a Firebase UID, look up the user in MongoDB
        const parentUser = await User.findOne({ firebaseUid: req.user.id }).select('_id');
        if (parentUser) {
          parentMongoId = parentUser._id;
        } else {
          // Fallback: try using the req.user.id as MongoDB ID if it's a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(req.user.id)) {
            parentMongoId = req.user.id;
          }
        }
      } catch (err) {
        safeLogError('Failed to resolve parent ID:', err);
        return res.status(400).json({
          success: false,
          error: 'Unable to identify parent user'
        });
      }
    }

    if (!parentMongoId) {
      return res.status(400).json({
        success: false,
        error: 'Unable to identify parent user'
      });
    }

    // Build query
    const query = { parentId: parentMongoId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Get total count for pagination
    const total = await Booking.countDocuments(query);

    // Get paginated bookings with caregiver data populated
    const bookings = await Booking.find(query)
      .populate({
        path: 'caregiverId',
        select: 'name email phone avatar role',
      })
      .populate('parentId', 'name email phone avatar')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // If we have bookings with caregivers, fetch their profiles
    let caregiverProfilesMap = {};
    const caregiverUserIds = bookings
      .map(booking => booking.caregiverId?._id)
      .filter(id => id);
    
    if (caregiverUserIds.length > 0) {
      const caregiverProfiles = await Caregiver.find({ 
        userId: { $in: caregiverUserIds } 
      }).lean();
      
      // Create a map for quick lookup
      caregiverProfiles.forEach(profile => {
        caregiverProfilesMap[profile.userId.toString()] = profile;
      });
    }

    // Process each booking to include caregiver data and formatted dates
    const processedBookings = bookings.map(booking => {
      const bookingObj = { ...booking };
      
      // Format date
      if (bookingObj.date) {
        bookingObj.formattedDate = new Date(bookingObj.date).toLocaleDateString();
        bookingObj.date = new Date(bookingObj.date).toISOString().split('T')[0];
      }

      // Calculate duration in hours and total earnings
      if (bookingObj.startTime && bookingObj.endTime) {
        const [startHour, startMinute] = bookingObj.startTime.split(':').map(Number);
        const [endHour, endMinute] = bookingObj.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
        bookingObj.duration = duration.toFixed(1);
        bookingObj.totalEarnings = (duration * (bookingObj.hourlyRate || 0)).toFixed(2);
      }

      // Extract caregiver data if available
      if (bookingObj.caregiverId) {
        const caregiverData = bookingObj.caregiverId;
        const caregiverProfile = caregiverProfilesMap[caregiverData._id.toString()] || {};
        
        bookingObj.caregiver = {
          id: caregiverData._id,
          name: caregiverData.name,
          email: caregiverData.email,
          phone: caregiverData.phone,
          avatar: caregiverData.avatar,
          role: caregiverData.role,
          // Include caregiver profile data
          bio: caregiverProfile.bio,
          experience: caregiverProfile.experience,
          rating: caregiverProfile.rating,
          reviewCount: caregiverProfile.reviewCount,
          displayName: caregiverProfile.displayName,
          hourlyRate: caregiverProfile.hourlyRate
        };
      } else {
        // Fallback if no caregiver data
        bookingObj.caregiver = {
          id: null,
          name: 'Unknown Caregiver',
          email: '',
          phone: '',
          avatar: null
        };
      }

      // Format timestamps
      if (bookingObj.createdAt) {
        bookingObj.createdAtFormatted = new Date(bookingObj.createdAt).toLocaleString();
      }
      if (bookingObj.updatedAt) {
        bookingObj.updatedAtFormatted = new Date(bookingObj.updatedAt).toLocaleString();
      }

      // Remove the populated fields we don't need in the response
      delete bookingObj.caregiverId;
      
      return bookingObj;
    });

    safeLogInfo(`Found ${processedBookings.length} bookings for parent ${parentMongoId}`);

    res.status(200).json({
      success: true,
      data: {
        bookings: processedBookings,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
          hasNextPage: (page * limit) < total,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    safeLogError('Get my bookings error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { status, feedback } = req.body;
    const userId = req.user?.mongoId || req.user?._id;

    const validStatuses = [
      'pending_confirmation', 'confirmed', 'in_progress', 
      'completed', 'cancelled', 'no_show'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const booking = await Booking.findById(id)
      .populate('parentId', 'name email')
      .populate('caregiverId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isParent = booking.parentId._id.toString() === userId.toString();
    const isCaregiver = booking.caregiverId._id.toString() === userId.toString();

    if (!isParent && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this booking'
      });
    }

    // Status transition validation
    const allowedTransitions = {
      'pending_confirmation': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled', 'no_show'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Final state
      'cancelled': [], // Final state
      'no_show': [] // Final state
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot change status from ${booking.status} to ${status}`
      });
    }

    // Role-based status change restrictions
    if (status === 'confirmed' && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers can confirm bookings'
      });
    }

    if (status === 'in_progress' && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers can start bookings'
      });
    }

    if (status === 'completed' && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Only caregivers can complete bookings'
      });
    }

    // Update booking
    booking.status = status;
    if (feedback) {
      booking.feedback = feedback;
    }
    booking.updatedAt = new Date();

    // Set completion time for completed bookings
    if (status === 'completed') {
      booking.completedAt = new Date();
    }

    await booking.save();

    safeLogInfo(`Booking ${id} status updated to ${status} by user ${userId}`);

    res.json({
      success: true,
      message: `Booking ${status} successfully`,
      data: booking
    });

  } catch (error) {
    safeLogError('Update booking status error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Upload payment proof (base64) for a booking
exports.uploadPaymentProof = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment proof image is required' 
      });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    // Verify parent owns the booking
    let parentMongoId = req.user?.mongoId || req.user?._id;
    if (!parentMongoId) {
      try {
        const parentUser = await User.findOne({ firebaseUid: req.user.id }).select('_id');
        if (parentUser) parentMongoId = parentUser._id;
      } catch (err) {
        safeLogError('Failed to resolve parent ID:', err);
      }
    }

    if (!booking.parentId || booking.parentId.toString() !== String(parentMongoId)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this booking' 
      });
    }

    // Update payment information
    booking.paymentStatus = 'pending_verification';
    booking.paymentScreenshotBase64 = imageBase64;
    booking.paymentMimeType = mimeType;
    booking.paymentDate = new Date();
    await booking.save();

    safeLogInfo(`Payment proof uploaded for booking ${id} by parent ${parentMongoId}`);

    res.json({ 
      success: true, 
      message: 'Payment proof uploaded successfully',
      data: {
        paymentStatus: booking.paymentStatus,
        paymentDate: booking.paymentDate
      }
    });

  } catch (error) {
    safeLogError('Upload payment proof error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.mongoId || req.user?._id;

    const booking = await Booking.findById(id)
      .populate('parentId', 'name email phone avatar')
      .populate('caregiverId', 'name email phone avatar rating reviewCount');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isParent = booking.parentId._id.toString() === userId.toString();
    const isCaregiver = booking.caregiverId._id.toString() === userId.toString();

    if (!isParent && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    safeLogError('Get booking by ID error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.mongoId || req.user?._id;

    const booking = await Booking.findById(id)
      .populate('parentId', 'name email')
      .populate('caregiverId', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check authorization
    const isParent = booking.parentId._id.toString() === userId.toString();
    const isCaregiver = booking.caregiverId._id.toString() === userId.toString();

    if (!isParent && !isCaregiver) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled (idempotent for already-cancelled)
    if (booking.status === 'cancelled') {
      // Idempotent success: already cancelled
      return res.status(200).json({
        success: true,
        message: 'Booking already cancelled',
        data: booking
      });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a booking that is already completed'
      });
    }

    // Check cancellation policy (24 hours before start time)
    const bookingDateTime = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}:00`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24 && booking.status === 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel confirmed bookings less than 24 hours before start time'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledBy = userId;
    booking.cancelledAt = new Date();
    await booking.save();

    safeLogInfo(`Booking ${id} cancelled by user ${userId}`);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    safeLogError('Cancel booking error:', error);
    const processedError = safeProcessError(error);
    res.status(500).json({
      success: false,
      error: processedError.userMessage
    });
  }
};