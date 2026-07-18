const mongoose = require('mongoose');

const quizChallengeSchema = new mongoose.Schema({
  challengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
  challengerAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt' },
  challengedAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizAttempt' },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('QuizChallenge', quizChallengeSchema);
