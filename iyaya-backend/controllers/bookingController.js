const Booking = require('../models/Booking');
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');

const normalizeChildField = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value ?? '';
};

const sanitizeChildren = (children) => {
  if (!Array.isArray(children)) {
    return undefined;
  }

  return children.map((child) => {
    if (!child || typeof child !== 'object') {
      return child;
    }

    return {
      ...child,
      preferences: normalizeChildField(child.preferences),
      allergies: normalizeChildField(child.allergies),
      specialInstructions: normalizeChildField(child.specialInstructions ?? child.instructions),
      notes: normalizeChildField(child.notes),
    };
  });
};

// Get user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    console.log(`getMyBookings called for user: ${req.user.id}, role: ${req.user.role}`);
    
    const searchCriteria = {
      $or: [
        { clientId: req.user.id },
        { caregiverId: req.user.id }
      ]
    };
    
    const bookings = await Booking.find(searchCriteria)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
    
    // Add parentId for messaging purposes
    bookings.forEach(booking => {
      if (booking.clientId) {
        booking.parentId = booking.clientId._id || booking.clientId;
      }
    });
    
    // Enhance bookings with caregiver data
    for (const booking of bookings) {
      if (booking.caregiverId) {
        // Try to find caregiver by profile ID first
        let caregiver = await Caregiver.findById(booking.caregiverId).populate('userId', 'name email');
        
        if (caregiver) {
          booking.caregiverId = {
            _id: caregiver._id,
            name: caregiver.name || caregiver.userId?.name || 'Unknown Caregiver',
            email: caregiver.userId?.email || 'no-email@example.com',
            profileImage: caregiver.profileImage,
            avatar: caregiver.profileImage,
            hourlyRate: caregiver.hourlyRate
          };
        } else {
          // Try to find by user ID if profile ID lookup failed
          const user = await User.findById(booking.caregiverId);
          if (user) {
            const caregiverProfile = await Caregiver.findOne({ userId: user._id });
            booking.caregiverId = {
              _id: user._id,
              name: caregiverProfile?.name || user.name || 'Unknown Caregiver',
              email: user.email || 'no-email@example.com',
              profileImage: caregiverProfile?.profileImage,
              avatar: caregiverProfile?.profileImage,
              hourlyRate: caregiverProfile?.hourlyRate
            };
          }
        }
      }
    }
    
    const bookingsWithSanitizedChildren = bookings.map((bookingDoc) => {
      const sanitizedChildren = sanitizeChildren(bookingDoc.children);

      if (sanitizedChildren !== undefined) {
        bookingDoc.children = sanitizedChildren;
      }

      return bookingDoc;
    });

    res.json({
      success: true,
      data: {
        bookings: bookingsWithSanitizedChildren,
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings'
    });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const sanitizedChildren = sanitizeChildren(req.body.children);

    const bookingPayload = {
      ...req.body,
      clientId: req.user.id,
      status: 'pending',
    };

    if (sanitizedChildren !== undefined) {
      bookingPayload.children = sanitizedChildren;
    }

    const newBooking = new Booking(bookingPayload);
    
    await newBooking.save();
    
    // Populate caregiver data for response
    if (newBooking.caregiverId) {
      const caregiver = await Caregiver.findById(newBooking.caregiverId).populate('userId', 'name email');
      if (caregiver) {
        newBooking.caregiverId = {
          _id: caregiver._id,
          name: caregiver.name || caregiver.userId?.name || 'Unknown Caregiver',
          email: caregiver.userId?.email || 'no-email@example.com',
          profileImage: caregiver.profileImage,
          avatar: caregiver.profileImage,
          hourlyRate: caregiver.hourlyRate
        };
      }
    }
    
    const result = newBooking.toObject();
    const resultChildren = sanitizeChildren(result.children);

    if (resultChildren !== undefined) {
      result.children = resultChildren;
    }

    res.status(201).json({
      success: true,
      data: {
        booking: result,
      },
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const sanitizedChildren = sanitizeChildren(req.body.children);

    const updatePayload = {
      ...req.body,
    };

    if (sanitizedChildren !== undefined) {
      updatePayload.children = sanitizedChildren;
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { clientId: req.user.id },
          { caregiverId: req.user.id }
        ]
      },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }

    const updated = booking.toObject();
    const updatedChildren = sanitizeChildren(updated.children);

    if (updatedChildren !== undefined) {
      updated.children = updatedChildren;
    }

    res.json({
      success: true,
      data: {
        booking: updated,
      }
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking'
    });
  }
};

