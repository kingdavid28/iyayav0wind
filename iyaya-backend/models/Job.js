const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    workingHours: { type: String },
    requirements: [{ type: String }],
    children: [{ type: String }],
    status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled', 'filled', 'pending'], default: 'open' },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
    assignedCaregiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);
