const mongoose = require('mongoose');

const placementProfileSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Total XP
  xp: { type: Number, default: 0 },
  lastXpUpdate: { type: Date, default: Date.now },
  
  // Calculated level title
  levelTitle: { type: String, default: 'Rookie' },
  
  // Badges Earned
  earnedBadges: [{
    badgeId: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now }
  }],
  
  // Weekly Challenge Progress tracking
  challengeProgress: [{
    challengeId: { type: String, required: true },
    currentProgress: { type: Number, default: 0 },
    claimed: { type: Boolean, default: false },
    weekOf: { type: String } // e.g. "2026-W30"
  }],
  
  // XP history / ledger for time-based leaderboards (Month/Week)
  xpHistory: [{
    amount: { type: Number, required: true },
    source: { type: String, required: true }, // e.g. "DSA_MEDIUM", "HR_TIP", "MOCK_INTERVIEW"
    createdAt: { type: Date, default: Date.now }
  }],

  // Cached rank dimensions (can be updated via cron or read-time calculation)
  lastGlobalRank: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for Leaderboard sorting
placementProfileSchema.index({ xp: -1, lastXpUpdate: 1 });

module.exports = mongoose.model('PlacementProfile', placementProfileSchema);
