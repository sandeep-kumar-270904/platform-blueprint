const mongoose = require('mongoose');

const skillSessionSchema = new mongoose.Schema({
  request: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillExchangeRequest',
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 60
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SkillSession', skillSessionSchema);
