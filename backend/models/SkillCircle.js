const mongoose = require('mongoose');

const skillCircleSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skillName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  maxMembers: {
    type: Number,
    default: 8,
    min: 2
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  recurrence: {
    type: String,
    enum: ['one-time', 'weekly', 'biweekly'],
    required: true
  },
  scheduleInfo: {
    dayOfWeek: { type: String }, // e.g., 'Monday'
    time: { type: String },      // e.g., '18:00'
    date: { type: Date }         // Required for one-time
  },
  status: {
    type: String,
    enum: ['open', 'full', 'completed', 'cancelled'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Indexes for fast browsing
skillCircleSchema.index({ category: 1, status: 1 });
skillCircleSchema.index({ 'members': 1 });

module.exports = mongoose.model('SkillCircle', skillCircleSchema);
