const MentorProfile = require('../models/MentorProfile');
const MentorBadge = require('../models/MentorBadge');
const notificationService = require('./notificationService');

class BadgeService {
  async evaluateMentorBadges(mentorId) {
    try {
      const mentor = await MentorProfile.findById(mentorId).populate('badges.badgeId');
      if (!mentor) return;

      const allBadges = await MentorBadge.find({});
      let newBadgesAdded = false;

      // Seed badges if none exist in DB for testing
      if (allBadges.length === 0) {
        await MentorBadge.insertMany([
          { name: 'Top Rated', description: 'Maintained a 4.8+ rating with at least 5 reviews.', iconUrl: '/badges/top-rated.png', criteria: { minRating: 4.8, minSessions: 5 } },
          { name: 'Elite Mentor', description: 'Completed 50+ sessions with a 4.9+ rating.', iconUrl: '/badges/elite.png', criteria: { minRating: 4.9, minSessions: 50 } },
          { name: 'Rising Star', description: 'Joined less than 30 days ago, 5+ sessions, 4.5+ rating.', iconUrl: '/badges/rising.png', criteria: { minRating: 4.5, minSessions: 5, maxDaysSinceJoin: 30 } }
        ]);
        return this.evaluateMentorBadges(mentorId);
      }

      const mentorBadgeIds = mentor.badges.map(b => b.badgeId?._id?.toString());
      
      const daysSinceJoin = (Date.now() - new Date(mentor.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      for (const badge of allBadges) {
        if (mentorBadgeIds.includes(badge._id.toString())) continue; // Already has it

        let meetsCriteria = true;
        
        if (badge.criteria.minRating > 0 && mentor.rating < badge.criteria.minRating) meetsCriteria = false;
        if (badge.criteria.minSessions > 0 && mentor.totalSessions < badge.criteria.minSessions) meetsCriteria = false;
        
        if (badge.criteria.maxDaysSinceJoin !== null && badge.criteria.maxDaysSinceJoin !== undefined) {
          if (daysSinceJoin > badge.criteria.maxDaysSinceJoin) meetsCriteria = false;
        }

        if (meetsCriteria) {
          mentor.badges.push({ badgeId: badge._id, earnedAt: new Date() });
          newBadgesAdded = true;
          
          await notificationService.createNotification({
            userId: mentor.user_id,
            type: 'mentor_badge_earned',
            relatedContentId: mentor._id,
            message: `Congratulations! You've earned the '${badge.name}' badge.`
          });
        }
      }

      // Evaluate Tiers
      let newTier = 'new';
      if (mentor.totalSessions >= 50 && mentor.rating >= 4.9) {
        newTier = 'elite';
      } else if (mentor.rating >= 4.8 && mentor.totalSessions >= 10) {
        newTier = 'top-rated';
      } else if (mentor.rating >= 4.5 && mentor.totalSessions >= 3 && daysSinceJoin <= 30) {
        newTier = 'rising';
      } else if (mentor.totalSessions > 0) {
        newTier = 'active'; // Not in schema enum, but using 'new' as default
      }
      
      if (['new', 'rising', 'top-rated', 'elite'].includes(newTier) && mentor.tier !== newTier) {
        mentor.tier = newTier;
        newBadgesAdded = true;
        
        await notificationService.createNotification({
          userId: mentor.user_id,
          type: 'mentor_tier_upgrade',
          relatedContentId: mentor._id,
          message: `Your mentor tier has been upgraded to ${newTier.toUpperCase()}!`
        });
      }

      if (newBadgesAdded) {
        await mentor.save();
      }

    } catch (err) {
      console.error('Badge Evaluation Error:', err);
    }
  }
}

module.exports = new BadgeService();
