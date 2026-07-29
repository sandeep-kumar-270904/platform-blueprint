const fs = require('fs');
const path = require('path');

const creatorsRoutePath = path.join(__dirname, '../backend/routes/creators.js');
let code = fs.readFileSync(creatorsRoutePath, 'utf8');

// 1. Add imports at top
if (!code.includes("const CreatorAnalyticsStat = require('../models/CreatorAnalyticsStat');")) {
  code = code.replace(
    "const CreatorContent = require('../models/CreatorContent');",
    "const CreatorContent = require('../models/CreatorContent');\nconst CreatorAnalyticsStat = require('../models/CreatorAnalyticsStat');\nconst CreatorReviewRequest = require('../models/CreatorReviewRequest');"
  );
}

// 2. Add incrementAnalytics helper
if (!code.includes("const incrementAnalytics = async")) {
  const helperCode = `
const incrementAnalytics = async (contentId, userId, field) => {
  try {
    const date = new Date().toISOString().split('T')[0];
    await CreatorAnalyticsStat.findOneAndUpdate(
      { contentId, date },
      { $set: { userId }, $inc: { [field]: 1 } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error incrementing analytics:', err.message);
  }
};
`;
  code = code.replace("const REPORT_THRESHOLD = 2;", "const REPORT_THRESHOLD = 2;" + helperCode);
}

// 3. Update GET /analytics
const getAnalyticsRegex = /\/\/ GET \/api\/creators\/analytics - Phase 9[\s\S]*?\}\);/m;
const newGetAnalyticsCode = `// GET /api/creators/analytics - Phase 9
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
});`;
code = code.replace(getAnalyticsRegex, newGetAnalyticsCode);

// 4. Update check-similarity
code = code.replace(
  "const posts = await CreatorContent.find({ userId: req.user.id, status: 'published' }).select('title body').lean();",
  "const posts = await CreatorContent.find({ userId: req.user.id, status: 'published' }).sort({ createdAt: -1 }).limit(100).select('title body').lean();"
);

// 5. Update POST /content for CreatorReviewRequest
const syncReviewRequestsPost = `
    if (finalStatus === 'in_review' && Array.isArray(req.body.reviewers) && req.body.reviewers.length > 0) {
      for (const reviewerId of req.body.reviewers) {
        await CreatorReviewRequest.findOneAndUpdate(
          { contentId: newItem._id, reviewerId },
          { $set: { creatorId: req.user.id, status: 'pending' } },
          { upsert: true }
        );
      }
    }
`;
code = code.replace(
  "await newItem.save();",
  "await newItem.save();\n" + syncReviewRequestsPost
);

const syncReviewRequestsPut = `
    if (item.status === 'in_review' && Array.isArray(item.reviewers)) {
      for (const reviewerId of item.reviewers) {
        await CreatorReviewRequest.findOneAndUpdate(
          { contentId: item._id, reviewerId },
          { $set: { creatorId: req.user.id, status: 'pending' } },
          { upsert: true }
        );
      }
    }
`;
code = code.replace(
  "item.lastSavedAt = Date.now();\n    await item.save();",
  "item.lastSavedAt = Date.now();\n    await item.save();\n" + syncReviewRequestsPut
);
code = code.replace(
  "existingDraft.lastSavedAt = Date.now();\n        await existingDraft.save();",
  "existingDraft.lastSavedAt = Date.now();\n        await existingDraft.save();\n" + syncReviewRequestsPut.replace(/item/g, 'existingDraft')
);

// 6. Update Analytics tracking
// View
code = code.replace(
  "if (saveNeeded) {\n      await item.save();\n    }",
  "if (saveNeeded) {\n      await item.save();\n      await incrementAnalytics(item._id, item.userId, 'views');\n    }"
);

// Like
code = code.replace(
  "item.likes += 1;\n      // Send notification if liking someone else's content",
  "item.likes += 1;\n      await incrementAnalytics(item._id, item.userId, 'likes');\n      // Send notification if liking someone else's content"
);

// Comment
code = code.replace(
  "item.commentsCount = item.comments.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0);\n    await item.save();",
  "item.commentsCount = item.comments.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0);\n    await item.save();\n    await incrementAnalytics(item._id, item.userId, 'comments');"
);

// 7. Add POST /portfolio/export and POST /content/:id/cross-post and DELETE /content/:id community fallback
const deleteRegex = /router\.delete\('\/content\/:id'[\s\S]*?\}\);/m;
const newDeleteCode = `// DELETE /api/creators/content/:id
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
      content: \`Discussing my recent \${item.type}: **\${item.title}**\\n\\n\${item.description}\\n\\n[View Original Content](/creators?contentId=\${item._id})\`,
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
`;
code = code.replace(deleteRegex, newDeleteCode);

fs.writeFileSync(creatorsRoutePath, code);
console.log('Successfully patched backend/routes/creators.js for Phase 9 real features');
