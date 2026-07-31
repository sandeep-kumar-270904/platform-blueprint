const RepairSlotHold = require('../models/RepairSlotHold');
const RepairRequest = require('../models/RepairRequest');
const notificationService = require('../services/notificationService');

const runSlotExpirationCheck = async () => {
  try {
    const now = new Date();
    // Find expired holds that are still 'held'
    const expiredHolds = await RepairSlotHold.find({
      status: 'held',
      expiresAt: { $lt: now }
    });

    if (expiredHolds.length === 0) return;

    for (const hold of expiredHolds) {
      // Release the hold
      hold.status = 'released';
      await hold.save();

      // Update the request to remove slot guarantee
      if (hold.requestId) {
        const req = await RepairRequest.findById(hold.requestId);
        if (req && req.status === 'pending') {
          // Keep it pending, but clear the slot details
          // req.preferredDate and req.preferredTime can be kept as preferences, 
          // but we can add a flag or note that the slot expired.
          // For now, we just notify the user.
          await notificationService.createNotification({
            userId: req.userId,
            message: `Your held slot for request on ${hold.date} has expired. Your request is still pending but the slot is no longer guaranteed.`,
            type: 'repair_slot_expired',
            relatedContentId: req._id,
            actionUrl: `/repair-and-maintenance` // or specific request page
          });
        }
      }
    }
    
    console.log(`[Slot Worker] Expired ${expiredHolds.length} slot holds.`);
  } catch (err) {
    console.error('[Slot Worker] Error running slot expiration check:', err);
  }
};

const startSlotExpirationWorker = () => {
  // Run every 1 minute
  setInterval(runSlotExpirationCheck, 60 * 1000);
  console.log('[Slot Worker] Started slot expiration background worker.');
};

module.exports = { startSlotExpirationWorker };
