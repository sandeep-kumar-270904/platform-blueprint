const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const GeminiUsage = require('../models/GeminiUsage');
const PortfolioPage = require('../../models/PortfolioPage');
const FeedbackRequest = require('../../models/FeedbackRequest');

router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  try {
    const totalResumes = await Resume.countDocuments();
    const totalCoverLetters = await CoverLetter.countDocuments();
    const totalPortfolios = await PortfolioPage.countDocuments();
    const publishedPortfolios = await PortfolioPage.countDocuments({ isPublished: true });
    const portfolioViewsResult = await PortfolioPage.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);
    const portfolioViews = portfolioViewsResult.length > 0 ? portfolioViewsResult[0].totalViews : 0;

    const pendingFeedbackRequests = await FeedbackRequest.countDocuments({ requestedFrom: 'open', status: 'pending' });
    const inProgressFeedbackRequests = await FeedbackRequest.countDocuments({ requestedFrom: 'open', status: 'in_progress' });

    
    // Average ATS Score
    const resumesWithScore = await Resume.find({ 'atsScore.score': { $exists: true } }).select('atsScore.score');
    const avgAtsScore = resumesWithScore.length > 0
      ? (resumesWithScore.reduce((acc, curr) => acc + curr.atsScore.score, 0) / resumesWithScore.length).toFixed(1)
      : 0;

    // Gemini Usage Aggregation (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentDateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const usageStats = await GeminiUsage.aggregate([
      { $match: { date: { $gte: recentDateStr } } },
      { $group: { _id: '$userId', totalCalls: { $sum: '$calls' } } },
      { $sort: { totalCalls: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, totalCalls: 1, name: '$user.name', email: '$user.email' } }
    ]);

    const totalApiCalls = await GeminiUsage.aggregate([
      { $group: { _id: null, total: { $sum: '$calls' } } }
    ]);

    res.json({
      totalResumes,
      totalCoverLetters,
      totalPortfolios,
      publishedPortfolios,
      portfolioViews,
      pendingFeedbackRequests,
      inProgressFeedbackRequests,
      avgAtsScore,
      totalApiCalls: totalApiCalls.length > 0 ? totalApiCalls[0].total : 0,
      topUsers: usageStats
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;
