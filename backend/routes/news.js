const NewsAuditLog = require('../models/NewsAuditLog');
const express = require('express');
const router = express.Router();
const NewsArticle = require('../models/NewsArticle');
const NewsBookmark = require('../models/NewsBookmark');
const NewsViewEvent = require('../models/NewsViewEvent');
const NewsComment = require('../models/NewsComment');
const NewsCollection = require('../models/NewsCollection');
const NewsReport = require('../models/NewsReport');
const NewsIngestionLog = require('../models/NewsIngestionLog');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/admin');
const jwt = require('jsonwebtoken');
const notificationService = require('../services/notificationService');
const newsCache = require('../utils/newsCache');
const AdminActionLog = require('../models/AdminActionLog');
const NewsViewDedup = require('../models/NewsViewDedup');
const NewsSourceHealth = require('../models/NewsSourceHealth');
const { actionRateLimiter } = require('../middleware/rateLimiter');


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



// Simulated AI Moderation Helper
const assessModeration = async (text) => {
  const t = text.toLowerCase();
  if (t.includes('spam') || t.includes('viagra') || t.includes('crypto scam')) {
    return { flagged: true, reason: 'Suspected spam/scam content detected by AI' };
  }
  if (t.includes('hate') || t.includes('kill')) {
    return { flagged: true, reason: 'Suspected abusive language detected by AI' };
  }
  return { flagged: false };
};

