const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  text: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  attachments: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    default: null
  },
  clientMessageId: {
    type: String,
    default: null
  },
  delivered: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ fromUserId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, read: 1 });
messageSchema.index({ conversationId: 1, deleted: 1 });

// Virtual for checking if message has content
messageSchema.virtual('hasContent').get(function() {
  return !!(this.text || (this.attachments && this.attachments.length > 0));
});

// Pre-save validation
messageSchema.pre('save', function(next) {
  if (!this.text && (!this.attachments || this.attachments.length === 0)) {
    return next(new Error('Message must have either text or attachments'));
  }
  next();
});

// Don't return deleted messages in normal queries
messageSchema.pre(/^find/, function() {
  this.where({ deleted: { $ne: true } });
});

module.exports = mongoose.model('Message', messageSchema);
