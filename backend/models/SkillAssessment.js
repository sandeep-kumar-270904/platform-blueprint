const mongoose = require('mongoose');

const skillAssessmentSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  passingScorePercent: { type: Number, default: 70 },
  durationMinutes: { type: Number, default: 15 },
  active: { type: Boolean, default: true },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }
  }]
}, { timestamps: true });

module.exports = mongoose.model('SkillAssessment', skillAssessmentSchema);