// GET /api/news/me/stats
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await NewsViewEvent.find({ userId: req.user.id });
    
    const readThisWeek = views.filter(v => v.viewedAt >= sevenDaysAgo).length;
    const readThisMonth = views.filter(v => v.viewedAt >= thirtyDaysAgo).length;

    // Aggregate top categories
    const pipeline = [
      { $match: { userId: req.user.id } },
      {
        $lookup: {
          from: 'newsarticles',
          localField: 'articleId',
          foreignField: '_id',
          as: 'article'
        }
      },
      { $unwind: '$article' },
      { $group: { _id: '$article.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ];
    
    const topCatAgg = await NewsViewEvent.aggregate(pipeline);
    const topCategory = topCatAgg.length > 0 ? topCatAgg[0]._id : 'None';
    
    const user = await User.findById(req.user.id);

    res.json({
      readThisWeek,
      readThisMonth,
      topCategory,
      streak: user.newsStreak || { current: 0, longest: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:id/collection-suggestion
router.get('/:id/collection-suggestion', authMiddleware, async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article || !article.tags || article.tags.length === 0) {
      return res.json({ suggestedCollectionId: null });
    }

    const collections = await NewsCollection.find({ 
      $or: [{ userId: req.user.id }, { collaborators: req.user.id }] 
    });
    
    if (collections.length === 0) return res.json({ suggestedCollectionId: null });

    let bestCollectionId = null;
    let maxOverlap = 0;

    for (const col of collections) {
      const bookmarks = await NewsBookmark.find({ collectionId: col._id }).populate('articleId');
      let overlapCount = 0;
      
      bookmarks.forEach(bm => {
        if (bm.articleId && bm.articleId.tags) {
           bm.articleId.tags.forEach(tag => {
             if (article.tags.includes(tag)) overlapCount++;
           });
        }
      });
      
      if (overlapCount > maxOverlap) {
        maxOverlap = overlapCount;
        bestCollectionId = col._id;
      }
    }

    res.json({ suggestedCollectionId: bestCollectionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/morning-brief
router.get('/morning-brief', authMiddleware, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const user = await User.findById(req.user.id);
    const prefs = user.newsPreferences || {};
    
    let query = { status: 'live', publishedAt: { $gte: yesterday } };
    
    if (prefs.followedCategories?.length > 0 || prefs.followedTags?.length > 0) {
      query.$or = [];
      if (prefs.followedCategories?.length > 0) query.$or.push({ category: { $in: prefs.followedCategories } });
      if (prefs.followedTags?.length > 0) query.$or.push({ tags: { $in: prefs.followedTags } });
    }
    
    const articles = await NewsArticle.find(query)
      .sort({ viewCount: -1, saveCount: -1 })
      .limit(5);
      
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/trending

// GET /api/news/feed.rss
router.get('/feed.rss', async (req, res) => {
  try {
    const articles = await NewsArticle.find({ status: 'live' })
      .sort({ publishedAt: -1 })
      .limit(20);

    let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>StudentHub AI & Tech News</title>
  <description>The latest in AI, Startups, and Tech</description>
  <link>https://studenthub.example.com/news</link>
`;

    articles.forEach(a => {
      rss += `  <item>
    <title><![CDATA[${a.title}]]></title>
    <description><![CDATA[${a.summary}]]></description>
    <link>${a.sourceLink}</link>
    <pubDate>${a.publishedAt.toUTCString()}</pubDate>
  </item>
`;
    });

    rss += `</channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  } catch (err) {
    res.status(500).send('Error generating RSS feed');
  }
});



// GET /api/news/me/stats
router.get('/me/stats', authMiddleware, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const views = await NewsViewEvent.find({ userId: req.user.id });
    
    const readThisWeek = views.filter(v => v.viewedAt >= sevenDaysAgo).length;
    const readThisMonth = views.filter(v => v.viewedAt >= thirtyDaysAgo).length;

    // Aggregate top categories
    const pipeline = [
      { $match: { userId: req.user.id } },
      {
        $lookup: {
          from: 'newsarticles',
          localField: 'articleId',
          foreignField: '_id',
          as: 'article'
        }
      },
      { $unwind: '$article' },
      { $group: { _id: '$article.category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ];
    
    const topCatAgg = await NewsViewEvent.aggregate(pipeline);
    const topCategory = topCatAgg.length > 0 ? topCatAgg[0]._id : 'None';
    
    const user = await User.findById(req.user.id);

    res.json({
      readThisWeek,
      readThisMonth,
      topCategory,
      streak: user.newsStreak || { current: 0, longest: 0 }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:id/collection-suggestion
router.get('/:id/collection-suggestion', authMiddleware, async (req, res) => {
  try {
    const article = await NewsArticle.findById(req.params.id);
    if (!article || !article.tags || article.tags.length === 0) {
      return res.json({ suggestedCollectionId: null });
    }

    const collections = await NewsCollection.find({ 
      $or: [{ userId: req.user.id }, { collaborators: req.user.id }] 
    });
    
    if (collections.length === 0) return res.json({ suggestedCollectionId: null });

    let bestCollectionId = null;
    let maxOverlap = 0;

    for (const col of collections) {
      const bookmarks = await NewsBookmark.find({ collectionId: col._id }).populate('articleId');
      let overlapCount = 0;
      
      bookmarks.forEach(bm => {
        if (bm.articleId && bm.articleId.tags) {
           bm.articleId.tags.forEach(tag => {
             if (article.tags.includes(tag)) overlapCount++;
           });
        }
      });
      
      if (overlapCount > maxOverlap) {
        maxOverlap = overlapCount;
        bestCollectionId = col._id;
      }
    }

    res.json({ suggestedCollectionId: bestCollectionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/morning-brief
router.get('/morning-brief', authMiddleware, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const user = await User.findById(req.user.id);
    const prefs = user.newsPreferences || {};
    
    let query = { status: 'live', publishedAt: { $gte: yesterday } };
    
    if (prefs.followedCategories?.length > 0 || prefs.followedTags?.length > 0) {
      query.$or = [];
      if (prefs.followedCategories?.length > 0) query.$or.push({ category: { $in: prefs.followedCategories } });
      if (prefs.followedTags?.length > 0) query.$or.push({ tags: { $in: prefs.followedTags } });
    }
    
    const articles = await NewsArticle.find(query)
      .sort({ viewCount: -1, saveCount: -1 })
      .limit(5);
      
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const bookmarks = await NewsBookmark.find({ userId: req.user.id || req.user.id }).select('articleId');
    res.json(bookmarks.map(b => b.articleId));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching saved IDs', error: err.message });
  }
});

// GET /api/news/saved
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const bookmarks = await NewsBookmark.find({ userId: req.user.id || req.user.id })
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
router.post('/:id/view', actionRateLimiter, optionalAuth, async (req, res) => {
  try {
    const viewerId = req.user ? String(req.user.id || req.user.id) : require('crypto').createHash('sha256').update(req.ip + (req.headers['user-agent'] || '')).digest('hex');
    const existing = await NewsViewDedup.findOne({ articleId: req.params.id, viewerId });
    
    if (!existing) {
      await NewsViewDedup.create({ articleId: req.params.id, viewerId });
      await NewsViewEvent.create({
        articleId: req.params.id,
        userId: req.user ? req.user.id : null
      });
      await NewsArticle.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

        if (req.user) {
          const user = await User.findById(req.user.id);
          if (user) {
            const now = new Date();
            const lastActive = user.newsStreak?.lastActiveDate;
            let currentStreak = user.newsStreak?.current || 0;
            let longestStreak = user.newsStreak?.longest || 0;
            
            if (!lastActive) {
              currentStreak = 1;
            } else {
              const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
              if (diffDays === 1) {
                currentStreak += 1;
              } else if (diffDays > 1) {
                currentStreak = 1;
              }
            }
            if (currentStreak > longestStreak) longestStreak = currentStreak;
            
            await User.findByIdAndUpdate(req.user.id, {
              $set: {
                'newsStreak.current': currentStreak,
                'newsStreak.longest': longestStreak,
                'newsStreak.lastActiveDate': now
              }
            });
          }
        }

    }
    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: true }); // duplicate insertion
    }
    res.status(500).json({ message: 'Error recording view', error: err.message });
  }
});

// POST /api/news/:id/bookmark
router.post('/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.id;
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
    const userId = req.user.id || req.user.id;
    
    const existing = await NewsReport.findOne({ articleId: req.params.id, reportedBy: userId });
    if (existing) return res.status(400).json({ message: 'You have already reported this article.' });

    const report = new NewsReport({
      articleId: req.params.id,
      reportedBy: userId,
      reason
    });
    await report.save();
    
    // Check threshold for auto-hiding
    const pendingCount = await NewsReport.countDocuments({ articleId: req.params.id, status: 'pending' });
    if (pendingCount >= 5) {
      const article = await NewsArticle.findByIdAndUpdate(req.params.id, { status: 'flagged' }, { new: true });
      if (article && article.submissionType === 'user_submitted' && article.submittedBy) {
         await notificationService.createNotification({
            userId: article.submittedBy,
            type: 'article_flagged',
            title: 'Article Flagged',
            message: `Your article "${article.title}" has been automatically hidden due to multiple reports.`,
            link: '/dashboard',
            isRead: false
         }, req.io);
      }
    }
    
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ message: 'Error reporting article', error: err.message });
  }
});

// PUT /api/news/preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { followedCategories, followedTags } = req.body;
    const userId = req.user.id || req.user.id;
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

// GET /api/news/trending-tags
router.get('/trending-tags', async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const tags = await NewsArticle.aggregate([
      { $match: { status: 'live', publishedAt: { $gte: twoDaysAgo } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(tags.map(t => t._id));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching trending tags', error: err.message });
  }
});

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
        if (prefs.mutedSources && prefs.mutedSources.length > 0) {
          query.sourceName = { $nin: prefs.mutedSources };
        }

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
      .populate('submittedBy', 'username full_name')
      .lean();

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
    console.error("GET /api/news error:", err.stack);
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

router.get('/admin/source-health', authMiddleware, checkRole, async (req, res) => {
  try {
    const health = await NewsSourceHealth.find().sort({ sourceName: 1 });
    res.json(health);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching source health', error: err.message });
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
router.post('/', actionRateLimiter, authMiddleware, async (req, res) => {
  try {
    const { title, summary, sourceLink, sourceName, category, tags, imageUrl, publishedAt } = req.body;
    
    // URL Validation
    const urlRegex = /^https?:\/\//i;
    if (sourceLink && !urlRegex.test(sourceLink)) {
      return res.status(400).json({ message: 'Invalid source link. Must be a valid HTTP/HTTPS URL.' });
    }
    if (imageUrl && !urlRegex.test(imageUrl)) {
      return res.status(400).json({ message: 'Invalid image URL. Must be a valid HTTP/HTTPS URL.' });
    }
    
    const userId = req.user.id || req.user.id;
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
    
    const modResult = await assessModeration(title + ' ' + summary);
    const article = new NewsArticle({
      aiModerationScore: modResult,
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
    if (!['live', 'pending', 'rejected', 'archived', 'flagged'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const article = await NewsArticle.findByIdAndUpdate(req.params.id, { status }, { new: false }).populate('submittedBy');
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    await AdminActionLog.create({
      adminId: req.user.id || req.user.id,
      actionType: 'news_status_update',
      targetId: article._id,
      reason: `Changed status from ${article.status} to ${status}`
    });
    
    const updatedArticle = await NewsArticle.findById(req.params.id).populate('submittedBy');
    
    newsCache.del('feed_all_page1');
    newsCache.del('trending');

    if (status === 'live' && req.io) req.io.emit('new_article', updatedArticle);

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

    res.json(updatedArticle);
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
    res.json(updatedArticle);
  } catch (err) {
    res.status(400).json({ message: 'Error updating featured status', error: err.message });
  }
});

// DELETE /api/news/:id
router.delete('/:id', authMiddleware, checkRole, async (req, res) => {
  try {
    const article = await NewsArticle.findByIdAndDelete(req.params.id);
    await NewsAuditLog.create({ adminId: req.user.id, action: 'delete', targetArticleId: req.params.id });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    
    await AdminActionLog.create({
      adminId: req.user.id || req.user.id,
      actionType: 'news_delete',
      targetId: req.params.id,
      reason: 'Deleted article'
    });
    
    newsCache.del('feed_all_page1');
    newsCache.del('trending');

    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting article', error: err.message });
  }
});



// POST /api/news/collections/:id/collaborators
router.post('/collections/:id/collaborators', authMiddleware, async (req, res) => {
  try {
    const { email } = req.body;
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: 'User not found' });
    
    const collection = await NewsCollection.findOne({ _id: req.params.id, userId: req.user.id });
    if (!collection) return res.status(404).json({ message: 'Collection not found or unauthorized' });
    
    if (!collection.collaborators.includes(userToAdd._id)) {
      collection.collaborators.push(userToAdd._id);
      await collection.save();
    }
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/news/collections/:id/collaborators/:userId
router.delete('/collections/:id/collaborators/:userId', authMiddleware, async (req, res) => {
  try {
    const collection = await NewsCollection.findOne({ _id: req.params.id, userId: req.user.id });
    if (!collection) return res.status(404).json({ message: 'Collection not found or unauthorized' });
    
    collection.collaborators = collection.collaborators.filter(c => c.toString() !== req.params.userId);
    await collection.save();
    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/collections
router.get('/collections', authMiddleware, async (req, res) => {
  try {
    const collections = await NewsCollection.find({ $or: [{ userId: req.user.id }, { collaborators: req.user.id }] }).sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching collections', error: err.message });
  }
});


// GET /api/news/collections/:id/shared
router.get('/collections/:id/shared', async (req, res) => {
  try {
    const collection = await NewsCollection.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    
    const bookmarks = await NewsBookmark.find({ collectionId: collection._id })
      .populate('articleId')
      .sort({ savedAt: -1 });
      
    res.json({
      collection: { name: collection.name, description: collection.description },
      articles: bookmarks.map(b => b.articleId).filter(Boolean)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching shared collection', error: err.message });
  }
});

// POST /api/news/collections
router.post('/collections', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Collection name required' });
    const collection = new NewsCollection({ userId: req.user.id, name });
    await collection.save();
    res.status(201).json(collection);
  } catch (err) {
    res.status(500).json({ message: 'Error creating collection', error: err.message });
  }
});

// DELETE /api/news/collections/:id
router.delete('/collections/:id', authMiddleware, async (req, res) => {
  try {
    await NewsCollection.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    // Move bookmarks back to uncategorized
    await NewsBookmark.updateMany({ collectionId: req.params.id }, { collectionId: null });
    res.json({ message: 'Collection deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting collection', error: err.message });
  }
});


// GET /api/news/:id/comments
router.get('/:id/comments', async (req, res) => {
  try {
    const { sort = 'top' } = req.query;
    const sortObj = sort === 'newest' ? { createdAt: -1 } : { upvotes: -1, createdAt: -1 };
    
    const comments = await NewsComment.find({ articleId: req.params.id, status: 'live' })
      .sort(sortObj)
      .populate('userId', 'username avatarUrl')
      .lean();
      
    // Reconstruct tree (1-level deep)
    const parents = comments.filter(c => !c.parentCommentId);
    const children = comments.filter(c => c.parentCommentId);
    
    parents.forEach(p => {
      p.replies = children.filter(c => c.parentCommentId.toString() === p._id.toString());
    });
    
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching comments', error: err.message });
  }
});

// POST /api/news/:id/comments
router.post('/:id/comments', authMiddleware, actionRateLimiter, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body;
    if (!text || text.trim().length === 0) return res.status(400).json({ message: 'Text required' });
    
    const modResult = await assessModeration(text);
    const comment = new NewsComment({
      aiModerationScore: modResult,
      articleId: req.params.id,
      userId: req.user.id,
      text: text.trim(),
      parentCommentId: parentCommentId || null
    });
    
    await comment.save();
    await comment.populate('userId', 'username avatarUrl');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Error posting comment', error: err.message });
  }
});

// PUT /api/news/comments/:id/vote
router.put('/comments/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'upvote' or 'downvote'
    const comment = await NewsComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    const userIdStr = req.user.id.toString();
    const hasUpvoted = comment.upvotedBy.some(id => id.toString() === userIdStr);
    const hasDownvoted = comment.downvotedBy.some(id => id.toString() === userIdStr);
    
    if (action === 'upvote') {
      if (hasUpvoted) {
        comment.upvotedBy = comment.upvotedBy.filter(id => id.toString() !== userIdStr);
        comment.upvotes--;
      } else {
        comment.upvotedBy.push(req.user.id);
        comment.upvotes++;
        if (hasDownvoted) {
          comment.downvotedBy = comment.downvotedBy.filter(id => id.toString() !== userIdStr);
          comment.downvotes--;
        }
      }
    } else if (action === 'downvote') {
      if (hasDownvoted) {
        comment.downvotedBy = comment.downvotedBy.filter(id => id.toString() !== userIdStr);
        comment.downvotes--;
      } else {
        comment.downvotedBy.push(req.user.id);
        comment.downvotes++;
        if (hasUpvoted) {
          comment.upvotedBy = comment.upvotedBy.filter(id => id.toString() !== userIdStr);
          comment.upvotes--;
        }
      }
    }
    
    await comment.save();
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Error voting', error: err.message });
  }
});


// POST /api/news/comments/:id/report
router.post('/comments/:id/report', authMiddleware, actionRateLimiter, async (req, res) => {
  try {
    const { reason } = req.body;
    const comment = await NewsComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    const report = new NewsReport({
      commentId: comment._id,
      articleId: comment.articleId,
      targetType: 'NewsComment',
      reportedBy: req.user.id || req.user.id,
      reason: reason || 'other'
    });
    await report.save();
    res.status(201).json({ message: 'Comment reported' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/news/onboarding-complete
router.post('/onboarding-complete', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.hasCompletedNewsOnboarding = true;
    
    // Also save their preferences if provided
    if (req.body.followedCategories || req.body.followedTags) {
      if (req.body.followedCategories) user.newsPreferences.followedCategories = req.body.followedCategories;
      if (req.body.followedTags) user.newsPreferences.followedTags = req.body.followedTags;
    }
    
    await user.save();
    res.json({ message: 'Onboarding complete', user: { hasCompletedNewsOnboarding: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
