const mongoose = require('mongoose');

const skillReviewSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillSession',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Ensure a user can only review a session once
skillReviewSchema.index({ session: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('SkillReview', skillReviewSchema);
