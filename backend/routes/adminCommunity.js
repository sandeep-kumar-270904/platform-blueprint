const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const CommunityReport = require('../models/CommunityReport');
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.adminRole !== 'moderator')) {
      return res.status(403).json({ message: 'Access denied. Admin or moderator only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/admin/community/audit
// Returns all posts (including anonymous) with real user_id populated
router.get('/audit', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('user_id', 'username full_name email')
      .lean();
    
    const total = await CommunityPost.countDocuments(query);

    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'viewed_anonymous_authors',
      entity_type: 'CommunityPost',
      entity_id: posts.length > 0 ? posts[0]._id : new require('mongoose').Types.ObjectId(),
      metadata: { page, limit, count: posts.length }
    });

    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/community/posts
router.get('/posts', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('user_id', 'username full_name email')
      .lean();
    
    const total = await CommunityPost.countDocuments(query);

    res.json({ posts, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/community/comments
router.get('/comments', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const comments = await CommunityComment.find({})
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();
      
    // Populate user details manually
    const userIds = [...new Set(comments.map(c => c.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'username full_name email').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});
    
    const populatedComments = comments.map(c => ({
      ...c,
      author: userMap[c.user_id.toString()] || null
    }));

    const total = await CommunityComment.countDocuments({});

    res.json({ comments: populatedComments, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/community/reports
router.get('/reports', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await CommunityReport.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('post_id')
      .populate('reporting_user_id', 'username full_name email')
      .lean();

    const total = await CommunityReport.countDocuments(query);

    res.json({ reports, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/community/analytics
router.get('/analytics', authMiddleware, isAdmin, async (req, res) => {
  try {
    const totalPosts = await CommunityPost.countDocuments();
    const activePosts = await CommunityPost.countDocuments({ status: { $ne: 'deleted' } });
    const totalComments = await CommunityComment.countDocuments();
    const totalReports = await CommunityReport.countDocuments();
    const pendingReports = await CommunityReport.countDocuments({ status: 'pending' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const postsToday = await CommunityPost.countDocuments({ created_at: { $gte: today } });
    
    res.json({
      totalPosts,
      activePosts,
      postsToday,
      totalComments,
      totalReports,
      pendingReports
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/community/users
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    // Just returning standard users sorted by creation date for basic user list
    const users = await User.find({}, 'username full_name email role created_at muted_users blocked_users muted_posts')
      .sort({ created_at: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();
      
    const total = await User.countDocuments({});
    
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
