const mongoose = require('mongoose');

const userQuestionAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion', required: true, index: true },
  selectedAnswer: { type: Number, required: true },
  isCorrect: { type: Boolean, required: true },
  // Optional reference to a test attempt if this was part of a mock test
  testAttempt: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTestAttempt' }
}, { timestamps: true });

// Index for topic/category aggregations
userQuestionAttemptSchema.index({ user: 1, isCorrect: 1 });

module.exports = mongoose.model('UserQuestionAttempt', userQuestionAttemptSchema);
