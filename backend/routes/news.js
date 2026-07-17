const express = require('express');
const router = express.Router();
const NewsArticle = require('../models/NewsArticle');
const NewsBookmark = require('../models/NewsBookmark');
const NewsViewEvent = require('../models/NewsViewEvent');
const NewsReport = require('../models/NewsReport');
const NewsIngestionLog = require('../models/NewsIngestionLog');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/admin');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notificationService');
const newsCache = require('../utils/newsCache');

// Helper for optional auth
const optionalAuth = async (req, res, next) => {
  let token = req.cookies?.accessToken;
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id || decoded._id);
    } catch (err) {}
  }
  next();
};

// GET /api/news/trending
router.get('/trending', async (req, res) => {
  try {
    const cachedTrending = newsCache.get('trending');
    if (cachedTrending) {
      return res.json(cachedTrending);
    }

    const articles = await NewsArticle.aggregate([
      { $match: { status: 'live' } },
      { 
        $addFields: { 
          trendingScore: { $add: ["$viewCount", { $multiply: ["$saveCount", 2] }] } 
        } 
      },
      { $sort: { trendingScore: -1, publishedAt: -1 } },
      { $limit: 5 }
    ]);
    
    newsCache.set('trending', articles);
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trending news', error: err.message });
  }
});

// GET /api/news/saved/ids
router.get('/saved/ids', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await NewsBookmark.find({ userId: req.user.id || req.user._id }).select('articleId');
    res.json(bookmarks.map(b => b.articleId));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved IDs', error: err.message });
  }
});

// GET /api/news/saved
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await NewsBookmark.find({ userId: req.user.id || req.user._id })
      .populate('articleId')
      .sort({ savedAt: -1 });
    res.json(bookmarks.map(b => b.articleId).filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved articles', error: err.message });
  }
});

// GET /api/news/:id/related
router.get('/:id/related', async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    const related = await NewsArticle.find({
      _id: { $ne: article._id },
      status: 'live',
      $or: [
        { category: article.category },
        { tags: { $in: article.tags || [] } }
      ]
    }).limit(3);
    
    res.json(related);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching related', error: err.message });
  }
});

// POST /api/news/:id/view
router.post('/:id/view', optionalAuth, async (req, res) => {
  try {
    await NewsViewEvent.create({
      articleId: req.params.id,
      userId: req.user ? req.user._id : null
    });
    await NewsArticle.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    newsCache.del('trending');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error recording view', error: err.message });
  }
});

// POST /api/news/:id/bookmark
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const existing = await NewsBookmark.findOne({ userId, articleId: req.params.id });
    
    if (existing) {
      await NewsBookmark.findByIdAndDelete(existing._id);
      await NewsArticle.findByIdAndUpdate(req.params.id, { $inc: { saveCount: -1 } });
      newsCache.del('trending');
      res.json({ bookmarked: false });
    } else {
      await NewsBookmark.create({ userId, articleId: req.params.id });
      await NewsArticle.findByIdAndUpdate(req.params.id, { $inc: { saveCount: 1 } });
      newsCache.del('trending');
      res.json({ bookmarked: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error toggling bookmark', error: err.message });
  }
});

// POST /api/news/:id/report
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id || req.user._id;
    
    const existing = await NewsReport.findOne({ articleId: req.params.id, reportedBy: userId });
    if (existing) return res.status(400).json({ message: 'You have already reported this article.' });

    const report = new NewsReport({
      articleId: req.params.id,
      reportedBy: userId,
      reason
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: 'Error reporting article', error: err.message });
  }
});

// PUT /api/news/preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { followedCategories, followedTags } = req.body;
    const userId = req.user.id || req.user._id;
    const user = await User.findByIdAndUpdate(userId, {
      $set: {
        'newsPreferences.followedCategories': followedCategories || [],
        'newsPreferences.followedTags': followedTags || []
      }
    }, { new: true });
    res.json(user.newsPreferences);
  } catch (err) {
    res.status(500).json({ message: 'Error updating preferences', error: err.message });
  }
});

