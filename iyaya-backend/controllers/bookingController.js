const Booking = require('../models/Booking');
const User = require('../models/User');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
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
      status,
    } = req.body;

    // basic validation
    if (!caregiverId || !date || !startTime || !endTime || !children || !address || !contact) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // verify caregiver exists and is provider
    const caregiver = await User.findById(caregiverId);
    if (!caregiver || caregiver.userType !== 'provider') {
      return res.status(404).json({ success: false, error: 'Caregiver not found' });
    }

    const booking = await Booking.create({
      parentId: req.user.id,
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
      status: status || 'pending_payment',
    });

    const populated = await booking.populate([
      { path: 'parentId', select: 'name email' },
      { path: 'caregiverId', select: 'name email' },
    ]);

    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ success: false, error: 'Server error', details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
};

// Get current user's bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ parentId: req.user.id })
      .sort({ createdAt: -1 })
      .populate({ path: 'caregiverId', select: 'name profileImage' });

    res.json({ success: true, bookings });
  } catch (err) {
    console.error('Get my bookings error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
