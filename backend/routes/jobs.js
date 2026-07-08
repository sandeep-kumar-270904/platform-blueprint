const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const authMiddleware = require('../middleware/auth');

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ is_active: true })
      .sort({ createdAt: -1 })
      .lean();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/jobs (Admin/Employer only in real app, open here for demo)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, company, location, type, salary, description, logo } = req.body;
    
    const job = new Job({
      title, company, location, type, salary, description, logo: logo || "💼"
    });
    await job.save();
    
    // Broadcast via socket.io
    req.io.emit('job_posted', job);
    
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/jobs/:id/apply
router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    // Check if already applied
    const existing = await JobApplication.findOne({ job_id: job._id, user_id: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new JobApplication({
      job_id: job._id,
      user_id: req.user.id
    });
    await application.save();
    
    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
