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
      // We need at least 3 requests to show a meaningful stat
      const requests = await RepairRequest.find({ providerId });
      
      if (requests.length >= 3) {
        let respondedCount = 0;
        let totalResponseTimeMs = 0;
        
        requests.forEach(req => {
          // A request is considered "responded" if its status is no longer 'Pending'
          // We can check the statusHistory to find when it first changed from Pending
          if (req.status !== 'Pending' && req.statusHistory && req.statusHistory.length > 0) {
            // Find the earliest status change that is not pending
            const firstResponse = req.statusHistory.find(h => h.status !== 'Pending');
            if (firstResponse) {
              respondedCount++;
              const responseTimeMs = firstResponse.changedAt - req.createdAt;
              totalResponseTimeMs += responseTimeMs;
            }
          }
        });

        const responseRate = Math.round((respondedCount / requests.length) * 100);
        
        if (respondedCount > 0) {
          const avgTimeMs = totalResponseTimeMs / respondedCount;
          // Convert to hours and round to 1 decimal place
          const responseTimeHours = Math.round((avgTimeMs / (1000 * 60 * 60)) * 10) / 10;
          
          provider.reputationStats = {
            responseRate,
            responseTimeHours
          };
        } else {
          provider.reputationStats = { responseRate: 0, responseTimeHours: 0 };
        }
      } else {
        // Insufficient data to show meaningful stats
        provider.reputationStats = { responseRate: 0, responseTimeHours: 0 };
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
