const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action_type: {
    type: String,
    enum: ['dsa_solve', 'interview_prep_review', 'mock_interview_book', 'mock_interview_complete'],
    required: true
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Index for efficiently fetching a user's timeline
userActivitySchema.index({ user_id: 1, date: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
