const express = require('express');
const router = express.Router();
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');
const { updateApplicationStatus, withdrawApplication } = require('../services/applicationService');

// GET /api/applications/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const applications = await JobApplication.find({ applicant: req.user.id })
      .populate({
        path: 'job',
        select: 'title company location workMode jobType status'
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/applications/track
router.post('/track', authMiddleware, async (req, res) => {
  try {
    const { jobId, status, note } = req.body;
    
    const existing = await JobApplication.findOne({ job: jobId, applicant: req.user.id });
    if (existing) {
      return res.status(409).json({ message: 'Tracking record already exists' });
    }
    
    const application = new JobApplication({
      job: jobId,
      applicant: req.user.id,
      applyMode: 'external',
      studentManaged: true,
      status: status || 'interested',
      statusHistory: [{ status: status || 'interested', changedAt: new Date(), changedBy: req.user.id, note }]
    });
    
    await application.save();
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/applications/:id/withdraw
router.patch('/:id/withdraw', authMiddleware, async (req, res) => {
  try {
    const updatedApplication = await withdrawApplication({
      applicationId: req.params.id,
      applicantId: req.user.id,
      io: req.io
    });

    res.json(updatedApplication);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/applications/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { newStatus, note, rejectionFeedback, rejectionFeedbackNote } = req.body;
    
    const application = await JobApplication.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    
    const isOwner = application.job.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    const isApplicant = application.applicant.toString() === req.user.id;
    
    if (!isOwner && !isAdmin) {
      if (!(application.studentManaged && isApplicant)) {
        return res.status(403).json({ message: 'Unauthorized to update this application' });
      }
    }

    const updatedApplication = await updateApplicationStatus({
      applicationId: req.params.id,
      newStatus,
      changedBy: req.user.id,
      note,
      rejectionFeedback,
      rejectionFeedbackNote,
      io: req.io
    });

    res.json(updatedApplication);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/applications/bulk-status
router.patch('/bulk-status', authMiddleware, async (req, res) => {
  try {
    const { applicationIds, newStatus } = req.body;
    
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ message: 'applicationIds array is required' });
    }

    const updatedApplications = [];
    const errors = [];

    for (const appId of applicationIds) {
      try {
        const application = await JobApplication.findById(appId).populate('job');
        if (!application) throw new Error('Application not found');
        
        if (application.job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
          throw new Error('Unauthorized');
        }

        const updated = await updateApplicationStatus({
          applicationId: appId,
          newStatus,
          changedBy: req.user.id,
          note: 'Bulk status update',
          io: req.io
        });
        
        updatedApplications.push(updated);
      } catch (err) {
        errors.push({ id: appId, error: err.message });
      }
    }

    res.json({ updated: updatedApplications, errors });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// GET /api/applications/insights/rejections
router.get('/insights/rejections', authMiddleware, async (req, res) => {
  try {
    const rawInsights = await JobApplication.aggregate([
      { $match: { applicant: mongoose.Types.ObjectId(req.user.id), status: 'rejected', rejectionFeedback: { $ne: null } } },
      { $group: { _id: "$rejectionFeedback", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const insights = rawInsights.map(i => ({ feedback: i._id, count: i.count }));
    res.json(insights);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
