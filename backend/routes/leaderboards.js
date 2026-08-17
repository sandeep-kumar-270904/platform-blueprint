const express = require('express');
const router = express.Router();
const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');
const Idea = require('../models/Idea');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');
const { aggregateCollegeReviews, cats } = require('../services/collegeReviewAggregator');
const College = require('../models/College');

// GET /api/leaderboards
// Cross-college leaderboards by category and region
router.get('/', async (req, res) => {
  try {
    const { category, region, page = 1, limit = 20 } = req.query;
    
    if (!category || !cats.includes(category)) {
      return res.status(400).json({ message: 'Valid category is required' });
    }

    const allCollegesAggregation = await aggregateCollegeReviews();
    
    // allCollegesAggregation is an array of { collegeId, studentExperience }
    // We need to filter sampleSize >= 5 and join with College model to get details
    let leaderboards = [];
    
    for (let agg of allCollegesAggregation) {
      const exp = agg.studentExperience[category];
      if (exp && exp.sampleSize >= 5 && exp.avgRating !== null) {
        leaderboards.push({
          collegeId: agg.collegeId,
          avgRating: exp.avgRating,
          sampleSize: exp.sampleSize
        });
      }
    }

    // Now populate College details and apply region filter
    const collegeIds = leaderboards.map(l => l.collegeId);
    
    let collegeQuery = { _id: { $in: collegeIds }, draft: { $ne: true } };
    if (region) {
      collegeQuery['location.state'] = region;
    }
    
    const colleges = await College.find(collegeQuery, 'name location logoOrIcon').lean();
    const collegeMap = colleges.reduce((acc, c) => {
      acc[c._id.toString()] = c;
      return acc;
    }, {});
    
    let finalLeaderboard = leaderboards
      .filter(l => collegeMap[l.collegeId.toString()])
      .map(l => {
        const c = collegeMap[l.collegeId.toString()];
        return {
          collegeId: l.collegeId,
          collegeName: c.name,
          location: c.location,
          logoOrIcon: c.logoOrIcon,
          avgRating: l.avgRating,
          sampleSize: l.sampleSize
        };
      });

    // Sort descending by avgRating
    finalLeaderboard.sort((a, b) => b.avgRating - a.avgRating);
    
    // Add rank
    finalLeaderboard.forEach((l, idx) => {
      l.rank = idx + 1;
    });

    // Paginate
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginated = finalLeaderboard.slice(startIndex, startIndex + Number(limit));

    res.json({
      leaderboard: paginated,
      total: finalLeaderboard.length,
      page: Number(page),
      pages: Math.ceil(finalLeaderboard.length / Number(limit))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/leaderboards/global
router.get('/global', async (req, res) => {
  try {
    const { category, limit = 50, institutionId } = req.query;
    
    let userMatch = { banned: { $ne: true } };
    if (institutionId) {
      userMatch.institutionId = new mongoose.Types.ObjectId(institutionId);
    }

    if (category) {
      // Aggregation for category specific points
      const leaders = await QuizAttempt.aggregate([
        { $match: { status: 'completed' } },
        {
          $lookup: {
            from: 'quizzes',
            localField: 'quiz',
            foreignField: '_id',
            as: 'quizData'
          }
        },
        { $unwind: '$quizData' },
        { $match: { 'quizData.category': category, 'quizData.status': { $ne: 'under_review' } } },
        {
          $group: {
            _id: '$user',
            categoryPoints: { $sum: '$score' }
          }
        },
        { $sort: { categoryPoints: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.banned': { $ne: true }, ...(institutionId ? { 'userInfo.institutionId': new mongoose.Types.ObjectId(institutionId) } : {}) } },
        { $limit: parseInt(limit) },
        {
          $project: {
            _id: 1,
            points: '$categoryPoints', // map for consistent UI
            username: '$userInfo.username',
            full_name: '$userInfo.full_name',
            avatar_url: '$userInfo.avatar_url',
            badges: '$userInfo.badges'
          }
        }
      ]);
      return res.json(leaders);
    } else {
      // Global leaderboards based on totalQuizPoints
      const leaders = await User.find(userMatch)
        .sort({ totalQuizPoints: -1 })
        .limit(parseInt(limit))
        .select('username full_name avatar_url totalQuizPoints badges');

      const mapped = leaders.map(l => ({
        _id: l._id,
        points: l.totalQuizPoints,
        username: l.username,
        full_name: l.full_name,
        avatar_url: l.avatar_url,
        badges: l.badges
      }));

      return res.json(mapped);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/leaderboards/global/me
router.get('/global/me', authMiddleware, async (req, res) => {
  try {
    const { category } = req.query;
    const userId = req.user.id;

    if (category) {
      // Rank computation for category is complex without materialization, 
      // do a simple inline query or return total points in that category
      const myPointsAgg = await QuizAttempt.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId), status: 'completed' } },
        { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quizData' } },
        { $unwind: '$quizData' },
        { $match: { 'quizData.category': category, 'quizData.status': { $ne: 'under_review' } } },
        { $group: { _id: null, categoryPoints: { $sum: '$score' } } }
      ]);
      const myPoints = myPointsAgg.length > 0 ? myPointsAgg[0].categoryPoints : 0;
      
      // Approximate rank (count users who have more category points)
      // For real large scale, we'd pre-compute this. Doing simple sum-group for now.
      const higherRankAgg = await QuizAttempt.aggregate([
        { $match: { status: 'completed' } },
        { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quizData' } },
        { $unwind: '$quizData' },
        { $match: { 'quizData.category': category, 'quizData.status': { $ne: 'under_review' } } },
        { $group: { _id: '$user', categoryPoints: { $sum: '$score' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $match: { categoryPoints: { $gt: myPoints }, 'userInfo.banned': { $ne: true } } },
        { $count: 'higherUsers' }
      ]);
      const rank = higherRankAgg.length > 0 ? higherRankAgg[0].higherUsers + 1 : 1;
      
      return res.json({ rank, points: myPoints });
    } else {
      const me = await User.findById(userId);
      const higherScoreCount = await User.countDocuments({ totalQuizPoints: { $gt: me.totalQuizPoints }, banned: { $ne: true } });
      const rank = higherScoreCount + 1;

      return res.json({ rank, points: me.totalQuizPoints });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/leaderboards/ideas
router.get('/ideas', async (req, res) => {
  try {
    const { category, period, limit = 10 } = req.query;
    const filter = { status: { $ne: 'Launched' } };
    
    if (category) filter.category = category;
    
    if (period) {
      const date = new Date();
      if (period === 'daily') date.setDate(date.getDate() - 1);
      else if (period === 'weekly') date.setDate(date.getDate() - 7);
      else if (period === 'monthly') date.setMonth(date.getMonth() - 1);
      filter.created_at = { $gte: date };
    }

    const leaders = await Idea.find(filter)
      .sort({ upvoteCount: -1, commentCount: -1 })
      .limit(parseInt(limit))
      .populate('owner', 'username avatar_url full_name');
      
    const formattedLeaders = leaders.map((idea, index) => ({
      idea,
      upvotes: idea.upvoteCount,
      rank: index + 1
    }));
    
    res.json(formattedLeaders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/leaderboards/colleges
router.get('/colleges', async (req, res) => {
  try {
    const { metric = 'rating', limit = 10 } = req.query;
    const College = require('../models/College');
    
    let sortObj = {};
    if (metric === 'rating') {
      sortObj = { rating: -1, totalReviews: -1 };
    } else if (metric === 'reviews') {
      sortObj = { totalReviews: -1 };
    } else if (metric === 'placements') {
      // Assuming placementPercentage is a number
      sortObj = { placementPercentage: -1 };
    } else {
      sortObj = { rating: -1 };
    }

    const colleges = await College.find({ draft: { $ne: true } })
      .sort(sortObj)
      .limit(parseInt(limit))
      .select('name location.city location.state rating totalReviews placementPercentage logoOrIcon avgPackage');
      
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
