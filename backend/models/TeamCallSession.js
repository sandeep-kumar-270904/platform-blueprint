const mongoose = require('mongoose');

const TeamCallSessionSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  external_video_url: {
    type: String,
    required: true,
    trim: true
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date }
  }]
});

module.exports = mongoose.model('TeamCallSession', TeamCallSessionSchema);
