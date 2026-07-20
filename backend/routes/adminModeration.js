const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Report = require('../models/Report');
const IdeaReport = require('../models/IdeaReport');
const JobReport = require('../models/JobReport');
const QuizReport = require('../models/QuizReport');
const NewsReport = require('../models/NewsReport');
const Scholarship = require('../models/Scholarship');
const ScholarshipReview = require('../models/ScholarshipReview');
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
    const [general, ideas, jobs, quizzes, news, scholarships, scholarshipReviews] = await Promise.all([
      Report.find({ status: 'pending' }).populate('reported_by', 'full_name email').lean(),
      IdeaReport.find({ status: 'pending' }).populate('reporter', 'full_name email').populate('reportedBy', 'full_name email').lean(),
      JobReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean(),
      QuizReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean(),
      NewsReport.find({ status: 'pending' }).populate('reportedBy', 'full_name email').lean(),
      Scholarship.find({ $or: [{ 'reports.0': { $exists: true } }, { isScamFlagged: true }] }).populate('reports.userId', 'full_name email').lean(),
      ScholarshipReview.find({ 'reports.0': { $exists: true } }).populate('reports.userId', 'full_name email').lean()
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

    // Map embedded reports for scholarships
    scholarships.forEach(sch => {
      if (sch.isScamFlagged && (!sch.reports || sch.reports.length === 0)) {
        unified.push({
          _id: sch._id + '_scam',
          module: 'Scholarships',
          targetId: sch._id,
          targetType: 'Scholarship',
          reporter: { full_name: 'System / Pattern Match' },
          reason: 'Scam pattern flagged',
          details: 'Flagged by scam pattern detection.',
          createdAt: sch.updatedAt || new Date(),
          status: 'pending'
        });
      }
      (sch.reports || []).forEach((rep, i) => {
        unified.push({
          _id: sch._id + '_rep_' + i,
          module: 'Scholarships',
          targetId: sch._id,
          targetType: 'Scholarship',
          reporter: rep.userId,
          reason: rep.reason,
          details: rep.details,
          createdAt: rep.date,
          status: 'pending'
        });
      });
    });

    scholarshipReviews.forEach(rev => {
      (rev.reports || []).forEach((rep, i) => {
        unified.push({
          _id: rev._id + '_rep_' + i,
          module: 'ScholarshipReviews',
          targetId: rev._id,
          targetType: 'ScholarshipReview',
          reporter: rep.userId,
          reason: rep.reason,
          details: rep.details,
          createdAt: rep.date,
          status: 'pending'
        });
      });
    });

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
    if (module === 'Scholarships' || module === 'ScholarshipReviews') {
      const Model = module === 'Scholarships' ? Scholarship : ScholarshipReview;
      // Handle the custom composite IDs like id_scam or id_rep_0
      const realId = id.split('_')[0];
      const doc = await Model.findById(realId);
      if (!doc) return res.status(404).json({ message: 'Target not found' });

      if (action === 'dismiss') {
        if (module === 'Scholarships' && doc.isScamFlagged) {
          doc.isScamFlagged = false;
        }
        if (id.includes('_rep_')) {
          const index = parseInt(id.split('_rep_')[1]);
          if (!isNaN(index) && doc.reports && doc.reports.length > index) {
            doc.reports.splice(index, 1);
          }
        } else {
          doc.reports = [];
        }
      } else if (action === 'confirm_hide') {
        if (module === 'Scholarships') {
          doc.status = 'rejected';
        } else {
          doc.isHidden = true;
        }
      }

      await doc.save();
      await AdminActionLog.create({
        adminId: req.adminUser._id,
        actionType: `moderation_${action}`,
        targetId: realId,
        reason: adminNote
      });

      // Handle ban_author for scholarships if applicable
      if (action === 'ban_author') {
        const authorField = doc.author || doc.userId || doc.submittedBy;
        if (authorField) {
          await User.findByIdAndUpdate(authorField, { 
            banned: true, 
            banReason: adminNote || 'Banned via unified moderation',
            bannedAt: new Date()
          });
        }
      }
      return res.json({ message: `Report actioned: ${action}` });
    }

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
