const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (data) => {
  try {
    const { userId, type } = data;
    const user = await User.findById(userId).select('notificationPreferences');
    
    if (user && user.notificationPreferences) {
      let shouldSend = true;
      const prefs = user.notificationPreferences;
      
      switch(type) {
        case 'question_answered':
        case 'question_upvoted':
          shouldSend = prefs.question_answered !== false;
          break;
        case 'review_upvoted':
          shouldSend = prefs.review_upvoted !== false;
          break;
        case 'answer_upvoted':
          shouldSend = prefs.answer_upvoted !== false;
          break;
        case 'event_reminder':
        case 'event_feedback_request':
          shouldSend = prefs.event_reminder !== false;
          break;
        case 'event_approved':
          shouldSend = prefs.event_approved !== false;
          break;
        case 'event_rejected':
          shouldSend = prefs.event_rejected !== false;
          break;
        case 'event_updated':
        case 'event_cancelled':
          shouldSend = prefs.event_cancelled_or_changed !== false;
          break;
        case 'waitlist_confirmed':
          shouldSend = prefs.waitlist_promoted !== false;
          break;
      }
      
      if (!shouldSend) {
        // Opted out
        return null;
      }
    }
    
    return await Notification.create(data);
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
};

module.exports = {
  createNotification
};
