const User = require('../models/User');
const Team = require('../models/Team');
const TeamApplication = require('../models/TeamApplication');
const TeamReview = require('../models/TeamReview');

class TeamBadgeService {
  async getUserStats(userId) {
    const teamsCreated = await Team.countDocuments({ creator: userId });
    
    const acceptedApplications = await TeamApplication.find({ 
      applicant: userId, 
      status: 'accepted' 
    });
    
    const teamsJoined = acceptedApplications.length;
    const joinedTeamIds = acceptedApplications.map(a => a.team);

    const teamsCompleted = await Team.countDocuments({
      status: 'completed',
      $or: [
        { creator: userId },
        { _id: { $in: joinedTeamIds } }
      ]
    });

    const reviews = await TeamReview.aggregate([
      { $match: { reviewee: userId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    const averageRatingReceived = reviews.length > 0 ? reviews[0].avgRating : 0;
    const totalReviews = reviews.length > 0 ? reviews[0].count : 0;

    return {
      teamsCreated,
      teamsJoined,
      teamsCompleted,
      averageRatingReceived,
      totalReviews,
      joinedTeamIds
    };
  }

  async evaluateUserBadges(userId) {
    const stats = await this.getUserStats(userId);
    const user = await User.findById(userId);
    if (!user) return stats;

    const currentBadges = user.gamification_badges.map(b => b.badge_id);
    let newBadgesEarned = false;

    // Badge: Reliable Teammate
    // 5+ completed teams with 4+ avg rating
    if (stats.teamsCompleted >= 5 && stats.averageRatingReceived >= 4 && !currentBadges.includes('RELIABLE_TEAMMATE')) {
      user.gamification_badges.push({
        badge_id: 'RELIABLE_TEAMMATE',
        name: 'Reliable Teammate'
      });
      newBadgesEarned = true;
    }

    // Badge: Team Builder
    // created 3+ completed teams
    const createdCompleted = await Team.countDocuments({ creator: userId, status: 'completed' });
    if (createdCompleted >= 3 && !currentBadges.includes('TEAM_BUILDER')) {
      user.gamification_badges.push({
        badge_id: 'TEAM_BUILDER',
        name: 'Team Builder'
      });
      newBadgesEarned = true;
    }

    if (newBadgesEarned) {
      await user.save();
    }

    return stats;
  }
}

module.exports = new TeamBadgeService();
