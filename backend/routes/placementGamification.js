const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PlacementProfile = require('../models/PlacementProfile');
const placementGamificationService = require('../services/placementGamificationService');
const User = require('../models/User');

// Simple in-memory cache for MVP. For production, Redis is recommended.
const leaderboardCache = {
  data: {},
  timestamp: 0,
  TTL_MS: 5 * 60 * 1000 // 5 minutes
};

// @route   GET /api/placement-gamification/profile
// @desc    Get user's placement gamification profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await placementGamificationService.getOrCreateProfile(req.user.id);
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/placement-gamification/leaderboard
// @desc    Get leaderboard (Global, College, Branch)
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { scope = 'global', timeframe = 'all', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const cacheKey = `${scope}_${timeframe}_${pageNum}_${limitNum}`;

    // Check cache
    if (Date.now() - leaderboardCache.timestamp < leaderboardCache.TTL_MS && leaderboardCache.data[cacheKey]) {
      return res.json(leaderboardCache.data[cacheKey]);
    }
    
    let userList = [];
    let total = 0;
    
    if (scope === 'global') {
      total = await PlacementProfile.countDocuments({ user_id: { $ne: null } });
      const profiles = await PlacementProfile.find({ user_id: { $ne: null } })
        .sort({ xp: -1, lastXpUpdate: 1 }) // Tiebreaker: whoever reached the XP first wins
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('user_id', 'username full_name avatar_url institution.college institution.degree');
        
      userList = profiles.map((p, index) => ({
        rank: ((pageNum - 1) * limitNum) + index + 1,
        user_id: p.user_id ? p.user_id._id : null,
        username: p.user_id ? p.user_id.username : 'Unknown',
        full_name: p.user_id ? p.user_id.full_name : 'Unknown',
        avatar_url: p.user_id ? p.user_id.avatar_url : '',
        college: p.user_id?.institution?.college,
        degree: p.user_id?.institution?.degree,
        xp: p.xp,
        levelTitle: p.levelTitle
      })).filter(u => u.user_id !== null);
    } else {
      const currentUser = await User.findById(req.user.id);
      let userQuery = {};
      
      // If user lacks scope data, they shouldn't see anyone in this scoped board.
      if (scope === 'college') {
        if (!currentUser.institution?.college) {
           return res.json({ users: [], totalPages: 0, currentPage: pageNum, total: 0 }); 
        }
        userQuery = { 'institution.college': currentUser.institution.college };
      } else if (scope === 'branch') {
        if (!currentUser.institution?.degree) {
           return res.json({ users: [], totalPages: 0, currentPage: pageNum, total: 0 }); 
        }
        userQuery = { 'institution.degree': currentUser.institution.degree };
      }

      const usersInScope = await User.find(userQuery).select('_id username full_name avatar_url institution');
      const userIds = usersInScope.map(u => u._id);
      
      total = await PlacementProfile.countDocuments({ user_id: { $in: userIds } });
      const profiles = await PlacementProfile.find({ user_id: { $in: userIds } })
        .sort({ xp: -1, lastXpUpdate: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      
      userList = profiles.map((p, index) => {
        const u = usersInScope.find(user => user._id.toString() === p.user_id.toString());
        return {
          rank: ((pageNum - 1) * limitNum) + index + 1,
          user_id: p.user_id,
          username: u?.username,
          full_name: u?.full_name,
          avatar_url: u?.avatar_url,
          college: u?.institution?.college,
          degree: u?.institution?.degree,
          xp: p.xp,
          levelTitle: p.levelTitle
        };
      });
    }

    const responseData = {
      users: userList,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    };

    // Update Cache
    leaderboardCache.data[cacheKey] = responseData;
    leaderboardCache.timestamp = Date.now();

    res.json(responseData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/placement-gamification/challenges
// @desc    Get active weekly challenges
// @access  Private
router.get('/challenges', auth, async (req, res) => {
  try {
    const profile = await placementGamificationService.getOrCreateProfile(req.user.id);
    const WEEKLY_CHALLENGES = placementGamificationService.getWeeklyChallenges();
    const currentWeek = placementGamificationService.getCurrentWeek();

    const mergedChallenges = WEEKLY_CHALLENGES.map(challenge => {
      const progress = profile.challengeProgress.find(c => c.challengeId === challenge.id && c.weekOf === currentWeek);
      return {
        ...challenge,
        currentProgress: progress ? progress.currentProgress : 0,
        claimed: progress ? progress.claimed : false
      };
    });

    res.json(mergedChallenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/placement-gamification/challenges/:id/claim
// @desc    Claim reward for a challenge
// @access  Private
router.post('/challenges/:id/claim', auth, async (req, res) => {
  try {
    const result = await placementGamificationService.claimChallenge(req.user.id, req.params.id);
    res.json({ message: 'Reward claimed', ...result });
  } catch (err) {
    console.error(err.message);
    if (err.message.includes('No progress found') || err.message.includes('not completed') || err.message.includes('already claimed')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
