const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  sourceLiveSession: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoster' },
  isLate: { type: Boolean, default: false },
  answers: [{
    questionIndex: { type: Number, required: true },
    questionSnapshot: {
      text: String,
      options: [String],
      correctIndex: Number,
      explanation: String,
      authorDifficulty: String,
      calibratedDifficulty: String,
      bankQuestionId: mongoose.Schema.Types.ObjectId
    },
    selectedOptionIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    timeTakenSeconds: { type: Number }
  }],
  score: { type: Number, required: true },
  totalPossibleScore: { type: Number, required: true },
  percentageScore: { type: Number, required: true },
  sectionScores: [{
    sectionIndex: Number,
    score: Number,
    maxScore: Number
  }],
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  mode: { type: String, enum: ['standard', 'adaptive_practice'], default: 'standard' },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' }
}, { timestamps: true });

// Compound index for fast lookup of a user's attempts on a quiz
quizAttemptSchema.index({ quiz: 1, user: 1, status: 1 });
// Index for leaderboard sorting optimization
quizAttemptSchema.index({ quiz: 1, status: 1, percentageScore: -1, completedAt: 1 });
quizAttemptSchema.index({ classId: 1 });
quizAttemptSchema.index({ teamId: 1 });
quizAttemptSchema.index({ sourceLiveSession: 1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
