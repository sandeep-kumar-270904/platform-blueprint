const IdeaReport = require('../models/IdeaReport');
const User = require('../models/User');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const notificationService = require('../services/notificationService');

// Create a report against any entity
exports.createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;
    
    // Basic validation
    if (!['Idea', 'IdeaComment', 'BrainstormThought', 'CirclePost', 'User'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    const report = new IdeaReport({
      targetType,
      targetId,
      reporter: req.user.id,
      reason
    });
    await report.save();
    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

// Admin: View all reports
exports.getReports = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const reports = await IdeaReport.find(filter)
      .sort({ created_at: -1 })
      .skip(skip).limit(limit)
      .populate('reporter', 'username avatar_url');
    
    const total = await IdeaReport.countDocuments(filter);
    res.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Take action on a report (Delete content / Suspend user)
exports.actionReport = async (req, res) => {
  try {
    const report = await IdeaReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const { action, banUser, deleteContent } = req.body; // action can be 'actioned' or 'dismissed'
    
    // Process delete content
    if (deleteContent && action === 'actioned') {
      const Model = mongoose.model(report.targetType);
      if (Model) {
        const target = await Model.findById(report.targetId);
        if (target) {
          await target.deleteOne(); // Trigger pre hooks
          logger.info(`Admin ${req.user.id} deleted ${report.targetType} ${report.targetId} due to report`);
        }
      }
    }

    // Process user ban
    if (banUser && req.body.targetUserId && action === 'actioned') {
      const targetUser = await User.findById(req.body.targetUserId);
      if (targetUser) {
        targetUser.banned = true;
        await targetUser.save();
        logger.info(`Admin ${req.user.id} suspended user ${targetUser._id} due to report`);
      }
    }

    report.status = action === 'dismissed' ? 'dismissed' : 'actioned';
    await report.save();
    
    // Notify the reporter
    await notificationService.createNotification({
      userId: report.reporter,
      type: 'report_updated',
      relatedContentId: report._id,
      message: `Your report on a ${report.targetType} has been ${report.status}.`
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
