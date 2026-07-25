const Notification = require('../models/Notification');
const UserReminderPreference = require('../models/UserReminderPreference');
const NotificationPreference = require('../models/NotificationPreference');
const User = require('../models/User');
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@antigravity.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

let _io = null;

const init = (io) => {
  _io = io;
};

const sendNotification = async (data) => {
  try {
    const { userId, type, relatedContentId, actorId } = data;
    
    let isQuietHours = false;
    
    // Check muted posts
    const user = await User.findById(userId);
    if (user && user.muted_posts && relatedContentId && user.muted_posts.includes(relatedContentId)) {
      return null;
    }

    let actorName = 'Someone';
    if (actorId) {
       const actor = await User.findById(actorId).lean();
       if (actor) {
         actorName = actor.full_name || actor.username || 'Someone';
       }
    }
    
    // Fetch preferences
    const pref = await NotificationPreference.findOne({ user_id: userId });
    
    if (pref) {
      const typeMap = {
        'community_post_liked': 'community_like',
        'community_post_commented': 'community_comment',
        'community_mention': 'community_mention',
        'community_follow': 'community_follow',
        'community_post': 'community_post',
        'weekly_digest': 'weekly_digest'
      };

      const placementTypeMap = {
        'placement_mock_reminder': 'mock_reminders',
        'placement_streak_alert': 'streak_alerts',
        'placement_new_content': 'new_content',
        'placement_booking_status': 'booking_status',
        'placement_feedback_prompt': 'feedback_prompts',
        'placement_milestone': 'milestones'
      };

      const mappedField = typeMap[type];
      if (mappedField && pref.toggles && pref.toggles[mappedField] === false) {
        return null; 
      }
      
      const placementMapped = placementTypeMap[type];
      if (placementMapped && pref.toggles?.placement && pref.toggles.placement[placementMapped] === false) {
        return null;
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
      
      const newActor = actorId ? { userId: actorId, name: actorName } : null;

      if (existing) {
        if (newActor && !existing.actors.some(a => a.userId && a.userId.toString() === newActor.userId.toString())) {
           existing.actors.push(newActor);
        }
        existing.engagementCount = (existing.engagementCount || 1) + 1;
        const verb = type === 'community_post_liked' ? 'reacted to' : 'commented on';
        const firstName = existing.actors[0]?.name || 'Someone';
        const othersCount = existing.engagementCount - 1;
        
        existing.message = othersCount > 0 
          ? `${firstName} and ${othersCount} others ${verb} your post.` 
          : `${firstName} ${verb} your post.`;
          
        existing.updatedAt = new Date();
        await existing.save();
        
        if (!isQuietHours && _io) {
          _io.to(`user:${userId}`).emit('notification:new', existing);
        }
        return existing;
      }
      
      if (newActor) {
        data.actors = [newActor];
        data.engagementCount = 1;
        const verb = type === 'community_post_liked' ? 'reacted to' : 'commented on';
        data.message = `${actorName} ${verb} your post.`;
      }
    }

    const created = await Notification.create(data);
    
    if (!isQuietHours && _io) {
      _io.to(`user:${userId}`).emit('notification:new', created);
    }
    
    if (!isQuietHours && user && user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
      const payload = JSON.stringify({
        title: 'Virtual Classroom',
        body: created.message,
        url: created.relatedContentId ? `/classrooms/${created.relatedContentId}` : '/'
      });
      for (const sub of user.webPushSubscriptions) {
        try {
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          console.error('Web push error:', err.statusCode);
        }
      }
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
