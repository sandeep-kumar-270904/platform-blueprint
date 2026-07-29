const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  targetDate: {
    type: Date,
    default: null
  },
  linkedInstitutionName: {
    type: String,
    default: null
  },
  lastMilestoneNotified: {
    type: Number,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
