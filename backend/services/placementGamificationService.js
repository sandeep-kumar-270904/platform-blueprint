const PlacementProfile = require('../models/PlacementProfile');

const XP_MAP = {
  'DSA_EASY': 10,
  'DSA_MEDIUM': 20,
  'DSA_HARD': 30,
  'HR_TIP': 5,
  'INTERVIEW_Q': 5,
  'MOCK_INTERVIEW': 50,
  'MOCK_RATING_5': 25, // Bonus for getting 5 stars
  'STREAK_7': 100,
  'STREAK_30': 500,
  'CHALLENGE_COMPLETE': 200
};

const LEVELS = [
  { threshold: 0, title: 'Rookie' },
  { threshold: 100, title: 'Novice' },
  { threshold: 500, title: 'Apprentice' },
  { threshold: 1000, title: 'Contender' },
  { threshold: 2500, title: 'Challenger' },
  { threshold: 5000, title: 'Expert' },
  { threshold: 10000, title: 'Placement Pro' },
];

function getLevelForXp(xp) {
  let title = 'Rookie';
  for (const level of LEVELS) {
    if (xp >= level.threshold) {
      title = level.title;
    } else {
      break;
    }
  }
  return title;
}

const BADGES = {
  'DSA_50': { id: 'DSA_50', title: 'Code Warrior', description: 'Solve 50 DSA problems' },
  'MOCK_5': { id: 'MOCK_5', title: 'Interview Veteran', description: 'Complete 5 Mock Interviews' },
  'STREAK_14': { id: 'STREAK_14', title: 'Consistency King', description: 'Maintain a 14-day streak' },
  'HR_100': { id: 'HR_100', title: 'Smooth Talker', description: 'Review 100 HR tips' }
};

const WEEKLY_CHALLENGES = [
  { id: 'chal_dsa_5', title: 'Solve 5 DSA Problems', targetValue: 5, rewardXp: 150 },
  { id: 'chal_hr_10', title: 'Review 10 HR Tips', targetValue: 10, rewardXp: 100 },
  { id: 'chal_mock_1', title: 'Attend 1 Mock Interview', targetValue: 1, rewardXp: 200 }
];

// Gets week string based on ISO week dates
function getWeekString(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

class PlacementGamificationService {
  async getOrCreateProfile(userId) {
    let profile = await PlacementProfile.findOne({ user_id: userId });
    if (!profile) {
      profile = new PlacementProfile({ user_id: userId });
      await profile.save();
    }
    return profile;
  }

  async awardXP(userId, actionKey) {
    const xpAmount = XP_MAP[actionKey];
    if (!xpAmount) return null;

    const profile = await this.getOrCreateProfile(userId);
    profile.xp += xpAmount;
    profile.levelTitle = getLevelForXp(profile.xp);
    profile.lastXpUpdate = new Date();
    
    profile.xpHistory.push({
      amount: xpAmount,
      source: actionKey,
      createdAt: new Date()
    });

    await profile.save();

    return {
      xpAwarded: xpAmount,
      newTotalXp: profile.xp,
      levelTitle: profile.levelTitle
    };
  }

  async awardBadge(userId, badgeId) {
    if (!BADGES[badgeId]) return null;

    const profile = await this.getOrCreateProfile(userId);
    const alreadyHas = profile.earnedBadges.some(b => b.badgeId === badgeId);
    
    if (!alreadyHas) {
      profile.earnedBadges.push({ badgeId, earnedAt: new Date() });
      await profile.save();
      return BADGES[badgeId];
    }
    return null;
  }

  async incrementWeeklyChallenge(userId, challengeId, amount = 1) {
    const profile = await this.getOrCreateProfile(userId);
    const currentWeek = getWeekString();
    
    let challengeProgress = profile.challengeProgress.find(c => c.challengeId === challengeId && c.weekOf === currentWeek);
    
    if (!challengeProgress) {
      challengeProgress = {
        challengeId,
        currentProgress: 0,
        claimed: false,
        weekOf: currentWeek
      };
      profile.challengeProgress.push(challengeProgress);
    }
    
    if (!challengeProgress.claimed) {
      challengeProgress.currentProgress += amount;
      await profile.save();
    }

    return challengeProgress;
  }

  getWeeklyChallenges() {
    return WEEKLY_CHALLENGES;
  }

  getLevels() {
    return LEVELS;
  }

  getCurrentWeek() {
    return getWeekString();
  }

  async claimChallenge(userId, challengeId) {
    const profile = await this.getOrCreateProfile(userId);
    
    const now = new Date();
    const currentWeekStr = getWeekString(now);
    
    // Check if within 24 hour grace period for previous week
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 1 is Monday
    const isMondayGracePeriod = dayOfWeek === 1; 

    // Find progress for current week or last week (if in grace period)
    let progress = profile.challengeProgress.find(c => c.challengeId === challengeId && c.weekOf === currentWeekStr);
    
    if (!progress && isMondayGracePeriod) {
      // Calculate previous week string
      const lastWeekDate = new Date(now);
      lastWeekDate.setUTCDate(now.getUTCDate() - 7);
      const prevWeekStr = getWeekString(lastWeekDate);
      progress = profile.challengeProgress.find(c => c.challengeId === challengeId && c.weekOf === prevWeekStr);
    }

    if (!progress) {
      throw new Error('No progress found for this challenge in the valid timeframe');
    }
    
    if (progress.claimed) {
      throw new Error('Reward already claimed');
    }

    const challengeDef = WEEKLY_CHALLENGES.find(c => c.id === challengeId);
    if (!challengeDef) throw new Error('Invalid challenge ID');
    
    if (progress.currentProgress >= challengeDef.targetValue) {
      progress.claimed = true;
      profile.xp += challengeDef.rewardXp;
      profile.levelTitle = getLevelForXp(profile.xp);
      profile.lastXpUpdate = new Date();
      
      profile.xpHistory.push({
        amount: challengeDef.rewardXp,
        source: 'CHALLENGE_COMPLETE',
        createdAt: new Date()
      });
      
      await profile.save();
      
      return { 
        xpAwarded: challengeDef.rewardXp, 
        newTotalXp: profile.xp,
        levelTitle: profile.levelTitle 
      };
    } else {
      throw new Error('Challenge not completed yet');
    }
  }
}

module.exports = new PlacementGamificationService();
