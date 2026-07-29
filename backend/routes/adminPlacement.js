const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleAuth');

// Models
const DSAProblem = require('../models/DSAProblem');
const CompanyPrep = require('../models/CompanyPrep');
const OADefinition = require('../models/OADefinition');
const GDTopic = require('../models/GDTopic');
const InterviewExperience = require('../models/InterviewExperience');
const Report = require('../models/Report');
const ReferrerProfile = require('../models/ReferrerProfile');
const StudyGroup = require('../models/StudyGroup');
const GroupMessage = require('../models/GroupMessage');
const QAQuestion = require('../models/QAQuestion');
const QAAnswer = require('../models/QAAnswer');
const QAComment = require('../models/QAComment');
const AdminActionLog = require('../models/AdminActionLog');
const PlacementAnalyticsStat = require('../models/PlacementAnalyticsStat');

// Helper to log admin actions
const logAdminAction = async (adminId, actionType, targetId, reason = 'No reason provided') => {
  try {
    await AdminActionLog.create({ adminId, actionType, targetId, reason });
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

// All routes here require admin access
router.use(requireAuth, requireRole(['admin']));

// ==========================================
// 1. ANALYTICS (Cached via Cron)
// ==========================================
router.get('/stats', async (req, res) => {
  try {
    // Fetch the latest aggregated stat document instead of doing live heavy queries
    const latestStat = await PlacementAnalyticsStat.findOne().sort({ timestamp: -1 });
    if (!latestStat) {
      return res.json({ activeUsers: 0, dsaSolved: 0, mocksBooked: 0, avgReadinessScore: 0, anomaliesDetected: [] });
    }
    res.json(latestStat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching cached stats' });
  }
});

// ==========================================
// 2. CONTENT MANAGEMENT
// ==========================================

// DSA Problems
router.get('/dsa', async (req, res) => {
  try {
    const problems = await DSAProblem.find({ isActive: { $ne: false } }).sort({ created_at: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching DSA problems' });
  }
});

router.post('/dsa', async (req, res) => {
  try {
    if (!req.body.title || !req.body.difficulty) return res.status(400).json({ message: 'Title and difficulty required' });
    const problem = await DSAProblem.create(req.body);
    await logAdminAction(req.user._id, 'CREATE_DSA', problem._id, 'Created new DSA problem');
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: 'Error creating DSA problem' });
  }
});

router.put('/dsa/:id', async (req, res) => {
  try {
    const problem = await DSAProblem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (problem) await logAdminAction(req.user._id, 'UPDATE_DSA', problem._id, 'Updated DSA problem');
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: 'Error updating DSA problem' });
  }
});

router.delete('/dsa/:id', async (req, res) => {
  try {
    // Soft delete to preserve historical accuracy for students who solved it
    const problem = await DSAProblem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (problem) await logAdminAction(req.user._id, 'DELETE_DSA_SOFT', problem._id, 'Soft deleted DSA problem to preserve history');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting DSA problem' });
  }
});

// Company Prep
router.get('/company-prep', async (req, res) => {
  try {
    const companies = await CompanyPrep.find().sort({ name: 1 });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

router.post('/company-prep', async (req, res) => {
  try {
    const company = await CompanyPrep.create(req.body);
    await logAdminAction(req.user._id, 'CREATE_COMPANY', company._id, 'Created Company Prep record');
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Error creating company' });
  }
});

router.put('/company-prep/:id', async (req, res) => {
  try {
    const company = await CompanyPrep.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (company) await logAdminAction(req.user._id, 'UPDATE_COMPANY', company._id, 'Updated Company Prep record');
    res.json(company);
  } catch (err) {
    res.status(500).json({ message: 'Error updating company' });
  }
});

router.delete('/company-prep/:id', async (req, res) => {
  try {
    await CompanyPrep.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user._id, 'DELETE_COMPANY', req.params.id, 'Hard deleted Company Prep record');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting company' });
  }
});

// OA Definitions
router.get('/oa-patterns', async (req, res) => {
  try {
    const patterns = await OADefinition.find().populate('company', 'name').sort({ createdAt: -1 });
    res.json(patterns);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching OA patterns' });
  }
});

router.post('/oa-patterns', async (req, res) => {
  try {
    // Validation: Cannot create an OA pattern referencing a question bank too small to support it (mocking logical check)
    if (!req.body.sections || req.body.sections.length === 0) {
      return res.status(400).json({ message: 'OA Pattern must contain at least one section' });
    }
    const pattern = await OADefinition.create(req.body);
    await logAdminAction(req.user._id, 'CREATE_OA_PATTERN', pattern._id, 'Created OA Pattern');
    res.json(pattern);
  } catch (err) {
    res.status(500).json({ message: 'Error creating OA pattern' });
  }
});

router.put('/oa-patterns/:id', async (req, res) => {
  try {
    const pattern = await OADefinition.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (pattern) await logAdminAction(req.user._id, 'UPDATE_OA_PATTERN', pattern._id, 'Updated OA Pattern');
    res.json(pattern);
  } catch (err) {
    res.status(500).json({ message: 'Error updating OA pattern' });
  }
});

router.delete('/oa-patterns/:id', async (req, res) => {
  try {
    await OADefinition.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user._id, 'DELETE_OA_PATTERN', req.params.id, 'Deleted OA Pattern');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting OA pattern' });
  }
});

// GD Topics
router.get('/gd-topics', async (req, res) => {
  try {
    const topics = await GDTopic.find().sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching GD topics' });
  }
});

router.post('/gd-topics', async (req, res) => {
  try {
    const topic = await GDTopic.create(req.body);
    await logAdminAction(req.user._id, 'CREATE_GD_TOPIC', topic._id, 'Created GD Topic');
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Error creating GD topic' });
  }
});

router.put('/gd-topics/:id', async (req, res) => {
  try {
    const topic = await GDTopic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (topic) await logAdminAction(req.user._id, 'UPDATE_GD_TOPIC', topic._id, 'Updated GD Topic');
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: 'Error updating GD topic' });
  }
});

