const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group', 'job_related'],
    default: 'direct'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    archivedAt: {
      type: Date,
      default: Date.now
    }
  }],
  muted: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, updatedAt: -1 });
conversationSchema.index({ jobId: 1 });
conversationSchema.index({ type: 1 });

// Virtual for getting other participant (in direct conversations)
conversationSchema.virtual('otherParticipant').get(function() {
  if (this.type === 'direct' && this.participants.length === 2) {
    // This would need the current user context to determine the "other" participant
    return null; // Will be handled in the controller
  }
  return null;
});

// Method to check if user is participant
conversationSchema.methods.hasParticipant = function(userId) {
  return this.participants.some(participant => 
    participant.toString() === userId.toString()
  );
};

// Method to check if conversation is archived by user
conversationSchema.methods.isArchivedBy = function(userId) {
  return this.archivedBy.some(archive => 
    archive.userId.toString() === userId.toString()
  );
};

// Method to check if conversation is muted by user
conversationSchema.methods.isMutedBy = function(userId) {
  return this.muted.some(mute => 
    mute.userId.toString() === userId.toString()
  );
};

// Pre-save validation
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    return next(new Error('Conversation must have at least 2 participants'));
  }
  
  if (this.type === 'direct' && this.participants.length > 2) {
    return next(new Error('Direct conversation can only have 2 participants'));
  }
  
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
