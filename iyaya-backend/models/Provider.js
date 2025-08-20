const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  skills: [{ 
    type: String,
    trim: true
  }], // ["Childcare", "Cleaning", "Cooking"]
  experience: { 
    type: String,
    trim: true
  },
  hourlyRate: { 
    type: Number,
    min: 0
  },
  availability: {
    days: [{ 
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      trim: true
    }], // ["Monday", "Wednesday"]
    hours: {
      start: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
      },
      end: {
        type: String,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
      }
    }
  },
  rating: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 1 
  },
  reviews: [{ 
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5,
      required: true
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  backgroundCheck: {
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }
  },
  documents: [{
    name: {
      type: String,
      trim: true,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      trim: true
    },
    size: {
      type: Number,
      min: 0
    },
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ProviderSchema.index({ userId: 1 }, { unique: true });
ProviderSchema.index({ 'backgroundCheck.status': 1 });
ProviderSchema.index({ skills: 1 });
ProviderSchema.index({ rating: -1 });

module.exports = mongoose.model('Provider', ProviderSchema);