const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const CreatorContent = require('../models/CreatorContent');
const CreatorReport = require('../models/CreatorReport');
const notificationService = require('../services/notificationService');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying admin privileges' });
  }
};

// GET /api/admin/creators/content - List all content across all creators with filters
router.get('/content', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, type, reportSort, minReports, maxReports, dateRange, startDate, endDate, q } = req.query;
    const query = {};

    // Status filter
    if (status && status !== 'all') {
      if (status === 'under_review') {
        query.moderationStatus = 'under_review';
      } else if (status === 'reported') {
        query.reportCount = { $gt: 0 };
      } else {
        query.status = status;
      }
    }

    // Type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    // Report count filter
    if (minReports !== undefined && !isNaN(parseInt(minReports))) {
      query.reportCount = query.reportCount || {};
      query.reportCount.$gte = parseInt(minReports);
    }
    if (maxReports !== undefined && !isNaN(parseInt(maxReports))) {
      query.reportCount = query.reportCount || {};
      query.reportCount.$lte = parseInt(maxReports);
    }

    // Date range filter
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        query.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (dateRange === '7d') {
        query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      } else if (dateRange === '30d') {
        query.createdAt = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }
    }
    if (startDate || endDate) {
      query.createdAt = query.createdAt || {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Search query filter
    if (q && typeof q === 'string' && q.trim()) {
      const searchTerm = q.trim();
      query.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 };
    if (reportSort === 'true' || status === 'reported' || status === 'under_review') {
      sortObj = { reportCount: -1, createdAt: -1 };
    }

    const items = await CreatorContent.find(query)
      .sort(sortObj)
      .populate('userId', 'name email profilePicture username');

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admin creators content', error: err.message });
  }
});

// GET /api/admin/creators/content/:id/detail - Fetch full detail including report history
router.get('/content/:id/detail', authMiddleware, isAdmin, async (req, res) => {
  try {
    const item = await CreatorContent.findById(req.params.id)
      .populate('userId', 'name email profilePicture username role creatorFlagged')
      .populate('comments.userId', 'name profilePicture username email');

    // Handle edge case: item deleted moments ago by creator
    if (!item) {
      const remainingReports = await CreatorReport.find({ targetId: req.params.id })
        .populate('reporterId', 'name email username profilePicture')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        content: null,
        alreadyDeleted: true,
        reportHistory: remainingReports,
        message: 'This content piece was recently deleted by the author.'
      });
    }

    // Gather all report IDs (for content piece and any of its comments)
    const commentIds = item.comments ? item.comments.map(c => c._id) : [];
    const targetIds = [item._id, ...commentIds];

    const reportHistory = await CreatorReport.find({ targetId: { $in: targetIds } })
      .populate('reporterId', 'name email username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      content: item,
      reportHistory,
      alreadyDeleted: false
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching creator content details and report history', error: err.message });
  }
});

