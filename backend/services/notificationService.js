const Notification = require('../models/Notification');
const UserReminderPreference = require('../models/UserReminderPreference');

exports.sendNotification = async (data) => {
  try {
    const { userId, type } = data;
    
    // Fetch preferences
    const pref = await UserReminderPreference.findOne({ userId });
    
    if (pref) {
      // Map notification types to the preference boolean fields from Phase 8
      const typeMap = {
        'application_submitted': 'applicationUpdates',
        'application_status_update': 'applicationUpdates',
        'deadline_reminder': 'deadlineReminders',
        'recommendation_request': 'recommendationLetters',
        'recommendation_update': 'recommendationLetters',
        'review_outcome': 'reviewOutcomes',
        'admin_decision': 'adminDecisions',
        'circle_invite': 'circleActivity',
        'buddy_update': 'circleActivity',
        'story_decision': 'storyDecisions',
        'scholarship_awarded': 'institutionalAwards',
        'scholarship_pool_exhausted': 'institutionalAwards', // Admin pref maybe, but we map it here
        'compliance_verified': 'complianceReminders',
        'compliance_at_risk': 'complianceReminders',
        'compliance_reminder': 'complianceReminders',
        'scholarship_needs_renewal': 'archivedCycles',
        'scholarship_auto_renewed': 'archivedCycles',
        'weekly_digest': 'weeklyDigestEnabled'
      };

      const mappedField = typeMap[type];
      if (mappedField && pref[mappedField] === false) {
        // Preference is explicitly disabled
        return null; 
      }
    }

    // Proceed to create
    return await Notification.create(data);
  } catch (err) {
    console.error('Notification creation failed:', err);
    // Fail silently so as not to break core business flows like submitting an application
    return null;
  }
};
