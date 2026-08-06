const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action_type: {
    type: String,
    enum: [
      'dsa_solve', 'interview_prep_review', 'mock_interview_book', 'mock_interview_complete',
      'login', 'note_upload', 'idea_post', 'quiz_complete', 'team_join', 'event_rsvp', 'general_activity'
    ],
    required: true
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  date: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Index for efficiently fetching a user's timeline
userActivitySchema.index({ user_id: 1, date: -1 });

userActivitySchema.post('save', async function(doc) {
  try {
    const NotificationPreference = require('./NotificationPreference');
    const notificationService = require('../services/notificationService');
    const UserActivity = doc.constructor;
    
    // Fetch user's timezone
    const pref = await NotificationPreference.findOne({ user_id: doc.user_id });
    const tz = pref?.quiet_hours?.timezone || 'UTC';
    
    // Get all activities to calculate current streak
    const activities = await UserActivity.find({ user_id: doc.user_id }).sort({ date: 1 }).lean();
    
    const localDays = activities.map(a => {
      const d = new Date(a.date);
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d);
    });
    
    const uniqueDays = Array.from(new Set(localDays)).sort();
    let currentStreak = 0;
    
    if (uniqueDays.length > 0) {
      let tempStreak = 1;
      for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) tempStreak++;
        else tempStreak = 1;
      }
      
      const lastDay = new Date(uniqueDays[uniqueDays.length - 1]);
      const today = new Date();
      const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(today);
      const todayDate = new Date(todayStr);
      
      const diffToday = Math.round((todayDate.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffToday <= 1) currentStreak = tempStreak;
    }

    const milestoneDays = [3, 7, 14, 30, 50, 100];
    if (milestoneDays.includes(currentStreak)) {
      // Check if we already sent this milestone to avoid duplicates on multiple activities the same day
      const Notification = require('./Notification');
      const existing = await Notification.findOne({
        userId: doc.user_id,
        type: 'placement_milestone',
        message: { $regex: `${currentStreak}-day streak` }
      });

      if (!existing) {
        await notificationService.createNotification({
          userId: doc.user_id,
          type: 'placement_milestone',
          message: `Incredible! You hit a ${currentStreak}-day streak!`
        });
      }
    }
  } catch (err) {
    console.error('Error in UserActivity post-save hook:', err);
  }
});

module.exports = mongoose.model('UserActivity', userActivitySchema);
