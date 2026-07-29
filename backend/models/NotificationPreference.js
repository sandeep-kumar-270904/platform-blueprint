const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  toggles: {
    community_like: { type: Boolean, default: true },
    community_comment: { type: Boolean, default: true },
    community_mention: { type: Boolean, default: true },
    community_follow: { type: Boolean, default: true },
    community_post: { type: Boolean, default: true },
    weekly_digest: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    quiz_updates: { type: Boolean, default: true },
    gamification: { type: Boolean, default: true },
    placement: {
      mock_reminders: { type: Boolean, default: true },
      streak_alerts: { type: Boolean, default: true },
      new_content: { type: Boolean, default: true },
      booking_status: { type: Boolean, default: true },
      feedback_prompts: { type: Boolean, default: true },
      milestones: { type: Boolean, default: true }
    }
  },
  
  // Phase 12: Calendar & Reminder Sync
  daily_digest: {
    enabled: { type: Boolean, default: true },
    delivery_time: { type: String, default: '08:00' }
  },
  eventReminders: [{
    eventType: { type: String, enum: ['mock_interview', 'oa_simulation', 'gd_session', 'weekly_challenge', 'prep_milestone', 'referral_followup'] },
    leadTimeMinutes: { type: Number, default: 1440 }, // Default 24 hours
    enabled: { type: Boolean, default: true }
  }],

  quiet_hours: {
    enabled: { type: Boolean, default: false },
    start_time: { type: String, default: '22:00' }, // HH:mm format
    end_time: { type: String, default: '08:00' }, // HH:mm format
    timezone: { type: String, default: 'UTC' }
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
