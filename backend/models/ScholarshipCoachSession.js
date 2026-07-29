const mongoose = require('mongoose');

const scholarshipCoachSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  conversationHistory: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  lastInteractionAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ScholarshipCoachSession', scholarshipCoachSessionSchema);
