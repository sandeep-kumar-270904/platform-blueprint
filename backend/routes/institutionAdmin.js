const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Institution = require('../models/Institution');
const mongoose = require('mongoose');

// Middleware to check if user is an admin of the specified institution
const isInstitutionAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.institutionId) {
      return res.status(403).json({ error: 'User is not part of an institution' });
    }
    
    const institution = await Institution.findById(user.institutionId);
    if (!institution || !institution.adminUserIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied. Institution admin only.' });
    }
    
    req.institutionId = user.institutionId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error checking institution admin' });
  }
};

// GET /api/institution-admin/dashboard/stats
router.get('/dashboard/stats', authMiddleware, isInstitutionAdmin, async (req, res) => {
  try {
    const instId = req.institutionId;

    // 1. Get total students in institution
    const totalStudents = await User.countDocuments({ institutionId: instId, institutionVerified: true });

    // 2. Get total quiz attempts by these students
    const usersInInst = await User.find({ institutionId: instId }, '_id');
    const userIds = usersInInst.map(u => u._id);

    const totalAttempts = await QuizAttempt.countDocuments({ user: { $in: userIds }, status: 'completed' });

    // 3. Average score across institution
    const scoreAggr = await QuizAttempt.aggregate([
      { $match: { user: { $in: userIds }, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$percentageScore' } } }
    ]);
    const avgScore = scoreAggr.length > 0 ? Math.round(scoreAggr[0].avgScore) : 0;

    // 4. Most attempted quizzes
    const popularAggr = await QuizAttempt.aggregate([
      { $match: { user: { $in: userIds }, status: 'completed' } },
      { $group: { _id: '$quiz', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const popularQuizzes = await Quiz.populate(popularAggr, { path: '_id', select: 'title category' });

    // 5. Engagement trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const trendAggr = await QuizAttempt.aggregate([
      { $match: { user: { $in: userIds }, completedAt: { $gte: sevenDaysAgo }, status: 'completed' } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents,
      totalAttempts,
      avgScore,
      popularQuizzes: popularQuizzes.map(p => ({ quiz: p._id, attempts: p.count })),
      trend: trendAggr
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