// GET /api/admin/creators/reports - List all reports with reporter & target details
router.get('/reports', authMiddleware, isAdmin, async (req, res) => {
  try {
    const reports = await CreatorReport.find()
      .populate('reporterId', 'name email profilePicture username')
      .sort({ createdAt: -1 })
      .lean();

    // Attach target content details
    const targetIds = [...new Set(reports.map(r => r.targetId))];
    const contents = await CreatorContent.find({
      $or: [
        { _id: { $in: targetIds } },
        { 'comments._id': { $in: targetIds } }
      ]
    }).populate('userId', 'name email username').lean();

    const contentMap = new Map();
    const commentMap = new Map();

    contents.forEach(item => {
      contentMap.set(item._id.toString(), item);
      if (item.comments) {
        item.comments.forEach(c => {
          commentMap.set(c._id.toString(), { comment: c, parentContent: item });
        });
      }
    });

    const enriched = reports.map(r => {
      const targetIdStr = r.targetId.toString();
      let targetDetails = null;
      if (r.targetType === 'content' && contentMap.has(targetIdStr)) {
        const c = contentMap.get(targetIdStr);
        targetDetails = {
          title: c.title,
          snippet: c.description || c.body?.substring(0, 100),
          creatorName: c.creatorName || c.userId?.username || c.userId?.name || 'Unknown',
          creatorEmail: c.userId?.email,
          contentId: c._id,
          type: c.type,
          status: c.status,
          moderationStatus: c.moderationStatus,
          reportCount: c.reportCount
        };
      } else if (r.targetType === 'comment' && commentMap.has(targetIdStr)) {
        const { comment, parentContent } = commentMap.get(targetIdStr);
        targetDetails = {
          title: `Comment on "${parentContent.title}"`,
          snippet: comment.text,
          creatorName: comment.authorName || 'Unknown',
          contentId: parentContent._id,
          commentId: comment._id,
          type: 'comment',
          moderationStatus: comment.moderationStatus,
          reportCount: comment.reportCount
        };
      } else {
        targetDetails = {
          title: 'Target Deleted or Not Found',
          snippet: 'This item has already been removed by the author or moderation.',
          type: r.targetType,
          deleted: true
        };
      }
      return { ...r, targetDetails };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching creator reports', error: err.message });
  }
});

// POST /api/admin/creators/content/:id/moderate - Moderate content, comment, or warn/flag creator
router.post('/content/:id/moderate', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { action, reason, commentId, creatorId } = req.body;
    const item = await CreatorContent.findById(req.params.id);

    // Edge Case: Admin action on content that was deleted by creator moments earlier
    if (!item && action !== 'dismiss_reports' && action !== 'warn_creator' && action !== 'flag_creator') {
      // Clean up any lingering reports for this deleted item
      await CreatorReport.deleteMany({ targetId: req.params.id });
      return res.status(200).json({
        success: true,
        alreadyDeleted: true,
        message: 'Content was already deleted by the author. Lingering reports have been cleaned up.'
      });
    }

    // Edge Case: Concurrent admin actions (e.g., item already removed or status changed by another moderator)
    if (item && item.status === 'removed' && action === 'remove_content') {
      return res.status(200).json({
        success: true,
        alreadyRemoved: true,
        message: 'This content was already removed by another moderator.'
      });
    }

    const io = notificationService.getIo();

    if (action === 'remove_content') {
      const targetId = item._id;
      const targetUserId = item.userId;
      const title = item.title;

      // Update status immediately so it is excluded from Browse/My Content queries in the same cycle
      item.status = 'removed';
      item.moderationStatus = 'removed';
      await item.save();

      // Clean up report records for target
      await CreatorReport.updateMany({ targetId }, { status: 'actioned', actionTaken: 'removed' });

      // Notify creator
      if (targetUserId) {
        await notificationService.createNotification({
          userId: targetUserId,
          type: 'creator_warning',
          message: `⚠️ Your content "${title}" was removed by moderation: ${reason || 'Violation of community guidelines'}`,
          actionUrl: '/creators'
        });
      }

      // Real-time sync to update active clients
      if (io) {
        io.emit('creators:content_moderated', { contentId: targetId, action: 'removed' });
      }

      return res.json({ success: true, message: 'Content removed successfully and synced in real-time.' });
    } else if (action === 'remove_comment') {
      if (!commentId) return res.status(400).json({ message: 'commentId required for remove_comment' });
      const comment = item.comments.id(commentId);
      if (!comment) {
        // Edge Case: comment already deleted by author or another admin
        await CreatorReport.deleteMany({ targetId: commentId });
        return res.status(200).json({ success: true, message: 'Comment was already removed or deleted.' });
      }

      const authorId = comment.userId;
      const text = comment.text;

      item.comments.pull(commentId);
      item.commentsCount = Math.max(0, item.comments.length);
      await item.save();

      await CreatorReport.updateMany({ targetId: commentId }, { status: 'actioned', actionTaken: 'comment_removed' });

      if (authorId) {
        await notificationService.createNotification({
          userId: authorId,
          type: 'creator_warning',
          message: `⚠️ Your comment "${text.substring(0, 30)}..." was removed by moderation: ${reason || 'Violation of guidelines'}`,
          actionUrl: `/creators?contentId=${item._id}`
        });
      }

      if (io) {
        io.emit('creators:content_moderated', { contentId: item._id, commentId, action: 'comment_removed' });
      }

      return res.json({ success: true, message: 'Comment removed successfully.' });
    } else if (action === 'dismiss_reports') {
      if (commentId && item) {
        const comment = item.comments.id(commentId);
        if (comment) {
          if (comment.reportCount === 0 && comment.moderationStatus === 'normal') {
            return res.status(200).json({ success: true, message: 'Reports were already dismissed by another moderator.' });
          }
          comment.reportCount = 0;
          comment.reportedBy = [];
          comment.moderationStatus = 'normal';
          await item.save();
        }
        await CreatorReport.updateMany({ targetId: commentId }, { status: 'reviewed', actionTaken: 'dismissed' });
      } else if (item) {
        if (item.reportCount === 0 && item.moderationStatus === 'normal') {
          return res.status(200).json({ success: true, message: 'Reports were already dismissed by another moderator.' });
        }
        item.reportCount = 0;
        item.reportedBy = [];
        item.moderationStatus = 'normal';
        await item.save();
        await CreatorReport.updateMany({ targetId: item._id }, { status: 'reviewed', actionTaken: 'dismissed' });
      } else {
        await CreatorReport.updateMany({ targetId: req.params.id }, { status: 'reviewed', actionTaken: 'dismissed' });
      }

      if (io && item) {
        io.emit('creators:content_moderated', { contentId: item._id, action: 'dismissed' });
      }

      return res.json({ success: true, message: 'Reports dismissed and moderation status restored to normal.' });
    } else if (action === 'warn_creator' || action === 'flag_creator') {
      const targetUserId = creatorId || item?.userId;
      if (!targetUserId) return res.status(400).json({ message: 'Creator ID not found to warn or flag' });

      const warningText = action === 'flag_creator'
        ? `⚠️ Notice: Your creator account has been flagged for review: ${reason || 'Multiple community guideline violations.'}`
        : `⚠️ Official Warning from Moderation: ${reason || 'Please review our community guidelines regarding your uploads and comments.'}`;

      await notificationService.createNotification({
        userId: targetUserId,
        type: 'creator_warning',
        message: warningText,
        actionUrl: '/creators'
      });

      if (action === 'flag_creator') {
        await User.findByIdAndUpdate(targetUserId, { $set: { creatorFlagged: true, lastWarnedAt: new Date() } });
      }

      // Update report statuses to reviewed
      if (commentId) {
        await CreatorReport.updateMany({ targetId: commentId }, { status: 'reviewed', actionTaken: action });
      } else if (item) {
        await CreatorReport.updateMany({ targetId: item._id }, { status: 'reviewed', actionTaken: action });
      }

      return res.json({ success: true, message: action === 'flag_creator' ? 'Creator account flagged and warned.' : 'Official warning sent to creator.' });
    } else {
      return res.status(400).json({ message: 'Invalid moderation action' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error moderating creator content', error: err.message });
  }
});

module.exports = router;