router.delete('/gd-topics/:id', async (req, res) => {
  try {
    await GDTopic.findByIdAndDelete(req.params.id);
    await logAdminAction(req.user._id, 'DELETE_GD_TOPIC', req.params.id, 'Deleted GD Topic');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting GD topic' });
  }
});

// ==========================================
// 3. MODERATION QUEUES
// ==========================================

router.get('/moderation', async (req, res) => {
  try {
    const pendingExperiences = await InterviewExperience.find({ status: 'pending' })
      .populate('author', 'full_name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });

    const pendingReports = await Report.find({ status: 'pending', content_type: { $in: ['placement_qa_question', 'placement_qa_answer', 'placement_qa_comment', 'referrer_profile'] } })
      .populate('reported_by', 'full_name email')
      .sort({ created_at: -1 });
      
    // Fetch underlying content for reports
    const populatedReports = await Promise.all(pendingReports.map(async (r) => {
      let content = null;
      if (r.content_type === 'placement_qa_question') content = await QAQuestion.findById(r.content_id);
      else if (r.content_type === 'placement_qa_answer') content = await QAAnswer.findById(r.content_id);
      else if (r.content_type === 'placement_qa_comment') content = await QAComment.findById(r.content_id);
      else if (r.content_type === 'referrer_profile') content = await ReferrerProfile.findById(r.content_id).populate('user', 'full_name email');
      
      return { ...r.toObject(), content };
    }));

    res.json({
      interviewExperiences: pendingExperiences,
      reports: populatedReports
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching moderation queues' });
  }
});

router.put('/moderation/interview-experience/:id', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';
    
    // Optimistic locking: Only update if it is currently 'pending'
    const exp = await InterviewExperience.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' }, 
      { status }, 
      { new: true }
    );

    if (!exp) {
      return res.status(409).json({ message: 'Experience already actioned or not found' });
    }

    await logAdminAction(req.user._id, `MODERATE_EXPERIENCE_${status.toUpperCase()}`, exp._id, `Moderated interview experience: ${status}`);
    res.json(exp);
  } catch (err) {
    res.status(500).json({ message: 'Error updating interview experience' });
  }
});

router.put('/moderation/report/:id', async (req, res) => {
  try {
    const { action } = req.body; // 'dismiss' or 'action_taken'
    
    // Optimistic locking: Only update if it is currently 'pending'
    const report = await Report.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { status: 'reviewed', admin_note: action },
      { new: true }
    );

    if (!report) {
      return res.status(409).json({ message: 'Report already actioned or not found' });
    }
    
    if (action === 'action_taken') {
      // Hard delete the underlying content
      if (report.content_type === 'placement_qa_question') await QAQuestion.findByIdAndDelete(report.content_id);
      else if (report.content_type === 'placement_qa_answer') await QAAnswer.findByIdAndDelete(report.content_id);
      else if (report.content_type === 'placement_qa_comment') await QAComment.findByIdAndDelete(report.content_id);
      else if (report.content_type === 'referrer_profile') await ReferrerProfile.findByIdAndDelete(report.content_id);
    }
    
    await logAdminAction(req.user._id, `RESOLVE_REPORT_${action.toUpperCase()}`, report._id, `Resolved report: ${action}`);
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Error resolving report' });
  }
});

// ==========================================
// 4. USER & REFERRER MANAGEMENT
// ==========================================

router.get('/referrers', async (req, res) => {
  try {
    const referrers = await ReferrerProfile.find()
      .populate('user', 'full_name email')
      .populate('companyId', 'name')
      .sort({ createdAt: -1 });
    res.json(referrers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching referrers' });
  }
});

router.put('/referrer/:id/status', async (req, res) => {
  try {
    const { verificationStatus } = req.body; // 'Verified', 'Unverified', 'Failed'
    const profile = await ReferrerProfile.findByIdAndUpdate(req.params.id, { verificationStatus }, { new: true });
    
    if (profile) await logAdminAction(req.user._id, 'OVERRIDE_REFERRER_STATUS', profile._id, `Overrode referrer status to ${verificationStatus}`);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error updating referrer status' });
  }
});

router.get('/study-groups', async (req, res) => {
  try {
    const groups = await StudyGroup.find()
      .populate('creator', 'full_name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching study groups' });
  }
});

router.delete('/study-groups/:id', async (req, res) => {
  try {
    // Cascade delete: First delete the group's messages
    await GroupMessage.deleteMany({ group_id: req.params.id });
    // Then delete the group
    await StudyGroup.findByIdAndDelete(req.params.id);
    
    await logAdminAction(req.user._id, 'DELETE_STUDY_GROUP', req.params.id, 'Deleted Study Group and cascaded messages');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting study group' });
  }
});

module.exports = router;
