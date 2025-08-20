const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
  },
  { _id: false }
);

const EmergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    relation: String,
  },
  { _id: false }
);

const BookingSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caregiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },   // HH:mm
    children: [{ type: String, required: true }], // child IDs from client app
    address: { type: String, required: true },
    contact: { type: ContactSchema, required: true },
    emergencyContact: { type: EmergencyContactSchema },
    specialInstructions: { type: String, default: '' },
    hourlyRate: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'completed'],
      default: 'pending_payment',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