// GET /api/news (Public/Live articles)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, tags, search, forYou, page = 1 } = req.query;
    const limit = Math.min(Number(req.query.limit || 20), 50); // Hard cap limit to 50
    
    // Check if cacheable
    const isCacheable = !forYou && !search && !tags && (!category || category === 'All') && Number(page) === 1;
    if (isCacheable) {
      const cached = newsCache.get('feed_all_page1');
      if (cached) return res.json(cached);
    }

    const query = { status: 'live' };
    
    if (forYou === 'true' && req.user && req.user.newsPreferences) {
      const prefs = req.user.newsPreferences;
      query.$or = [];
      if (prefs.followedCategories?.length > 0) {
        query.$or.push({ category: { $in: prefs.followedCategories } });
      }
      if (prefs.followedTags?.length > 0) {
        query.$or.push({ tags: { $in: prefs.followedTags } });
      }
      if (query.$or.length === 0) delete query.$or;
    } else {
      if (category && category !== 'All') {
        query.category = category;
      }
      if (tags) {
        const tagsArr = tags.split(',').map(t => t.trim());
        if (tagsArr.length > 0) query.tags = { $in: tagsArr };
      }
    }

    if (search) {
      query.$text = { $search: search };
    }

    const articles = await NewsArticle.find(query)
      .sort(search ? { score: { $meta: "textScore" }, publishedAt: -1 } : { publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('submittedBy', 'username full_name');

    const total = await NewsArticle.countDocuments(query);

    const result = {
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    };
    
    if (isCacheable) {
      newsCache.set('feed_all_page1', result);
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching news', error: err.message });
  }
});

// ADMIN ROUTES

router.get('/admin/reports', authMiddleware, checkRole, async (req, res) => {
  try {
    const reports = await NewsReport.find({ status: 'pending' })
      .populate('articleId')
      .populate('reportedBy', 'username email full_name')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reports', error: err.message });
  }
});

router.put('/admin/reports/:id/status', authMiddleware, checkRole, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await NewsReport.findByIdAndUpdate(req.params.id, { status, adminNote }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(400).json({ message: 'Error updating report', error: err.message });
  }
});

router.get('/admin/ingestion-logs', authMiddleware, checkRole, async (req, res) => {
  try {
    const logs = await NewsIngestionLog.find().sort({ createdAt: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching ingestion logs', error: err.message });
  }
});

router.get('/admin', authMiddleware, checkRole, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const articles = await NewsArticle.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('submittedBy', 'username full_name email');

    const total = await NewsArticle.countDocuments(query);

    res.json({
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admin news', error: err.message });
  }
});

// POST /api/news (Submit article)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, summary, sourceLink, sourceName, category, tags, imageUrl, publishedAt } = req.body;
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Rate limiting for standard users (3 per 24 hours)
    if (!isAdmin) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await NewsArticle.countDocuments({
        submittedBy: userId,
        createdAt: { $gte: oneDayAgo }
      });
      if (recentCount >= 3) {
        return res.status(429).json({ message: 'Daily submission limit reached (3/day). Please try again tomorrow.' });
      }
    }

    const existing = await NewsArticle.findOne({ sourceLink });
    if (existing) return res.status(409).json({ message: 'An article with this link already exists.' });

    const status = isAdmin ? 'live' : 'pending';
    const tagsArray = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    
    const article = new NewsArticle({
      title,
      summary,
      sourceLink,
      sourceName,
      category,
      tags: tagsArray,
      imageUrl,
      publishedAt: publishedAt || new Date(),
      status,
      submissionType: 'user_submitted',
      submittedBy: userId
    });

    await article.save();
    
    if (status === 'live') {
      newsCache.del('feed_all_page1');
      newsCache.del('trending');
    }

    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ message: 'Error submitting article', error: err.message });
  }
});

// PUT /api/news/:id/status (Approve/Reject)
router.put('/:id/status', authMiddleware, checkRole, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['live', 'pending', 'rejected', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const article = await NewsArticle.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('submittedBy');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    newsCache.del('feed_all_page1');
    newsCache.del('trending');

    if (status === 'live' && req.io) req.io.emit('new_article', article);

    // Notify submitter if status changed to live or rejected
    if (article.submissionType === 'user_submitted' && article.submittedBy) {
      if (status === 'live' || status === 'rejected') {
        const isApproved = status === 'live';
        await notificationService.createNotification({
          userId: article.submittedBy._id,
          type: isApproved ? 'article_approved' : 'article_rejected',
          title: isApproved ? 'Article Approved' : 'Article Rejected',
          message: `Your article submission "${article.title}" has been ${isApproved ? 'approved and is now live!' : 'declined.'}`,
          link: isApproved ? '/news' : '/dashboard',
          isRead: false
        }, req.io);
      }
    }

    res.json(article);
  } catch (err) {
    res.status(400).json({ message: 'Error updating status', error: err.message });
  }
});

// PUT /api/news/:id/feature (Toggle featured)
router.put('/:id/feature', authMiddleware, checkRole, async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const article = await NewsArticle.findByIdAndUpdate(req.params.id, { isFeatured }, { new: true });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    res.status(400).json({ message: 'Error updating featured status', error: err.message });
  }
});

// DELETE /api/news/:id
router.delete('/:id', authMiddleware, checkRole, async (req, res) => {
  try {
    const article = await NewsArticle.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    newsCache.del('feed_all_page1');
    newsCache.del('trending');

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting article', error: err.message });
  }
});

module.exports = router;
