const VirtualClassroom = require('../models/VirtualClassroom');
const ClassroomParticipant = require('../models/ClassroomParticipant');
const Notification = require('../models/Notification');

// Mock cron that runs every 60 seconds
const startCron = () => {
  console.log('Classroom reminder cron started.');
  setInterval(async () => {
    try {
      const now = new Date();
      // Look for classes starting between 14 and 16 minutes from now
      const in14Mins = new Date(now.getTime() + 14 * 60000);
      const in16Mins = new Date(now.getTime() + 16 * 60000);

      const upcomingClasses = await VirtualClassroom.find({
        scheduled_at: { $gte: in14Mins, $lte: in16Mins },
        status: { $ne: 'cancelled' }
      });

      for (const classroom of upcomingClasses) {
        // Find participants who opted in for reminders
        const participants = await ClassroomParticipant.find({
          classroom_id: classroom._id,
          reminders_opt_in: true,
          status: { $in: ['registered', 'waitlisted'] }
        });

        if (participants.length > 0) {
          const notifications = participants.map(p => ({
            userId: p.user_id,
            type: 'event_reminder',
            message: `Reminder: The class "${classroom.title}" starts in 15 minutes!`,
            relatedLiveSession: classroom._id
          }));
          
          await Notification.insertMany(notifications);
          console.log(`[Cron] Sent ${notifications.length} reminders for class ${classroom._id}`);
          
          // Disable opt-in so we don't send multiple times if the interval runs twice in the minute window
          await ClassroomParticipant.updateMany(
            { classroom_id: classroom._id, reminders_opt_in: true },
            { $set: { reminders_opt_in: false } }
          );
        }
      }
    } catch (err) {
      console.error('[Cron] Error in classroom reminder job', err);
    }
  }, 60000); // Check every minute
};

module.exports = { startCron };
