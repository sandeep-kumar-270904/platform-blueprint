const mongoose = require('mongoose');

const hostelReviewSchema = new mongoose.Schema({
  hostelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  userId: {
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
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only leave one review per hostel
hostelReviewSchema.index({ hostelId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('HostelReview', hostelReviewSchema);
