const mongoose = require('mongoose');

const SecondChanceLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  suggestedTeams: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    matchScore: {
      type: Number,
      required: true
    }
  }],
  triggeredBy: {
    type: String,
    enum: ['application_rejected', 'on_demand_view'],
    default: 'application_rejected'
  }
}, { timestamps: true });

// Deduplication index: prevent recomputing/resending same suggestion for the same user and original team
SecondChanceLogSchema.index({ user: 1, originalTeam: 1, createdAt: -1 });

module.exports = mongoose.model('SecondChanceLog', SecondChanceLogSchema);
