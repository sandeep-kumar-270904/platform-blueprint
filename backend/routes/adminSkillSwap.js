const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const SkillSwapReport = require('../models/SkillSwapReport');
const SkillOffer = require('../models/SkillOffer');
const SkillSession = require('../models/SkillSession');
const AdminActionLog = require('../models/AdminActionLog');
const notificationService = require('../services/notificationService');

// Admin middleware
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/skill-swap/stats
router.get('/stats', authMiddleware, isAdmin, async (req, res) => {
  try {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    
    const [
      totalOffers,
      totalSessionsThisWeek,
      completedSessions,
      openReports
    ] = await Promise.all([
      SkillOffer.countDocuments(),
      SkillSession.countDocuments({ createdAt: { $gte: startOfWeek } }),
      SkillSession.countDocuments({ status: 'completed' }),
      SkillSwapReport.countDocuments({ status: 'open' })
    ]);

    const completionRate = totalSessionsThisWeek > 0 
      ? Math.round((completedSessions / totalSessionsThisWeek) * 100) 
      : 0;

    res.json({
      totalOffers,
      totalSessionsThisWeek,
      completionRate,
      openReports
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/skill-swap/reports
router.get('/reports', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, targetType, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const reports = await SkillSwapReport.find(query)
      .populate('reportedBy', 'name avatar email')
      .populate('targetId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await SkillSwapReport.countDocuments(query);

    res.json({
      reports,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/skill-swap/reports/:id
router.patch('/reports/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, resolutionNotes, trustFlag, targetUserId } = req.body;
    const report = await SkillSwapReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = status;
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.adminUser._id;
    report.resolvedAt = new Date();
    await report.save();

    if (trustFlag && targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (targetUser) {
        targetUser.skillSwapTrustFlag = trustFlag;
        await targetUser.save();
      }
    }

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/skill-swap/offers
router.get('/offers', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.skillName = { $regex: search, $options: 'i' };
    }

    const offers = await SkillOffer.find(query)
      .populate('user', 'name email skillSwapTrustFlag')
      .sort({ createdAt: -1 })
      .skip((page - 1) * safeLimit)
      .limit(safeLimit);

    const total = await SkillOffer.countDocuments(query);

    // Get report counts for these offers
    const offerIds = offers.map(o => o._id);
    const reportCounts = await SkillSwapReport.aggregate([
      { $match: { targetType: 'offer', targetId: { $in: offerIds } } },
      { $group: { _id: '$targetId', count: { $sum: 1 } } }
    ]);
    const reportCountMap = reportCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    const enrichedOffers = offers.map(o => {
      const obj = o.toObject();
      obj.reportCount = reportCountMap[o._id.toString()] || 0;
      return obj;
    });

    res.json({
      offers: enrichedOffers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/skill-swap/offers/:id/moderate
router.patch('/offers/:id/moderate', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { action, reason } = req.body; // 'deactivate' or 'reinstate'
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const offer = await SkillOffer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });

    offer.status = action === 'deactivate' ? 'suspended' : 'active';
    await offer.save();

    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType: `skill_swap_offer_${action}`,
      targetId: offer._id,
      reason
    });

    await notificationService.sendNotification({
      userId: offer.user,
      type: 'skill_swap_moderation',
      relatedContentId: offer._id,
      actorId: req.adminUser._id,
      message: `Your skill offer was ${action}d by an admin. Reason: ${reason}`
    });

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/skill-swap/users/:id
router.get('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('name email avatar skillSwapNoShowCount skillSwapTrustFlag');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const offers = await SkillOffer.find({ user: user._id });
    const sessions = await SkillSession.find({ participants: user._id })
      .populate('participants', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);
    const reportsAgainst = await SkillSwapReport.find({ 
      $or: [
        { targetType: 'user', targetId: user._id },
        { targetType: 'offer', targetId: { $in: offers.map(o => o._id) } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      user,
      offers,
      sessions,
      reportsAgainst
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