// Upload payment proof
exports.uploadPaymentProof = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    
    // In a real implementation, you'd save the image file
    // For now, just store the base64 string
    const booking = await Booking.findOneAndUpdate(
      { 
        _id: req.params.id,
        clientId: req.user.id
      },
      { paymentProof: imageBase64 },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    res.json({
      success: true,
      url: 'payment-proof-uploaded'
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload payment proof'
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      $or: [
        { clientId: req.user.id },
        { caregiverId: req.user.id }
      ]
    })
    .populate('clientId', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    // Enhance with caregiver data
    if (booking.caregiverId) {
      const caregiver = await Caregiver.findById(booking.caregiverId).populate('userId', 'name email');
      if (caregiver) {
        booking.caregiverId = {
          _id: caregiver._id,
          name: caregiver.name || caregiver.userId?.name || 'Unknown Caregiver',
          email: caregiver.userId?.email || 'no-email@example.com',
          profileImage: caregiver.profileImage,
          avatar: caregiver.profileImage,
          hourlyRate: caregiver.hourlyRate
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        booking: booking
      }
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking'
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    console.log(`🔄 updateBookingStatus called for booking: ${req.params.id}, user: ${req.user.id}, role: ${req.user.role}`);
    const { status, feedback } = req.body;
    
    let caregiverProfileId = null;
    
    if (req.user.role === 'caregiver') {
      const caregiverProfile = await Caregiver.findOne({ userId: req.user.id });
      caregiverProfileId = caregiverProfile ? caregiverProfile._id : null;
      console.log(`📋 Caregiver profile ID: ${caregiverProfileId}`);
    }
    
    const searchCriteria = {
      _id: req.params.id,
      $or: [
        { clientId: req.user.id },
        { caregiverId: req.user.id }
      ]
    };
    
    if (caregiverProfileId) {
      searchCriteria.$or.push({ caregiverId: caregiverProfileId });
    }
    
    console.log(`🔍 Update search criteria:`, JSON.stringify(searchCriteria, null, 2));
    
    const booking = await Booking.findOneAndUpdate(
      searchCriteria,
      { status, feedback },
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      console.log(`❌ Booking not found with criteria:`, searchCriteria);
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    console.log(`✅ Booking status updated to ${status} by user: ${req.user.id}`);
    
    // Update caregiver's hasCompletedJobs flag when booking is completed
    if (status === 'completed' && booking.caregiverId) {
      try {
        await Caregiver.findByIdAndUpdate(
          booking.caregiverId,
          { hasCompletedJobs: true },
          { new: true }
        );
        console.log(`✅ Updated hasCompletedJobs for caregiver: ${booking.caregiverId}`);
      } catch (error) {
        console.error('❌ Error updating caregiver hasCompletedJobs:', error);
      }
    }
    
    res.json({
      success: true,
      data: {
        booking: booking
      }
    });
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status'
    });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { 
        _id: req.params.id,
        clientId: req.user.id
      },
      { status: 'cancelled' },
      { new: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel booking'
    });
  }
};

module.exports = {
  getMyBookings: exports.getMyBookings,
  createBooking: exports.createBooking,
  updateBooking: exports.updateBooking,
  uploadPaymentProof: exports.uploadPaymentProof,
  getBookingById: exports.getBookingById,
  updateBookingStatus: exports.updateBookingStatus,
  cancelBooking: exports.cancelBooking
};