const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  provider: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  amount: {
    min: { type: Number },
    max: { type: Number },
  },
  amountType: {
    type: String,
    enum: ['fixed', 'range', 'full_tuition', 'varies'],
    required: true,
  },
  eligibility: {
    minGPA: { type: Number, min: 0, max: 4.0 },
    majors: [{ type: String }],
    academicLevel: [{ type: String, enum: ['undergraduate', 'graduate', 'phd', 'any'] }],
    citizenship: [{ type: String }],
    location: [{ type: String }],
    financialNeedRequired: { type: Boolean, default: false },
    otherCriteria: [{ type: String }] // free-text list
  },
  applicationDeadline: {
    type: Date,
    required: true,
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  applicationMode: {
    type: String,
    enum: ['in_app', 'external_link'],
    required: true,
  },
  externalUrl: {
    type: String,
    required: function() {
      return this.applicationMode === 'external_link';
    }
  },
  inAppRequirements: [{
    type: mongoose.Schema.Types.Mixed // Structure e.g. { fieldKey, type, required, prompt }
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  source: {
    type: String,
    enum: ['admin', 'submission'],
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.source === 'submission';
    }
  },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'rejected', 'expired', 'archived'],
    default: 'draft',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewNotes: {
    type: String,
  },
  reviewedAt: {
    type: Date,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  saveCount: {
    type: Number,
    default: 0,
  },
  applicationCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Indexes for searching
scholarshipSchema.index({ title: 'text', provider: 'text', description: 'text', tags: 'text' });
scholarshipSchema.index({ status: 1 });
scholarshipSchema.index({ applicationDeadline: 1 });

module.exports = mongoose.model('Scholarship', scholarshipSchema);
