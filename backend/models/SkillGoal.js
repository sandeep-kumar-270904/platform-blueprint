const mongoose = require('mongoose');

const skillGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalType: {
    type: String,
    enum: ['sessions-per-month', 'skills-to-learn', 'skills-to-teach'],
    required: true
  },
  target: {
    type: Number,
    required: true,
    min: 1
  },
  period: {
    type: String,
    enum: ['month', 'year'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SkillGoal', skillGoalSchema);
