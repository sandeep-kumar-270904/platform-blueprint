const mongoose = require('mongoose');

const hostelReviewReportSchema = new mongoose.Schema({
  reviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HostelReview',
    required: true
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'resolved', 'dismissed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only report a review once
hostelReviewReportSchema.index({ reviewId: 1, reporterId: 1 }, { unique: true });

module.exports = mongoose.model('HostelReviewReport', hostelReviewReportSchema);
