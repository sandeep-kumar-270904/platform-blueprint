const RepairProvider = require('../models/RepairProvider');
const RepairRequest = require('../models/RepairRequest');
const VerificationAuditLog = require('../models/VerificationAuditLog');

class ProviderStatsService {
  /**
   * Recalculates response rate, average response time, and badges based on the provider's RepairRequest history and reviews.
   */
  static async recalculateStats(providerId) {
    try {
      const provider = await RepairProvider.findById(providerId);
      if (!provider) return null;

      // 1. Calculate Badges based on cached review data and age
      const now = new Date();
      const accountAgeDays = (now - provider.createdAt) / (1000 * 60 * 60 * 24);
      
      const isTopRated = provider.rating >= 4.5 && provider.reviewsCount >= 10;
      const isPopular = provider.reviewsCount >= 50; // Arbitrary threshold for "Popular"
      const isNew = accountAgeDays < 30 || provider.reviewsCount < 3; // "New" logic

      provider.badges = {
        isTopRated,
        isPopular,
        isNew
      };

      // 2. Calculate Response Rate & Time from RepairRequests
      // We process all requests together to find overall response rate/time, and urgent time separately.
      const requests = await RepairRequest.find({ providerId });
      
      let respondedCount = 0;
      let totalResponseTimeMs = 0;
      let urgentRespondedCount = 0;
      let urgentTotalResponseTimeMs = 0;

      requests.forEach(req => {
        // A request is considered "responded" if its status is no longer 'Pending'
        if (req.status !== 'Pending' && req.statusHistory && req.statusHistory.length > 0) {
          const firstResponse = req.statusHistory.find(h => h.status !== 'Pending');
          if (firstResponse) {
            respondedCount++;
            const responseTimeMs = firstResponse.changedAt - req.createdAt;
            totalResponseTimeMs += responseTimeMs;

            if (req.isUrgent) {
              urgentRespondedCount++;
              urgentTotalResponseTimeMs += responseTimeMs;
            }
          }
        }
      });

      // General Stats (min 3 requests)
      if (requests.length >= 3) {
        const responseRate = Math.round((respondedCount / requests.length) * 100);
        
        if (respondedCount > 0) {
          const avgTimeMs = totalResponseTimeMs / respondedCount;
          const responseTimeHours = Math.round((avgTimeMs / (1000 * 60 * 60)) * 10) / 10;
          provider.reputationStats.responseRate = responseRate;
          provider.reputationStats.standardResponseTimeHours = responseTimeHours;
          // Keep old field for backward compatibility just in case
          provider.reputationStats.responseTimeHours = responseTimeHours;
        } else {
          provider.reputationStats.responseRate = 0;
          provider.reputationStats.standardResponseTimeHours = 0;
          provider.reputationStats.responseTimeHours = 0;
        }
      } else {
        // Insufficient data for general stats
        provider.reputationStats.responseRate = 0;
        provider.reputationStats.responseTimeHours = 0;
      }

      // Calculate Repeat Customer Rate (Loyalty) & Completed Jobs Count
      const completedRequests = requests.filter(r => r.status === 'Completed');
      provider.completedJobsCount = completedRequests.length;
      const userCounts = {};
      completedRequests.forEach(req => {
        const uid = req.userId.toString();
        userCounts[uid] = (userCounts[uid] || 0) + 1;
      });

      let totalUniqueCustomers = 0;
      let repeatCustomers = 0;
      for (const count of Object.values(userCounts)) {
        totalUniqueCustomers++;
        if (count >= 2) repeatCustomers++;
      }

      // Only compute if they have at least a few unique customers (e.g., 3+)
      if (totalUniqueCustomers >= 3) {
        provider.reputationStats.repeatCustomerRate = Math.round((repeatCustomers / totalUniqueCustomers) * 100);
      } else {
        provider.reputationStats.repeatCustomerRate = null; // null or undefined implies not enough data to show
      }

      // Urgent Stats (min 3 urgent requests)
      const urgentRequests = requests.filter(r => r.isUrgent);
      if (urgentRequests.length >= 3 && urgentRespondedCount > 0) {
        const avgUrgentTimeMs = urgentTotalResponseTimeMs / urgentRespondedCount;
        provider.reputationStats.urgentResponseTimeHours = Math.round((avgUrgentTimeMs / (1000 * 60 * 60)) * 10) / 10;
      } else {
        // Insufficient data for urgent stats
        provider.reputationStats.urgentResponseTimeHours = 0;
      }

      // Re-evaluate overall verification (e.g., must have 3 out of 4)
      const verifs = provider.verification;
      const verifCount = (verifs.businessRegistration ? 1 : 0) + 
                         (verifs.phoneNumber ? 1 : 0) + 
                         (verifs.address ? 1 : 0) + 
                         (verifs.idProof ? 1 : 0);
      
      const newIsVerified = verifCount >= 3;
      if (newIsVerified !== provider.verification.isVerified) {
        provider.verification.isVerified = newIsVerified;
        if (newIsVerified) {
          provider.verification.verifiedAt = new Date();
        } else {
          provider.verification.verifiedAt = null;
        }
        
        // Audit log the overall status change
        await VerificationAuditLog.create({
          providerId: provider._id,
          fieldChanged: 'isVerified',
          oldValue: !newIsVerified,
          newValue: newIsVerified,
          notes: 'System automatically updated based on underlying verification flags.'
        });
      }

      await provider.save();
      return provider;

    } catch (error) {
      console.error('Error in ProviderStatsService.recalculateStats:', error);
      throw error;
    }
  }

  /**
   * Log a specific verification field change
   */
  static async logVerificationChange(providerId, changedBy, field, oldVal, newVal, notes = '') {
    await VerificationAuditLog.create({
      providerId,
      changedBy,
      fieldChanged: field,
      oldValue: oldVal,
      newValue: newVal,
      notes
    });
  }
}

module.exports = ProviderStatsService;
