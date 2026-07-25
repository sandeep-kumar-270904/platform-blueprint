const User = require('../models/User');

const awardBadge = async (userId, badgeId, badgeName) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    
    // Check if user already has the badge
    const hasBadge = user.gamification_badges.some(b => b.badge_id === badgeId);
    if (!hasBadge) {
      user.gamification_badges.push({ badge_id: badgeId, name: badgeName });
      await user.save();
      console.log(`Awarded badge ${badgeName} to user ${userId}`);
    }
  } catch (err) {
    console.error('Error awarding badge:', err);
  }
};

module.exports = { awardBadge };
