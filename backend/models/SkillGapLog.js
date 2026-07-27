const mongoose = require('mongoose');

const SkillGapLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  missingSkills: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  triggeredBy: {
    type: String,
    enum: ['low_match_view', 'application_rejected'],
    required: true
  }
}, { timestamps: true });

// Index for deduplication queries (user + team within 7 days window)
SkillGapLogSchema.index({ user: 1, team: 1, createdAt: -1 });

module.exports = mongoose.model('SkillGapLog', SkillGapLogSchema);
