const QuoteRequest = require('../models/QuoteRequest');
const QuoteResponse = require('../models/QuoteResponse');
const notificationService = require('../services/notificationService');

// Run every 5 minutes
const EXPIRATION_INTERVAL_MS = 5 * 60 * 1000;
// 24 hours expiration window
const EXPIRATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const startQuoteExpirationWorker = () => {
  console.log('Starting Quote Expiration Worker...');

  setInterval(async () => {
    try {
      const expirationThreshold = new Date(Date.now() - EXPIRATION_WINDOW_MS);

      // Find Open quote requests older than the threshold
      const expiredRequests = await QuoteRequest.find({
        status: { $in: ['Open', 'Closed-Awaiting-Decision'] },
        createdAt: { $lt: expirationThreshold }
      });

      if (expiredRequests.length === 0) return;

      console.log(`[Quote Expiration Worker] Found ${expiredRequests.length} expired quote requests.`);

      for (const quoteRequest of expiredRequests) {
        quoteRequest.status = 'Expired';
        await quoteRequest.save();

        // Expire all pending responses
        const pendingResponses = await QuoteResponse.find({
          quoteRequestId: quoteRequest._id,
          status: 'Pending'
        }).populate('providerId');

        for (const response of pendingResponses) {
          response.status = 'Expired';
          await response.save();

          // Notify provider that their pending quote expired
          if (response.providerId.userId) {
            await notificationService.notifyUser(response.providerId.userId, {
              title: 'Quote Request Expired',
              message: `The user did not make a decision in time for the ${quoteRequest.category} request. Your quote has expired.`,
              type: 'repair_update'
            });
          }
        }

        // Optional: Notify user that their request expired
        await notificationService.notifyUser(quoteRequest.userId, {
          title: 'Quote Request Expired',
          message: `Your quote request for ${quoteRequest.category} has expired. You can submit a new one if you still need help.`,
          type: 'repair_update'
        });
      }
    } catch (error) {
      console.error('[Quote Expiration Worker] Error processing expirations:', error);
    }
  }, EXPIRATION_INTERVAL_MS);
};

module.exports = { startQuoteExpirationWorker };
