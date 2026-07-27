const mongoose = require('mongoose');

const skillCircleSessionSchema = new mongoose.Schema({
  circle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCircle',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

skillCircleSessionSchema.index({ circle: 1, scheduledAt: 1 });

module.exports = mongoose.model('SkillCircleSession', skillCircleSessionSchema);
