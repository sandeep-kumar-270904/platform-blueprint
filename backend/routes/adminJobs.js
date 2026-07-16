const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const JobReport = require('../models/JobReport');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');

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

// GET /api/admin/recruiters/pending
router.get('/recruiters/pending', authMiddleware, isAdmin, async (req, res) => {
  try {
    const pendingRecruiters = await User.find({ 'recruiterProfile.verificationStatus': 'pending' });
    res.json(pendingRecruiters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/recruiters/banned
router.get('/recruiters/banned', authMiddleware, isAdmin, async (req, res) => {
  try {
    const bannedRecruiters = await User.find({ banned: true, role: 'recruiter' });
    res.json(bannedRecruiters);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/recruiters/:userId/verify
router.patch('/recruiters/:userId/verify', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { approve, note } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.recruiterProfile.verificationStatus = approve ? 'verified' : 'rejected';
    user.recruiterProfile.verifiedAt = new Date();
    user.recruiterProfile.verifiedBy = req.adminUser._id;
    await user.save();

    await notificationService.createNotification({
      userId: user._id,
      type: approve ? 'recruiter_verified' : 'recruiter_rejected',
      message: approve ? 'Your recruiter account has been verified.' : `Your recruiter verification was rejected. Note: ${note}`,
      channel: 'both'
    });

    res.json({ message: 'Verification status updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/recruiters/:userId/unban
router.patch('/recruiters/:userId/unban', authMiddleware, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.banned = false;
    user.banReason = null;
    await user.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/reports
router.get('/reports', authMiddleware, isAdmin, async (req, res) => {
  try {
    const reports = await JobReport.find().populate('reportedBy', 'full_name email').populate('targetId', 'title company.name').sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/reports/:id
router.patch('/reports/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const report = await JobReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    report.adminNote = adminNote;
    report.reviewedBy = req.adminUser._id;
    report.reviewedAt = new Date();

    if (action === 'dismiss') {
      report.status = 'reviewed_dismissed';
      await report.save();
      
      const pendingCount = await JobReport.countDocuments({ targetId: report.targetId, status: 'pending' });
      if (pendingCount === 0) {
        await Job.findByIdAndUpdate(report.targetId, { status: 'published' });
      }
    } else if (action === 'delete_job') {
      report.status = 'reviewed_actioned';
      await report.save();
      
      const job = await Job.findById(report.targetId);
      if (job) {
        await notificationService.createNotification({
          userId: job.postedBy,
          type: 'job_deleted_by_admin',
          message: `Your job posting "${job.title}" has been deleted by an admin. ${adminNote ? 'Reason: ' + adminNote : ''}`,
          channel: 'both',
          emailData: { jobTitle: job.title, adminNote }
        });
      }
      
      await Job.findByIdAndDelete(report.targetId);
      await JobReport.updateMany({ targetId: report.targetId }, { status: 'reviewed_actioned' });
    } else if (action === 'ban_recruiter') {
      report.status = 'reviewed_actioned';
      await report.save();
      
      const job = await Job.findById(report.targetId);
      if (job) {
        const recruiterId = job.postedBy;
        await User.findByIdAndUpdate(recruiterId, { banned: true, banReason: adminNote || 'Banned from report action', bannedAt: new Date() });
        await Job.deleteMany({ postedBy: recruiterId, status: { $ne: 'closed' } });
        
        await notificationService.createNotification({
          userId: recruiterId,
          type: 'recruiter_banned',
          message: `Your account has been suspended by an administrator.`,
          channel: 'both'
        });
      }
      await JobReport.updateMany({ targetId: report.targetId }, { status: 'reviewed_actioned' });
    }

    res.json({ message: 'Report actioned successfully', report });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/jobs
router.get('/jobs', authMiddleware, isAdmin, async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'full_name email').sort({ createdAt: -1 });
    
    // Aggregate report counts
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const reportCount = await JobReport.countDocuments({ targetId: job._id });
      return { ...job.toObject(), reportCount };
    }));
    
    res.json(jobsWithCounts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
