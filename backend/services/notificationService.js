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

      const teamHuntTypeMap = {
        'team_application': 'team_applications',
        'team_application_accepted': 'team_applications',
        'team_application_rejected': 'team_applications',
        'team_completed': 'team_reviews',
        'team_disbanded': 'team_updates',
        'team_member_removed': 'team_updates',
        'team_invite': 'team_invites'
      };

      const mappedField = typeMap[type];
      if (mappedField && pref.toggles && pref.toggles[mappedField] === false) {
        return null; 
      }
      
      const placementMapped = placementTypeMap[type];
      if (placementMapped && pref.toggles?.placement && pref.toggles.placement[placementMapped] === false) {
        return null;
      }

      const teamHuntMapped = teamHuntTypeMap[type];
      if (teamHuntMapped && pref.toggles?.teamHunt && pref.toggles.teamHunt[teamHuntMapped] === false) {
        return null;
      }
      
      // --- Connections Hub Email Preferences & Queuing ---
      const alumniEmailTypeMap = {
        'alumni_connection_request': 'connection_requests',
        'alumni_connection_response': 'connection_responses',
        'booking_requested': 'session_reminders',
        'booking_confirmed': 'session_reminders',
        'session_reminder': 'session_reminders',
        'booking_cancelled': 'session_reminders',
        'question_answered': 'qa_responses',
        'mentor_application_status': 'mentorship_updates'
      };
      const alumniPrefKey = alumniEmailTypeMap[type];
      if (alumniPrefKey) {
         // Default to true except qa_responses which is default false
         const defaultVal = alumniPrefKey === 'qa_responses' ? false : true;
         const isEnabled = pref.toggles?.alumniConnections?.[alumniPrefKey] ?? defaultVal;
         
         if (isEnabled) {
           data.deliveryChannels = data.deliveryChannels || ['in_app'];
           if (!data.deliveryChannels.includes('email')) {
             data.deliveryChannels.push('email');
           }
           data.emailSent = false;
           data.emailStatus = 'pending';
         }
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

    // Phase 8: Roommate Connection Preferences and Digest Rollup
    if (type.startsWith('roommate_connection_')) {
      const roommateMap = {
        'roommate_connection_request': 'new_requests',
        'roommate_connection_accepted': 'accepted',
        'roommate_connection_declined': 'declined',
        'roommate_connection_disconnected': 'disconnected'
      };
      const prefKey = roommateMap[type];
      const roommatePref = user?.notificationPreferences?.roommateConnections?.[prefKey] || 'instant';

      if (roommatePref === 'off') {
        return null;
      } else if (roommatePref === 'digest') {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        let existingDigest = await Notification.findOne({
          userId,
          type: 'roommate_digest',
          isRead: false,
          createdAt: { $gte: today }
        });

        if (existingDigest) {
          const meta = existingDigest.metadata || { new_requests: 0, accepted: 0, declined: 0, disconnected: 0 };
          meta[prefKey] = (meta[prefKey] || 0) + 1;
          existingDigest.metadata = meta;
          
          let parts = [];
          if (meta.new_requests > 0) parts.push(`${meta.new_requests} new request${meta.new_requests > 1 ? 's' : ''}`);
          if (meta.accepted > 0) parts.push(`${meta.accepted} accepted connection${meta.accepted > 1 ? 's' : ''}`);
          if (meta.declined > 0) parts.push(`${meta.declined} declined connection${meta.declined > 1 ? 's' : ''}`);
          if (meta.disconnected > 0) parts.push(`${meta.disconnected} disconnected connection${meta.disconnected > 1 ? 's' : ''}`);
          
          existingDigest.message = `You have ${parts.join(', ')} today.`;
          existingDigest.updatedAt = new Date();
          await existingDigest.save();
          
          return existingDigest;
        } else {
          // Change data to be a digest notification
          data.type = 'roommate_digest';
          data.message = `You have 1 ${prefKey.replace('_', ' ')} today.`;
          data.title = 'Roommate Activity Digest';
          data.metadata = { new_requests: 0, accepted: 0, declined: 0, disconnected: 0 };
          data.metadata[prefKey] = 1;
        }
      }
    }

    data.message = data.message || data.body || 'New Notification';

    // --- Phase 7 & 5: Locale-Aware Team Hunt and Skill Swap Notification Templates ---
    if (user && user.locale && type && (type.startsWith('team_') || type.startsWith('skill_swap_'))) {
      const loc = user.locale;
      const titles = {
        'en': {
          'skill_swap_request': 'New Skill Swap Request',
          'skill_swap_accepted': 'Skill Swap Accepted',
          'skill_swap_declined': 'Skill Swap Update',
          'skill_swap_scheduled': 'Session Scheduled',
          'skill_swap_completed': 'Session Completed',
          'skill_swap_cancelled': 'Session Cancelled',
          'skill_swap_review_received': 'New Review Received',
          'skill_swap_badge': 'New Badge Earned!'
        },
        'es': {
          'team_application': 'Nueva Solicitud de Equipo',
          'team_application_accepted': '¡Solicitud Aceptada!',
          'team_application_rejected': 'Actualización de Solicitud',
          'team_completed': '¡Proyecto Completado!',
          'team_disbanded': 'Equipo Disuelto',
          'team_member_removed': 'Eliminado del Equipo',
          'skill_swap_request': 'Nueva Solicitud de Intercambio',
          'skill_swap_accepted': 'Intercambio Aceptado',
          'skill_swap_declined': 'Actualización de Intercambio',
          'skill_swap_scheduled': 'Sesión Programada',
          'skill_swap_completed': 'Sesión Completada',
          'skill_swap_cancelled': 'Sesión Cancelada',
          'skill_swap_review_received': 'Nueva Reseña Recibida',
          'skill_swap_badge': '¡Nueva Insignia Obtenida!'
        },
        'ar': {
          'team_application': 'طلب انضمام جديد للفريق',
          'team_application_accepted': 'تم قبول الطلب!',
          'team_application_rejected': 'تحديث حالة الطلب',
          'team_completed': 'اكتمل المشروع!',
          'team_disbanded': 'تم حل الفريق',
          'team_member_removed': 'تمت إزالتك من الفريق',
          'skill_swap_request': 'طلب تبادل مهارات جديد',
          'skill_swap_accepted': 'تم قبول التبادل',
          'skill_swap_declined': 'تحديث حالة التبادل',
          'skill_swap_scheduled': 'تمت جدولة الجلسة',
          'skill_swap_completed': 'اكتملت الجلسة',
          'skill_swap_cancelled': 'تم إلغاء الجلسة',
          'skill_swap_review_received': 'تلقيت تقييم جديد',
          'skill_swap_badge': 'حصلت على شارة جديدة!'
        }
      };
      if (titles[loc] && titles[loc][type]) {
        data.title = titles[loc][type];
      }
    }
    // --------------------------------------------------------------

    const created = await Notification.create(data);
    
    if (!isQuietHours && _io) {
      _io.to(`user:${userId}`).emit('notification:new', created);
    }
    
    if (!isQuietHours && user && user.webPushSubscriptions && user.webPushSubscriptions.length > 0) {
      let title = created.title || 'StudentHub Notification';
      if (type && type.startsWith('team_')) title = created.title || 'Team Hunt';
      else if (type && type.startsWith('community_')) title = created.title || 'Community Feed';
      else if (type && type.startsWith('placement_')) title = created.title || 'Placement Prep';
      else if (type && type.startsWith('skill_swap_')) title = created.title || 'Skill Swap';
      else if (type && type.startsWith('event_')) title = created.title || 'Events';
      
      let url = '/';
      const t = type || '';
      if (t.startsWith('team_')) {
        url = created.relatedContentId ? `/team-hunt/${created.relatedContentId}` : '/team-hunt/dashboard';
      } else if (t.startsWith('skill_swap_')) {
        url = '/skill-swap';
      } else if (t.startsWith('event_') || t === 'waitlist_confirmed') {
        url = created.relatedContentId ? `/events/${created.relatedContentId}` : '/events';
      } else if (t.startsWith('community_')) {
        url = '/community';
      } else if (t.startsWith('placement_') || t === 'placement_referral') {
        url = '/placement-dashboard';
      } else if (t.startsWith('roommate_')) {
        url = '/roommates';
      } else if (t.startsWith('booking_') || t.startsWith('mentor_') || t === 'session_reminder') {
        url = '/mentors';
      } else if (t.startsWith('study_group_')) {
        url = created.relatedContentId ? `/study-groups/${created.relatedContentId}` : '/study-groups';
      } else if (t.startsWith('alumni_') || t === 'connection_request') {
        url = '/alumni-connections';
      } else if (t.startsWith('college_')) {
        url = created.relatedContentId ? `/colleges/${created.relatedContentId}` : '/colleges';
      } else if (t.startsWith('room_rental') || t.startsWith('room_agreement')) {
        url = '/room-rentals';
      } else if (t === 'quiz_assigned' || t === 'quiz_completed') {
        url = '/quizzes';
      } else if (t.startsWith('classroom_') || t === 'virtual_class' || t === 'course' || t === 'course_enrolled') {
        url = created.relatedContentId ? `/classrooms/${created.relatedContentId}` : '/classrooms';
      } else if (created.relatedContentId) {
        // Fallback for any unknown features that relied on the old behavior
        url = `/classrooms/${created.relatedContentId}`;
      }

      const payload = JSON.stringify({
        title,
        body: created.message || created.body || 'New Notification',
        url
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

const getIo = () => _io;

exports.init = init;
exports.getIo = getIo;
exports.sendNotification = sendNotification;
exports.createNotification = sendNotification;
