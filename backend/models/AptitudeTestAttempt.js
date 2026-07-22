const mongoose = require('mongoose');

const testResponseSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeQuestion', required: true },
  selectedAnswer: { type: Number, default: null }, // Null if skipped/unanswered
  isCorrect: { type: Boolean, default: false },
  snapshotCorrectAnswer: { type: Number } // Store what the correct answer was AT THE TIME of attempt
});

const aptitudeTestAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  testDefinition: { type: mongoose.Schema.Types.ObjectId, ref: 'AptitudeTestDefinition', required: true, index: true },
  
  startTime: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  endTime: { type: Date }, // When they actually submitted
  
  status: { type: String, enum: ['In Progress', 'Completed', 'Abandoned'], default: 'In Progress' },
  
  // The pre-generated sequence of questions for this attempt
  responses: [testResponseSchema],
  
  // Scoring
  overallScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  
  sectionScores: {
    quantitative: { score: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    logical: { score: { type: Number, default: 0 }, max: { type: Number, default: 0 } },
    verbal: { score: { type: Number, default: 0 }, max: { type: Number, default: 0 } }
  },
  
  percentile: { type: Number } // Calculated after completion
}, { timestamps: true });

module.exports = mongoose.model('AptitudeTestAttempt', aptitudeTestAttemptSchema);
