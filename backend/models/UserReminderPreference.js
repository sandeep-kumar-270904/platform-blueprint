const mongoose = require('mongoose');

const userReminderPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  scholarshipReminderIntervals: {
    type: [Number],
    default: [7, 1],
    validate: [
      v => Array.isArray(v) && v.every(num => Number.isInteger(num) && num > 0 && num <= 90),
      'Intervals must be positive integers between 1 and 90'
    ]
  },
  weeklyDigestEnabled: { type: Boolean, default: true },
  
  // Phase 8: Comprehensive toggles
  applicationUpdates: { type: Boolean, default: true },
  deadlineReminders: { type: Boolean, default: true },
  recommendationLetters: { type: Boolean, default: true },
  reviewOutcomes: { type: Boolean, default: true },
  adminDecisions: { type: Boolean, default: true },
  circleActivity: { type: Boolean, default: true },
  storyDecisions: { type: Boolean, default: true },
  institutionalAwards: { type: Boolean, default: true },
  complianceReminders: { type: Boolean, default: true },
  archivedCycles: { type: Boolean, default: true },
  newMatches: { type: Boolean, default: true },
  essayFeedback: { type: Boolean, default: true },
  fundingStackingAlerts: { type: Boolean, default: true },
  portfolioOptimization: { type: Boolean, default: true },
  employerFastTrack: { type: Boolean, default: true },
  apiSyncAlerts: { type: Boolean, default: true },
  
  // Placement Schedule & Reminders
  placementDailyDigest: { type: Boolean, default: true },
  mockInterviewReminderHours: { type: Number, default: 24 },
  oaSimulationReminderHours: { type: Number, default: 24 },
  gdSessionReminderHours: { type: Number, default: 2 },
  weeklyChallengeReminderDays: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('UserReminderPreference', userReminderPreferenceSchema);

