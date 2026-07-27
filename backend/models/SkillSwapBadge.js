const mongoose = require('mongoose');

const skillSwapBadgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeType: {
    type: String,
    enum: [
      'first-swap',
      'five-swaps',
      'top-rated',
      'reliable-teacher',
      'circle-starter',
      'circle-regular'
    ],
    required: true
  },
  earnedAt: { type: Date, default: Date.now }
});

// Ensure a user can only earn a specific badge once
skillSwapBadgeSchema.index({ user: 1, badgeType: 1 }, { unique: true });

module.exports = mongoose.model('SkillSwapBadge', skillSwapBadgeSchema);
