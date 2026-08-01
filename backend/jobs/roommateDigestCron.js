const cron = require('node-cron');
const Notification = require('../models/Notification');

// Schedule a job to run every day at 8:00 AM
const startRoommateDigestCron = (io) => {
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('[CRON] Running daily Roommate Activity Digest delivery...');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find all roommate digest notifications updated in the last 24 hours that are unread
      const pendingDigests = await Notification.find({
        type: 'roommate_digest',
        isRead: false,
        updatedAt: { $gte: today }
      });

      if (pendingDigests.length === 0) {
        console.log('[CRON] No pending roommate digests to deliver today.');
        return;
      }

      console.log(`[CRON] Delivering ${pendingDigests.length} roommate digest notifications...`);

      // Deliver via socket to active users
      pendingDigests.forEach((digest) => {
        if (io) {
          io.to(`user:${digest.userId}`).emit('notification:new', digest);
        }
      });

      console.log('[CRON] Roommate Activity Digest delivery complete.');
    } catch (error) {
      console.error('[CRON] Error running roommate digest delivery:', error);
    }
  });
};

module.exports = { startRoommateDigestCron };
