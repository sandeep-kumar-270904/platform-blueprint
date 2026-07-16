const mongoose = require('mongoose');

const assessmentAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'SkillAssessment', required: true },
  answers: [{ type: Number }], // Index of selected options
  score: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

assessmentAttemptSchema.index({ user: 1, assessment: 1 });

module.exports = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
