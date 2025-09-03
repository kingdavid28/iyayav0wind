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
    date: { type: Date, required: true },
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
      enum: ['pending_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending_confirmation',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'pending_verification', 'verified', 'rejected'],
      default: 'pending',
    },
    paymentMethod: { type: String, enum: ['cash', 'bank_transfer', 'gcash', 'paymaya'], default: 'cash' },
    paymentScreenshotBase64: { type: String, required: false },
    paymentMimeType: { type: String, required: false },
    paymentDate: { type: Date, required: false },
    feedback: { type: String },
    completedAt: { type: Date },
    cancellationReason: { type: String },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
