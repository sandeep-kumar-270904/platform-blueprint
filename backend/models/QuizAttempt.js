const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  sourceLiveSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    questionIndex: { type: Number, required: true },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTakenSeconds: { type: Number }
  }],
  score: { type: Number, required: true },
  totalPossibleScore: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' }
}, { timestamps: true });

// Compound index for fast lookup of a user's attempts on a quiz
quizAttemptSchema.index({ quiz: 1, user: 1, status: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
