const mongoose = require('mongoose');

const TeamReviewSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
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
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a reviewer can only review a specific reviewee once per team
TeamReviewSchema.index({ team: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('TeamReview', TeamReviewSchema);
