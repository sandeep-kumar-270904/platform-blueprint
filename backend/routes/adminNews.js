const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const NewsArticle = require('../models/NewsArticle');
const NewsComment = require('../models/NewsComment');

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Admin only' });
};

router.get('/analytics', authMiddleware, isAdmin, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const mostReadCategories = await NewsArticle.aggregate([
      { $match: { publishedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$category', totalViews: { $sum: '$viewCount' } } },
      { $sort: { totalViews: -1 } }
    ]);

    const bestSources = await NewsArticle.aggregate([
      { $match: { publishedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$sourceName', totalEngagement: { $sum: { $add: ['$viewCount', '$saveCount', '$shareCount'] } } } },
      { $sort: { totalEngagement: -1 } }
    ]);

    const commentVolume = await NewsComment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ mostReadCategories, bestSources, commentVolume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quota', authMiddleware, isAdmin, async (req, res) => {
  try {
    // Simulating external API quota
    res.json({
      service: 'NewsAPI',
      limit: 500,
      remaining: Math.floor(Math.random() * 200) + 300,
      resetAt: new Date(new Date().setHours(24, 0, 0, 0))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
