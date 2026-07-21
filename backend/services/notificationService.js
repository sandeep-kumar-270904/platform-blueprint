const Notification = require('../models/Notification');
const UserReminderPreference = require('../models/UserReminderPreference');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');

let _io = null;

const init = (io) => {
  _io = io;
};

const sendNotification = async (data) => {
  try {
    const { userId, type, relatedContentId } = data;
    
    let isQuietHours = false;
    
    // Check muted posts
    const user = await User.findById(userId);
    if (user && user.muted_posts && relatedContentId && user.muted_posts.includes(relatedContentId)) {
      return null;
    }
    
    // Fetch preferences
    const pref = await NotificationPreference.findOne({ user_id: userId });
    
    if (pref) {
      // Map notification types to the preference boolean fields from NotificationPreference
      const typeMap = {
        'community_post_liked': 'community_like',
        'community_post_commented': 'community_comment',
        'community_mention': 'community_mention',
        'community_follow': 'community_follow',
        'community_post': 'community_post',
        'weekly_digest': 'weekly_digest'
      };

      const mappedField = typeMap[type];
      if (mappedField && pref.toggles && pref.toggles[mappedField] === false) {
        // Preference is explicitly disabled
        return { notification: null, isQuietHours: false }; 
      }
      
      if (pref.quiet_hours && pref.quiet_hours.enabled) {
         const now = new Date();
         const hh = now.getUTCHours();
         const mm = now.getUTCMinutes();
         const startParts = pref.quiet_hours.start_time.split(':');
         const endParts = pref.quiet_hours.end_time.split(':');
         const startMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
         const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
         const currentMins = hh * 60 + mm;
         
         if (startMins < endMins) {
           if (currentMins >= startMins && currentMins <= endMins) isQuietHours = true;
         } else {
           if (currentMins >= startMins || currentMins <= endMins) isQuietHours = true;
         }
      }
    }

    // Grouping logic for community likes and comments
    if (relatedContentId && (type === 'community_post_liked' || type === 'community_post_commented')) {
      const existing = await Notification.findOne({
        userId,
        type,
        relatedContentId,
        isRead: false
      });
      
      if (existing) {
        // Update the existing notification instead of creating a new one
        existing.message = type === 'community_post_liked' ? 'Multiple people reacted to your community post.' : 'Multiple people commented on your community post.';
        existing.updatedAt = new Date();
        await existing.save();
        
        if (!isQuietHours && _io) {
          _io.to(`user:${userId}`).emit('notification:new', existing);
        }
        return existing;
      }
    }

    // Proceed to create
    const created = await Notification.create(data);
    
    if (!isQuietHours && _io) {
      _io.to(`user:${userId}`).emit('notification:new', created);
    }
    
    return created;
  } catch (err) {
    console.error('Notification creation failed:', err);
    // Fail silently so as not to break core business flows like submitting an application
    return null;
  }
};

exports.init = init;
exports.sendNotification = sendNotification;
exports.createNotification = sendNotification;
