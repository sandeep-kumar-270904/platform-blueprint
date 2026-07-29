const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const CreatorContent = require('../models/CreatorContent');
const CreatorAnalyticsStat = require('../models/CreatorAnalyticsStat');
const CreatorReviewRequest = require('../models/CreatorReviewRequest');
const CommunityPost = require('../models/CommunityPost');
const PlacementResource = require('../models/PlacementResource');
const Event = require('../models/Event');
const User = require('../models/User');
const UserFollow = require('../models/UserFollow');
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// GET /api/creators/content - Public feed of published content
router.get('/content', async (req, res) => {
  try {
    const { type, search, sort, tag } = req.query;
    const query = { status: 'published' };
    const validTypes = ['article', 'video', 'project', 'resource'];
    if (type && type !== 'all' && validTypes.includes(type)) {
      query.type = type;
    }
    if (tag && tag !== 'all' && typeof tag === 'string' && tag.trim()) {
      query.tags = { $regex: new RegExp(`^${tag.trim()}$`, 'i') };
    }
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'viewed') sortObj = { views: -1, createdAt: -1 };
    else if (sort === 'liked') sortObj = { likes: -1, createdAt: -1 };

    const items = await CreatorContent.find(query)
      .sort(sortObj)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
    res.json(items);
  } catch (err) {
    console.error('Server error fetching feed:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// GET /api/creators/content/my - Logged-in user's content (both draft and published)
router.get('/content/my', authMiddleware, async (req, res) => {
  try {
    const { type, search, sort, tag } = req.query;
    const query = { userId: req.user.id };
    const validTypes = ['article', 'video', 'project', 'resource'];
    if (type && type !== 'all' && validTypes.includes(type)) {
      query.type = type;
    }
    if (tag && tag !== 'all' && typeof tag === 'string' && tag.trim()) {
      query.tags = { $regex: new RegExp(`^${tag.trim()}$`, 'i') };
    }
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'viewed') sortObj = { views: -1, createdAt: -1 };
    else if (sort === 'liked') sortObj = { likes: -1, createdAt: -1 };

    const items = await CreatorContent.find(query)
      .sort(sortObj)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
    res.json(items);
  } catch (err) {
    console.error('Server error fetching my content:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// POST /api/creators/content - Create new content piece

// GET /api/creators/analytics - Phase 9
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const posts = await CreatorContent.find({ userId, status: 'published' }).lean();
    
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    
    posts.forEach(p => {
      totalViews += (p.views || 0);
      totalLikes += (p.likes || 0);
      totalComments += (p.commentsCount || 0);
    });
    
    // Fetch stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const stats = await CreatorAnalyticsStat.find({
      userId,
      date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }
    }).lean();
    
    // Group by date
    const statsByDate = {};
    stats.forEach(stat => {
      if (!statsByDate[stat.date]) {
        statsByDate[stat.date] = { views: 0, likes: 0, comments: 0 };
      }
      statsByDate[stat.date].views += stat.views || 0;
      statsByDate[stat.date].likes += stat.likes || 0;
      statsByDate[stat.date].comments += stat.comments || 0;
    });

    const timeseries = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayStats = statsByDate[dateStr] || { views: 0, likes: 0, comments: 0 };
      timeseries.push({
        date: dateStr,
        views: dayStats.views,
        likes: dayStats.likes
      });
    }

    const topPerforming = [...posts]
      .sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2))
      .slice(0, 3)
      .map(p => ({ id: p._id, title: p.title, views: p.views, likes: p.likes, type: p.type }));

    const tagCount = {};
    posts.forEach(p => {
      (p.tags || []).forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + (p.views || 0);
      });
    });
    const audienceBreakdown = Object.keys(tagCount)
      .map(tag => ({ name: tag, value: tagCount[tag] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
    const typeCount = {};
    posts.forEach(p => {
      typeCount[p.type] = (typeCount[p.type] || 0) + (p.views || 0);
    });
    const typeBreakdown = Object.keys(typeCount)
      .map(type => ({ name: type, value: typeCount[type] }))
      .sort((a, b) => b.value - a.value);

    res.json({
      totals: { views: totalViews, likes: totalLikes, comments: totalComments },
      timeseries,
      topPerforming,
      audienceBreakdown: audienceBreakdown.length > 0 ? audienceBreakdown : typeBreakdown
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
    


// POST /api/creators/content/check-similarity
router.post('/content/check-similarity', authMiddleware, async (req, res) => {
  try {
    const { title = '', body = '' } = req.body;
    if (!title && !body) return res.json({ isSimilar: false, score: 0 });

    const posts = await CreatorContent.find({ userId: req.user.id, status: 'published' }).sort({ createdAt: -1 }).limit(100).select('title body').lean();
    if (posts.length === 0) return res.json({ isSimilar: false, score: 0 });

    const normalize = str => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split('\s+');
    const newWords = new Set(normalize(title + ' ' + body));

    let maxScore = 0;
    let similarContentId = null;

    for (const post of posts) {
      const existingWords = new Set(normalize(post.title + ' ' + post.body));
      const intersection = new Set([...newWords].filter(x => existingWords.has(x)));
      const union = new Set([...newWords, ...existingWords]);
      
      const score = union.size === 0 ? 0 : intersection.size / union.size;
      if (score > maxScore) {
        maxScore = score;
        similarContentId = post._id;
      }
    }

    res.json({
      isSimilar: maxScore > 0.8,
      score: Math.round(maxScore * 100),
      similarContentId
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});
router.post('/content', authMiddleware, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid upload payload' });
    }
    const { title, type, description, body, thumbnail, mediaUrl, status, tags } = req.body;
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Title is required and must be a text string', field: 'title' });
    }
    if (!body || typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ message: 'Content body/media is required and must be a text string', field: 'body' });
    }

    // Check for rapid duplicate submission (within last 15 seconds)
    const recentDuplicate = await CreatorContent.findOne({
      userId: req.user.id,
      title: title.trim(),
      body: body.trim(),
      createdAt: { $gte: new Date(Date.now() - 15 * 1000) }
    });
    if (recentDuplicate) {
      return res.status(409).json({ message: 'Duplicate submission detected. Please wait a moment before submitting identical content.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const validTypes = ['article', 'video', 'project', 'resource'];
    const validStatuses = ['draft', 'published'];

    const newItem = new CreatorContent({
      userId: req.user.id,
      creatorName: user.name || 'Anonymous Creator',
      creatorAvatar: user.profilePicture || '',
      title: title.trim(),
      type: validTypes.includes(type) ? type : 'article',
      description: (description && typeof description === 'string') ? description.trim() : body.trim().substring(0, 150),
      body: body.trim(),
      thumbnail: (thumbnail && typeof thumbnail === 'string') ? thumbnail : '✨',
      mediaUrl: (mediaUrl && typeof mediaUrl === 'string') ? mediaUrl.trim() : '',
      status: finalStatus,
      lastSavedAt: Date.now(),
      tags: Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [])
    });

    await newItem.save();

    if (finalStatus === 'in_review' && Array.isArray(req.body.reviewers) && req.body.reviewers.length > 0) {
      for (const reviewerId of req.body.reviewers) {
        await CreatorReviewRequest.findOneAndUpdate(
          { contentId: newItem._id, reviewerId },
          { $set: { creatorId: req.user.id, status: 'pending' } },
          { upsert: true }
        );
      }
    }

    const populated = await CreatorContent.findById(newItem._id).populate('userId', 'name email profilePicture');
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error creating content:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// GET /api/creators/content/:id - Fetch single content for shared links
router.get('/content/:id', async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
    
    if (!item) {
      return res.status(404).json({ message: 'Content not found' });
    }
    
    // Never expose drafts or under-review content via shared links
    if (item.status !== 'published') {
      return res.status(404).json({ message: 'Content is unavailable' });
    }
    
    res.json(item);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Content not found' });
    }
    console.error('Error fetching content detail:', err.message);
    res.status(500).json({ message: 'Server error fetching content detail' });
  }
});


// POST /api/creators/content/:id/report
router.post('/content/:id/report', authMiddleware, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Content not found' });

    if (item.reportedBy.includes(req.user.id)) {
      return res.status(400).json({ message: 'You have already reported this content' });
    }

    item.reportedBy.push(req.user.id);
    item.reportCount = (item.reportCount || 0) + 1;

    // Shift to under_review if threshold met
    if (item.reportCount >= 5 && item.moderationStatus === 'normal') {
      item.moderationStatus = 'under_review';
    }

    await item.save();
    res.json({ message: 'Content reported successfully', reportCount: item.reportCount, moderationStatus: item.moderationStatus });
  } catch (err) {
    console.error('Error reporting content:', err.message);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

// PUT /api/creators/content/:id - Update content piece
router.put('/content/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid update payload' });
    }
    const { title, type, description, body, thumbnail, mediaUrl, status, tags } = req.body;
    const item = await CreatorContent.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Content not found' });
    }
    if (item.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to edit this content' });
    }
    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ message: 'Title cannot be empty', field: 'title' });
      item.title = title.trim();
    }
    if (body !== undefined) {
      if (typeof body !== 'string' || !body.trim()) return res.status(400).json({ message: 'Content body cannot be empty', field: 'body' });
      item.body = body.trim();
    }
    const validTypes = ['article', 'video', 'project', 'resource'];
    const validStatuses = ['draft', 'published'];
    if (type !== undefined && validTypes.includes(type)) item.type = type;
    if (description !== undefined && typeof description === 'string') item.description = description.trim();
    if (thumbnail !== undefined && typeof thumbnail === 'string') item.thumbnail = thumbnail;
    if (mediaUrl !== undefined && typeof mediaUrl === 'string') item.mediaUrl = mediaUrl.trim();
    if (status !== undefined && validStatuses.includes(status)) item.status = status;
    if (tags !== undefined) {
      item.tags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }

    await item.save();
    const populated = await CreatorContent.findById(item._id).populate('userId', 'name email profilePicture');
    res.json(populated);
  } catch (err) {
    console.error('Error updating content:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// DELETE /api/creators/content/:id - Delete content piece
// DELETE /api/creators/content/:id
router.delete('/content/:id', authMiddleware, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Content not found' });
    }
    if (item.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this content' });
    }
    
    // Sync cross-posting deletion
    if (item.communityPostId) {
      await CommunityPost.findByIdAndUpdate(item.communityPostId, {
        $set: { content: "⚠️ [Original content no longer available]" }
      });
    }

    // Clean up review requests and stats
    await CreatorReviewRequest.deleteMany({ contentId: item._id });
    await CreatorAnalyticsStat.deleteMany({ contentId: item._id });

    await CreatorContent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Content deleted successfully', id: req.params.id });
  } catch (err) {
    console.error('Error deleting content:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// POST /api/creators/portfolio/export
router.post('/portfolio/export', authMiddleware, async (req, res) => {
  try {
    const { contentIds } = req.body;
    if (!Array.isArray(contentIds) || contentIds.length === 0) {
      return res.status(400).json({ message: 'No content IDs provided' });
    }
    const items = await CreatorContent.find({
      _id: { $in: contentIds },
      userId: req.user.id,
      status: 'published'
    }).select('title description type views likes commentsCount tags createdAt').lean();
    
    res.json(items);
  } catch (err) {
    console.error('Error exporting portfolio:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
});

// POST /api/creators/content/:id/cross-post
router.post('/content/:id/cross-post', authMiddleware, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id);
    if (!item || item.status !== 'published') {
      return res.status(404).json({ message: 'Content not found or not published' });
    }
    if (item.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    if (item.communityPostId) {
      return res.status(400).json({ message: 'Content already cross-posted' });
    }
    
    const newPost = new CommunityPost({
      author: req.user.id,
      content: `Discussing my recent ${item.type}: **${item.title}**\n\n${item.description}\n\n[View Original Content](/creators?contentId=${item._id})`,
      category: 'Discussion'
    });
    await newPost.save();
    
    item.communityPostId = newPost._id;
    await item.save();
    
    res.json({ message: 'Cross-posted successfully', communityPostId: newPost._id });
  } catch (err) {
    console.error('Error cross-posting:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
});

// POST /api/creators/content/:id/review-comments
router.post('/content/:id/review-comments', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text required' });
    
    const request = await CreatorReviewRequest.findOne({ contentId: req.params.id, reviewerId: req.user.id });
    if (!request) return res.status(403).json({ message: 'You are not an assigned reviewer for this content' });
    
    request.comments.push({ text: text.trim(), createdAt: new Date() });
    request.status = 'reviewed';
    await request.save();
    
    res.json(request);
  } catch (err) {
    console.error('Error adding review comment:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end.' });
  }
});

// POST /api/creators/content/:id/like - Toggle like
router.post('/content/:id/like', authMiddleware, async (req, res) => {
  try {
    const likeKey = `${req.user.id}_${req.params.id}`;
    const now = Date.now();
    if (recentLikeCache.has(likeKey) && (now - recentLikeCache.get(likeKey) < 1500)) {
      const item = await CreatorContent.findById(req.params.id);
      const isLiked = item ? item.likedBy.includes(req.user.id) : false;
      return res.json({ likes: item ? item.likes : 0, isLiked, rateLimited: true });
    }
    recentLikeCache.set(likeKey, now);
    if (recentLikeCache.size > 5000) recentLikeCache.clear();

    const item = await CreatorContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Content not found' });

    const userId = req.user.id;
    const index = item.likedBy.indexOf(userId);
    if (index === -1) {
      item.likedBy.push(userId);
      item.likes += 1;
    } else {
      item.likedBy.splice(index, 1);
      item.likes = Math.max(0, item.likes - 1);
    }
    await item.save();
    res.json({ likes: item.likes, isLiked: index === -1 });
  } catch (err) {
    console.error('Error toggling like:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// POST /api/creators/content/:id/view - Increment view count
router.post('/content/:id/view', async (req, res) => {
  try {
    const item = await CreatorContent.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ views: item.views });
  } catch (err) {
    console.error('Error incrementing views:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// POST /api/creators/content/:id/comment - Add a comment
router.post('/content/:id/comment', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const item = await CreatorContent.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Content piece not found' });
    }
    const user = await User.findById(req.user.id);
    const newComment = {
      userId: req.user.id,
      authorName: user ? (user.name || 'Anonymous Creator') : 'Anonymous Creator',
      authorAvatar: user ? (user.profilePicture || '') : '',
      text: text.trim(),
      createdAt: new Date()
    };
    item.comments.push(newComment);
    item.commentsCount = item.comments.length;
    await item.save();
    const populated = await CreatorContent.findById(item._id)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
    res.json(populated);
  } catch (err) {
    console.error('Server error adding comment:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// POST /api/creators/content/seed - Generate realistic demo feed if empty
router.post('/content/seed', authMiddleware, async (req, res) => {
  try {
    const count = await CreatorContent.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Feed already has content', count });
    }
    const user = await User.findById(req.user.id);
    const demoItems = [
      {
        userId: req.user.id,
        creatorName: user?.name || 'Alex Chen',
        creatorAvatar: user?.profilePicture || '',
        title: 'Complete Guide to Mastering System Design Interviews in 2026',
        type: 'article',
        description: 'A comprehensive roadmap covering load balancing, distributed caching, database sharding, and real-time streaming architectures.',
        body: 'System design interviews require a deep understanding of scalability, availability, and consistency. In this guide, we break down how to design scalable systems like Twitter, Uber, and Netflix from scratch. Start with defining clear functional and non-functional requirements...',
        thumbnail: '🏗️',
        status: 'published',
        views: 1240,
        likes: 185,
        commentsCount: 24,
        tags: ['SystemDesign', 'InterviewPrep', 'Architecture']
      },
      {
        userId: req.user.id,
        creatorName: user?.name || 'Priya Sharma',
        creatorAvatar: user?.profilePicture || '',
        title: 'Building a Fullstack AI Assistant with React & Node.js (Video Course)',
        type: 'video',
        description: 'Watch step-by-step as we build a streaming LLM chatbot with custom plugins, vector search, and WebSocket real-time updates.',
        body: 'https://www.youtube.com/watch?v=demo_video_linkIn this video tutorial, we explore how to integrate OpenAI and Gemini APIs with a custom Node.js backend and a sleek TailwindCSS React frontend.',
        thumbnail: '🎥',
        status: 'published',
        views: 3420,
        likes: 492,
        commentsCount: 68,
        tags: ['AI', 'React', 'NodeJS', 'Fullstack']
      },
      {
        userId: req.user.id,
        creatorName: 'Marcus Vance',
        creatorAvatar: '',
        title: 'Open Source ATS Resume Analyzer & Score Booster (GitHub Project)',
        type: 'project',
        description: 'An open-source NLP tool that checks your resume against job descriptions and provides actionable keyword recommendations.',
        body: 'Check out the repository on GitHub! Built using Python, FastAPI, and React. Contributions and pull requests are welcome from fellow students and developers looking to improve their open-source portfolio.',
        thumbnail: '💻',
        status: 'published',
        views: 890,
        likes: 134,
        commentsCount: 15,
        tags: ['OpenSource', 'Resume', 'ATS', 'Python']
      },
      {
        userId: req.user.id,
        creatorName: 'Elena Rostova',
        creatorAvatar: '',
        title: 'Curated UI/UX Design System Checklist & Figma Starter Kit',
        type: 'resource',
        description: 'Free downloadable design tokens, accessible color palettes, typography scales, and responsive component layouts for students.',
        body: 'Download the Figma community file and start designing premium web applications faster. Includes dark mode guidelines, glassmorphism styles, and micro-animation specs.',
        thumbnail: '🎨',
        status: 'published',
        views: 2150,
        likes: 310,
        commentsCount: 42,
        tags: ['Design', 'UIUX', 'Figma', 'Frontend']
      }
    ];

    const created = await CreatorContent.insertMany(demoItems);
    res.status(201).json({ message: 'Seeded 4 demo creator content items!', items: created });
  } catch (err) {
    console.error('Error seeding demo content:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});

// GET /api/creators/quiz-analytics-overview
router.get('/quiz-analytics-overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const quizzes = await Quiz.find({ createdBy: userId });
    
    let totalQuizzes = quizzes.length;
    let totalAttempts = 0;
    let sumAverageScore = 0;
    
    let bestQuiz = null;
    let bestCompletionRate = -1;

    const quizList = [];

    for (const quiz of quizzes) {
      totalAttempts += (quiz.attemptCount || 0);
      sumAverageScore += (quiz.averageScore || 0);
      
      const completed = await QuizAttempt.countDocuments({ quiz: quiz._id, status: 'completed' });
      const total = await QuizAttempt.countDocuments({ quiz: quiz._id });
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      if (completionRate > bestCompletionRate && total > 0) {
        bestCompletionRate = completionRate;
        bestQuiz = {
          _id: quiz._id,
          title: quiz.title,
          completionRate
        };
      }
      
      quizList.push({
        _id: quiz._id,
        title: quiz.title,
        attemptCount: quiz.attemptCount,
        averageScore: quiz.averageScore,
        completionRate
      });
    }
    
    const overallAverageScore = totalQuizzes > 0 ? sumAverageScore / totalQuizzes : 0;

    res.json({
      totalQuizzes,
      totalAttempts,
      overallAverageScore,
      bestPerformingQuiz: bestQuiz,
      quizzes: quizList
    });
  } catch (err) {
    console.error('Server error:', err.message);
    res.status(500).json({ message: 'Something went wrong on our end. Please try again later.' });
  }
});


// ==========================================
// Phase 4: Creator Profiles & Recommendations
// ==========================================

// GET /api/creators/profile/:userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const creator = await User.findById(req.params.userId).select('name email profilePicture bio');
    if (!creator) return res.status(404).json({ message: 'Creator not found' });

    // Stats
    const totalContent = await CreatorContent.countDocuments({ userId: req.params.userId, status: 'published' });
    const contentStats = await CreatorContent.aggregate([
      { $match: { userId: req.params.userId, status: 'published' } },
      { $group: { _id: null, views: { $sum: '$views' }, likes: { $sum: '$likes' } } }
    ]);
    
    const totalViews = contentStats[0]?.views || 0;
    const totalLikes = contentStats[0]?.likes || 0;

    const followersCount = await UserFollow.countDocuments({ followed_id: req.params.userId });
    const followingCount = await UserFollow.countDocuments({ follower_id: req.params.userId });

    let isFollowing = false;
    let isMuted = false;

    // Check if the current user follows/mutes them (Optional Auth)
    // Note: since this is a public endpoint, we need to check if req.user exists
    // The authMiddleware might not be on this route, but we can verify manually from token
    const token = req.header('x-auth-token') || (req.header('Authorization') && req.header('Authorization').replace('Bearer ', ''));
    if (token) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded && decoded.user && decoded.user.id) {
          const follow = await UserFollow.findOne({ follower_id: decoded.user.id, followed_id: req.params.userId });
          isFollowing = !!follow;
          
          const currentUser = await User.findById(decoded.user.id);
          if (currentUser && currentUser.muted_users && currentUser.muted_users.includes(req.params.userId)) {
            isMuted = true;
          }
        }
      } catch (err) {
        // invalid token, ignore
      }
    }

    // Recent Content
    const recentContent = await CreatorContent.find({ userId: req.params.userId, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name profilePicture')
      .populate('comments.userId', 'name profilePicture');

    res.json({
      creator: {
        _id: creator._id,
        name: creator.name || 'Unknown Creator',
        avatar: creator.profilePicture,
        bio: creator.bio || '',
        followersCount,
        followingCount,
        isFollowing,
        isMuted
      },
      stats: { totalContent, totalViews, totalLikes },
      content: recentContent
    });

  } catch (err) {
    if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Creator not found' });
    console.error('Error fetching creator profile:', err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/creators/profile/:userId/follow
router.post('/profile/:userId/follow', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === req.params.userId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }
    
    // Check if user exists
    const creator = await User.findById(req.params.userId);
    if (!creator) return res.status(404).json({ message: 'Creator not found' });

    // Check existing follow
    const existing = await UserFollow.findOne({ follower_id: req.user.id, followed_id: req.params.userId });
    
    if (existing) {
      // Unfollow
      await UserFollow.deleteOne({ _id: existing._id });
      return res.json({ following: false });
    } else {
      // Follow
      const newFollow = new UserFollow({ follower_id: req.user.id, followed_id: req.params.userId });
      await newFollow.save();
      return res.json({ following: true });
    }
  } catch (err) {
    console.error('Error in follow toggle:', err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/creators/profile/:userId/mute (Phase 5)
router.post('/profile/:userId/mute', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetId = req.params.userId;
    
    if (!user.muted_users) user.muted_users = [];
    
    const index = user.muted_users.indexOf(targetId);
    let muted = false;
    if (index > -1) {
      user.muted_users.splice(index, 1);
    } else {
      user.muted_users.push(targetId);
      muted = true;
    }
    
    await user.save();
    res.json({ muted });
  } catch (err) {
    console.error('Error muting user:', err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/creators/recommendations
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    // Basic recommendation logic: fetch content from people they follow
    const follows = await UserFollow.find({ follower_id: req.user.id });
    const followedIds = follows.map(f => f.followed_id);

    let content = [];
    
    if (followedIds.length > 0) {
      content = await CreatorContent.find({ 
        userId: { $in: followedIds }, 
        status: 'published' 
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
    }
    
    // If less than 5 items, pad with most viewed overall
    if (content.length < 5) {
      const existingIds = content.map(c => c._id);
      const popular = await CreatorContent.find({
        _id: { $nin: existingIds },
        status: 'published',
        userId: { $ne: req.user.id }
      })
      .sort({ views: -1 })
      .limit(10 - content.length)
      .populate('userId', 'name email profilePicture')
      .populate('comments.userId', 'name profilePicture');
      
      content = [...content, ...popular];
    }
    
    res.json(content);
  } catch (err) {
    console.error('Error fetching recommendations:', err.message);
    res.status(500).send('Server error');
  }
});

// ==========================================
// Phase 6: Admin View
// ==========================================

// GET /api/creators/admin/content
router.get('/admin/content', authMiddleware, async (req, res) => {
  try {
    // In a real app, verify admin role. Here we assume the frontend admin portal uses this.
    const items = await CreatorContent.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email profilePicture');
    res.json(items);
  } catch (err) {
    console.error('Error fetching admin content:', err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/creators/admin/content/:id/action
router.post('/admin/content/:id/action', authMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'suspend', 'delete'
    const item = await CreatorContent.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    
    if (action === 'approve') {
      item.moderationStatus = 'normal';
      item.reportCount = 0;
      item.reportedBy = [];
    } else if (action === 'suspend') {
      item.status = 'draft';
      item.moderationStatus = 'actioned';
    } else if (action === 'delete') {
      await CreatorContent.deleteOne({ _id: item._id });
      return res.json({ message: 'Content deleted successfully' });
    }
    
    await item.save();
    res.json(item);
  } catch (err) {
    console.error('Error in admin action:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

