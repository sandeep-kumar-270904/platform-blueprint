const cron = require('node-cron');
const LearningResource = require('../models/LearningResource');
const youtubeService = require('../services/youtubeService');

/**
 * Scheduled job to sync YouTube metadata
 * Runs daily at 2:00 AM
 */
const startLearningResourceCron = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('[Cron] Starting YouTube Learning Resources sync...');
    try {
      if (!process.env.YOUTUBE_API_KEY) {
        console.warn('[Cron] YOUTUBE_API_KEY is not set. Skipping sync.');
        return;
      }

      // Fetch all ACTIVE resources that are videos
      // (Batched processing can be implemented for scale; for now we iterate safely)
      const resources = await LearningResource.find({ status: 'ACTIVE' });
      
      let updatedCount = 0;
      let unavailableCount = 0;

      // In a massive production system, we'd batch up to 50 video IDs per API call.
      // For this implementation, we process sequentially with error catching.
      for (const resource of resources) {
        try {
          // fetchMetadata uses the youtubeService logic
          const updatedData = await youtubeService.fetchMetadata({
            type: resource.type,
            id: resource.youtubeId
          });

          // Update stats
          resource.views = updatedData.views;
          resource.likes = updatedData.likes;
          resource.title = updatedData.title; // In case they changed the title
          resource.thumbnailUrl = updatedData.thumbnailUrl;
          resource.lastSyncedAt = Date.now();
          
          await resource.save();
          updatedCount++;
        } catch (err) {
          // If video is deleted/private, mark as UNAVAILABLE
          if (err.message.includes('not found') || err.message.includes('private')) {
            resource.status = 'UNAVAILABLE';
            resource.lastSyncedAt = Date.now();
            await resource.save();
            unavailableCount++;
            console.log(`[Cron] Marked resource ${resource.youtubeId} as UNAVAILABLE.`);
          } else {
            console.error(`[Cron] Error syncing resource ${resource.youtubeId}:`, err.message);
          }
        }
      }

      console.log(`[Cron] Sync complete. Updated: ${updatedCount}, Unavailable: ${unavailableCount}`);
    } catch (error) {
      console.error('[Cron] Fatal error during Learning Resources sync:', error);
    }
  });
};

module.exports = { startLearningResourceCron };
