const Booking = require('../models/Booking');
const User = require('../models/User');

// Get user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    console.log(`getMyBookings called for user: ${req.user.id}, role: ${req.user.role}`);
    
    const Caregiver = require('../models/Caregiver');
    let caregiverProfileId = null;
    
    if (req.user.role === 'caregiver') {
      const caregiverProfile = await Caregiver.findOne({ userId: req.user.id });
      caregiverProfileId = caregiverProfile ? caregiverProfile._id : null;
      console.log(`Caregiver ${req.user.id} has profile ID: ${caregiverProfileId}`);
    }
    
    const searchCriteria = {
      $or: [
        { clientId: req.user.id },
        { caregiverId: req.user.id }
      ]
    };
    
    if (caregiverProfileId) {
      searchCriteria.$or.push({ caregiverId: caregiverProfileId });
    }
    
    console.log(`Search criteria:`, JSON.stringify(searchCriteria));
    
    const bookings = await Booking.find(searchCriteria)
    .populate('clientId', 'name email')
    .populate('caregiverId', 'name email')
    .sort({ createdAt: -1 });

    console.log(`Found ${bookings.length} bookings for user: ${req.user.id}`);
    
    res.json({
      success: true,
      bookings: bookings
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
    const newBooking = new Booking({
      ...req.body,
      clientId: req.user.id,
      status: 'pending'
    });
    
    await newBooking.save();
    
    console.log(`Booking created by user: ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: {
        booking: newBooking
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking'
    });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { 
        _id: req.params.id,
        $or: [
          { clientId: req.user.id },
          { caregiverId: req.user.id }
        ]
      },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
    }
    
    res.json({
      success: true,
      data: {
        booking: booking
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
    .populate('clientId', 'name email')
    .populate('caregiverId', 'name email');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found or not authorized'
      });
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
    
    const Caregiver = require('../models/Caregiver');
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