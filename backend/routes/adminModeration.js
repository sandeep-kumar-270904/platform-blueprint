const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Report = require('../models/Report');
const IdeaReport = require('../models/IdeaReport');
const JobReport = require('../models/JobReport');
const QuizReport = require('../models/QuizReport');
const NewsReport = require('../models/NewsReport');
const notificationService = require('../services/notificationService');
const AdminActionLog = require('../models/AdminActionLog');

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

// GET /api/admin/moderation/unified
router.get('/unified', authMiddleware, isAdmin, async (req, res) => {
  try {
    const [general, ideas, jobs, quizzes, news] = await Promise.all([
      Report.find({ status: 'pending' }).populate('reported_by', 'full_name email').lean(),
      IdeaReport.find({ status: 'pending' }).populate('reporter', 'full_name email').populate('reportedBy', 'full_name email').lean(),
      JobReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean(),
      QuizReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean(),
      NewsReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean()
    ]);

    const normalize = (reports, module) => reports.map(r => ({
      _id: r._id,
      module,
      targetId: r.targetId || r.target_id,
      targetType: r.targetType || r.target_type,
      reporter: r.reporter || r.reportedBy || r.reported_by,
      reason: r.reason,
      details: r.details,
      createdAt: r.createdAt || r.created_at,
      status: r.status
    }));

    const unified = [
      ...normalize(general, 'General'),
      ...normalize(ideas, 'IdeaHub'),
      ...normalize(jobs, 'JobBoard'),
      ...normalize(quizzes, 'Quiz'),
      ...normalize(news, 'News')
    ];

    unified.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(unified);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching unified reports', error: error.message });
  }
});

// POST /api/admin/moderation/unified/:module/:id/action
router.post('/unified/:module/:id/action', authMiddleware, isAdmin, async (req, res) => {
  const { module, id } = req.params;
  const { action, adminNote } = req.body; // action: 'dismiss', 'confirm_hide', 'ban_author'

  try {
    let Model;
    switch (module) {
      case 'General': Model = Report; break;
      case 'IdeaHub': Model = IdeaReport; break;
      case 'JobBoard': Model = JobReport; break;
      case 'Quiz': Model = QuizReport; break;
      case 'News': Model = NewsReport; break;
      default: return res.status(400).json({ message: 'Unknown module' });
    }

    const report = await Model.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.status = action === 'dismiss' ? 'dismissed' : 'reviewed_actioned';
    report.adminNote = adminNote;
    await report.save();

    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType: `moderation_${action}`,
      targetId: id,
      reason: adminNote
    });

    if (action === 'ban_author') {
      const mongoose = require('mongoose');
      let targetDoc;
      let targetModelName = report.targetType || report.target_type;
      
      if (targetModelName === 'job') targetModelName = 'Job';
      if (targetModelName === 'idea') targetModelName = 'Idea';
      if (targetModelName === 'quiz') targetModelName = 'Quiz';
      if (targetModelName === 'note') targetModelName = 'Note';
      if (targetModelName === 'comment') targetModelName = 'NoteComment';
      if (targetModelName === 'ideacomment') targetModelName = 'IdeaComment';

      try {
        const TargetModel = mongoose.model(targetModelName);
        targetDoc = await TargetModel.findById(report.targetId || report.target_id);
        if (targetDoc) {
          const authorField = targetDoc.author || targetDoc.user_id || targetDoc.postedBy || targetDoc.owner;
          if (authorField) {
            await User.findByIdAndUpdate(authorField, { 
              banned: true, 
              banReason: adminNote || 'Banned via unified moderation',
              bannedAt: new Date()
            });
          }
        }
      } catch (e) {
        console.error("Could not ban author: ", e.message);
      }
    }

    res.json({ message: `Report actioned: ${action}` });
  } catch (error) {
    res.status(500).json({ message: 'Server error processing action', error: error.message });
  }
});

module.exports = router;
