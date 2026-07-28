const cron = require('node-cron');
const GroupSession = require('../models/GroupSession');
const StudyGroup = require('../models/StudyGroup');
const Notification = require('../models/Notification');

const startStudyGroupCron = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      // Target window: Sessions starting between 14 and 19 minutes from now
      // so a 5-minute cron catches everything exactly once.
      const windowStart = new Date(now.getTime() + 14 * 60000);
      const windowEnd = new Date(now.getTime() + 19 * 60000);

      const upcomingSessions = await GroupSession.find({
        status: 'active',
        scheduled_at: { $gte: windowStart, $lt: windowEnd }
      });

      for (const session of upcomingSessions) {
        const group = await StudyGroup.findById(session.group_id);
        if (!group) continue;

        const notifications = session.attendees.map(userId => ({
          userId,
          type: 'group_session_starting',
          relatedContentId: group._id,
          message: `Your session '${session.title}' in ${group.name} starts in 15 minutes!`,
          isRead: false
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    } catch (err) {
      console.error('StudyGroup Cron Error:', err);
    }
  });
};

module.exports = { startStudyGroupCron };
