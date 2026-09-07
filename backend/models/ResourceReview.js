const mongoose = require('mongoose');

const resourceReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningResource',
    required: true
  },
  overall: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  explanation: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  usefulness: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  practicalValue: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  difficulty: {
    type: String,
    enum: ['Too Easy', 'Just Right', 'Too Hard'],
    required: true
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  textReview: {
    type: String
  },
  tags: [{
    type: String
  }]
}, { timestamps: true });

// Ensure a user can only review a specific resource once
resourceReviewSchema.index({ user: 1, resource: 1 }, { unique: true });

module.exports = mongoose.model('ResourceReview', resourceReviewSchema);
