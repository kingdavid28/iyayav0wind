const mongoose = require('mongoose');

const ParentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    contact: {
      primaryPhone: {
        type: String,
        trim: true,
      },
      alternatePhone: {
        type: String,
        trim: true,
      },
      emergencyContact: {
        name: { type: String, trim: true },
        relationship: { type: String, trim: true },
        phone: { type: String, trim: true },
      },
    },
    address: {
      street: { type: String, trim: true },
      barangay: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true },
      coordinates: {
        type: [Number],
        validate: {
          validator(value) {
            return !Array.isArray(value) || value.length === 0 || value.length === 2;
          },
          message: 'Coordinates must be an array [lat, lng]',
        },
      },
    },
    family: {
      householdMembers: [
        {
          name: { type: String, trim: true },
          age: { type: Number, min: 0 },
          relation: { type: String, trim: true },
          notes: { type: String, trim: true },
        },
      ],
      children: [
        {
          name: { type: String, trim: true, required: true },
          birthDate: { type: Date },
          allergies: { type: String, trim: true },
          specialInstructions: { type: String, trim: true },
        },
      ],
      preferredCaregiverNotes: { type: String, trim: true },
    },
    preferences: {
      languages: [{ type: String, trim: true }],
      services: [{ type: String, trim: true }],
      schedule: {
        days: [{ type: String, trim: true }],
        timeSlots: [
          {
            label: { type: String, trim: true },
            start: { type: String, trim: true },
            end: { type: String, trim: true },
          },
        ],
      },
      requirements: [{ type: String, trim: true }],
    },
    notes: {
      general: { type: String, trim: true },
      private: { type: String, trim: true, select: false },
    },
    metadata: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      source: { type: String, trim: true },
      lastSyncedFromFirebase: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ParentProfileSchema.index({ 'address.city': 1 });
ParentProfileSchema.index({ 'preferences.languages': 1 });

module.exports = mongoose.model('ParentProfile', ParentProfileSchema);
