const mongoose = require('mongoose');

const skillCircleMessageSchema = new mongoose.Schema({
  circle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillCircle',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

skillCircleMessageSchema.index({ circle: 1, createdAt: 1 });

module.exports = mongoose.model('SkillCircleMessage', skillCircleMessageSchema);
