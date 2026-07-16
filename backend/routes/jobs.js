const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const JobReport = require('../models/JobReport');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { onJobPublished } = require('../services/jobNotifications');
const { createJobApplication } = require('../services/applicationService');

// Check if user is owner or admin
const isOwnerOrAdmin = (job, user) => {
  return job.postedBy.toString() === user.id || user.role === 'admin';
};

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { search, location, workMode, jobType, experienceLevel, minSalary, maxSalary, skills, sort, page = 1, limit = 20 } = req.query;

    const query = {};

    // For non-logged in or normal users, only show published jobs.
    // In a real app we might pass user context to conditionally show drafts to the owner.
    // For this endpoint we'll default to only published jobs. If an owner wants to see their drafts, 
    // they can use a separate recruiter dashboard endpoint, or we can check req.user if auth is optional.
    // Let's assume this is the public feed:
    query.status = 'published';

    if (search) {
      query.$text = { $search: search };
    }
    if (location) query.location = new RegExp(location, 'i');
    if (workMode) query.workMode = workMode;
    if (jobType) query.jobType = jobType;
    if (experienceLevel) query.experienceLevel = experienceLevel;
    
    if (minSalary || maxSalary) {
      query['salary.min'] = {};
      if (minSalary) query['salary.min'].$gte = Number(minSalary);
      if (maxSalary) query['salary.min'].$lte = Number(maxSalary);
    }

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }

    let sortObj = { createdAt: -1 }; // newest
    if (sort === 'salary') sortObj = { 'salary.max': -1 };
    else if (sort === 'relevance' && search) sortObj = { score: { $meta: "textScore" } };

    const skip = (Number(page) - 1) * Number(limit);

    let findQuery = Job.find(query);
    if (sort === 'relevance' && search) {
      findQuery = findQuery.select({ score: { $meta: "textScore" } });
    }

    const jobs = await findQuery
      .populate('postedBy', 'full_name avatar_url recruiterProfile')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Job.countDocuments(query);

    res.json({ jobs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/jobs/saved
router.get('/saved', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedJobs',
      match: { status: 'published' },
      populate: { path: 'postedBy', select: 'full_name avatar_url recruiterProfile' }
    });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Sort so newest saved are first (Mongoose arrays keep insertion order)
    const activeJobs = user.savedJobs.filter(job => job !== null).reverse();
    res.json(activeJobs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/jobs/recommended
router.get('/recommended', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const userSkills = (user.skills || []).map(s => s.skillName);
    if (userSkills.length === 0) {
      return res.json([]);
    }

    // Get applied job IDs
    const applications = await JobApplication.find({ applicant: req.user.id }).select('job');
    const appliedJobIds = applications.map(a => a.job.toString());
    const savedJobIds = (user.savedJobs || []).map(id => id.toString());
    
    const excludeIds = [...appliedJobIds, ...savedJobIds];

    const candidateJobs = await Job.find({
      status: 'published',
      _id: { $nin: excludeIds },
      skills: { $in: userSkills }
    }).populate('postedBy', 'full_name avatar_url recruiterProfile').lean();

    // Score candidates
    candidateJobs.forEach(job => {
      const jobSkills = job.skills || [];
      const intersection = jobSkills.filter(s => userSkills.includes(s));
      job.matchScore = intersection.length;
    });

    // Sort by matchScore desc, then createdAt desc
    candidateJobs.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const limit = parseInt(req.query.limit) || 10;
    res.json(candidateJobs.slice(0, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'full_name avatar_url username recruiterProfile');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Fire and forget view increment
    Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec().catch(err => console.error(err));

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/jobs
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only recruiters or admins can post jobs.' });
    }

    const { title, company, location, workMode, jobType, experienceLevel, salary, description, responsibilities, qualifications, benefits, skills, openings, department, applyMode, externalUrl, applicationDeadline, status } = req.body;

    if (applyMode === 'external' && !externalUrl) {
      return res.status(400).json({ message: 'externalUrl is required when applyMode is external' });
    }

    const job = new Job({
      title,
      company,
      location,
      workMode,
      jobType,
      experienceLevel,
      salary,
      description,
      responsibilities,
      qualifications,
      benefits,
      skills,
      openings,
      department,
      applyMode,
      externalUrl,
      applicationDeadline,
      status: status || 'draft',
      postedBy: req.user.id
    });

    if (job.status === 'published' && req.user.role === 'recruiter') {
      if (req.user.recruiterProfile?.verificationStatus !== 'verified') {
        job.status = 'under_review';
      }
    }

    await job.save();

    if (job.status === 'published') {
      onJobPublished(job);
    }

    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/jobs/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!isOwnerOrAdmin(job, req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = req.body;
    // Don't allow changing postedBy or views/applicantCount through this route
    delete updates.postedBy;
    delete updates.views;
    delete updates.applicantCount;

    if (updates.applyMode === 'external' && !updates.externalUrl && !job.externalUrl) {
       return res.status(400).json({ message: 'externalUrl is required when applyMode is external' });
    }

    if (updates.status === 'published' && req.user.role === 'recruiter' && req.user.recruiterProfile?.verificationStatus !== 'verified') {
      updates.status = 'under_review';
    }

    Object.assign(job, updates);
    await job.save();

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!isOwnerOrAdmin(job, req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await job.deleteOne();
    
    // Notify owner if admin deleted it
    if (job.postedBy.toString() !== req.user.id) {
      await createNotification({
        userId: job.postedBy,
        type: 'job_deleted_by_admin',
        message: `Your job posting "${job.title}" has been deleted by an admin. ${req.body.adminNote ? 'Reason: ' + req.body.adminNote : ''}`,
        channel: 'both',
        emailData: { jobTitle: job.title, adminNote: req.body.adminNote }
      });
    }

    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/jobs/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!isOwnerOrAdmin(job, req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status } = req.body;
    if (!['draft', 'published', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let finalStatus = status;
    if (finalStatus === 'published' && req.user.role === 'recruiter' && req.user.recruiterProfile?.verificationStatus !== 'verified') {
      finalStatus = 'under_review';
    }

    job.status = finalStatus;
    await job.save();

    if (finalStatus === 'published') {
      onJobPublished(job);
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/:id/apply', authMiddleware, async (req, res) => {
  try {
    const { resumeUrl, coverLetter, screeningAnswers } = req.body;
    
    const { application, job } = await createJobApplication({
      jobId: req.params.id,
      applicantId: req.user.id,
      // Removed hardcoded applyMode, will let service handle it
      resumeUrl,
      coverLetter,
      screeningAnswers,
      io: req.app.get('io')
    });

    if (job.applyMode === 'external') {
      return res.status(201).json({ 
        message: 'Application tracked, redirecting...', 
        externalUrl: job.externalUrl,
        application 
      });
    }

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    res.status(err.status || 500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// POST /api/jobs/:id/easy-apply
router.post('/:id/easy-apply', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.applyMode !== 'in-app') {
      return res.status(400).json({ message: 'This job does not support Easy Apply (external)' });
    }

    if (job.screeningQuestions && job.screeningQuestions.length > 0) {
      return res.status(400).json({ message: 'This job requires screening answers. Please use the full apply flow.' });
    }

    const user = await User.findById(req.user.id);
    const resumeUrl = user.defaultApplicationProfile?.resumeUrl;
    
    if (!resumeUrl) {
      return res.status(400).json({ message: 'You must set up your default resume before using Easy Apply.' });
    }

    const { application } = await createJobApplication({
      jobId: req.params.id,
      applicantId: req.user.id,
      applyMode: 'easy',
      resumeUrl,
      coverLetter: user.defaultApplicationProfile?.defaultCoverLetter || undefined,
      io: req.app.get('io')
    });

    res.status(201).json(application);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }
    res.status(err.status || 500).json({ message: err.message || 'Server error', error: err.message });
  }
});

// POST /api/jobs/:id/save
router.post('/:id/save', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { savedJobs: job._id }
    });

    res.json({ message: 'Job saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/jobs/:id/save
router.delete('/:id/save', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { savedJobs: req.params.id }
    });

    res.json({ message: 'Job removed from saved' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/jobs/:id/applicants
router.get('/:id/applicants', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!isOwnerOrAdmin(job, req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { status, sort } = req.query;
    const query = { job: job._id, status: { $ne: 'withdrawn' } };

    if (status) {
      query.status = status;
    }

    let applications = await JobApplication.find(query)
      .populate('applicant', 'full_name avatar_url email username')
      .lean();

    // Optional: Sort by appliedDate or skillMatch
    // For Phase 1, we can just sort in memory for skillMatch, or sort by date
    if (sort === 'skillMatch' && job.skills && job.skills.length > 0) {
      // Very basic Phase 1 skill match: assumes applicant has some skills array on User model.
      // Since User model in StudentHub might not have skills directly, we'll need to fetch them if needed.
      // For now, let's just sort by date if skillMatch isn't fully supported by the User schema yet.
      // We will sort by date as default fallback.
    }

    // Default sort by date descending
    applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/jobs/:id/report
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const { reason, details } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    // Check if user already reported
    const existingReport = await JobReport.findOne({ targetType: 'job', targetId: job._id, reportedBy: req.user.id });
    if (existingReport) {
      return res.status(409).json({ message: 'You have already reported this job' });
    }

    const report = new JobReport({
      targetType: 'job',
      targetId: job._id,
      targetModel: 'Job',
      reportedBy: req.user.id,
      reason,
      details,
      status: 'pending'
    });
    await report.save();

    // Check threshold
    const pendingCount = await JobReport.countDocuments({ targetType: 'job', targetId: job._id, status: 'pending' });
    if (pendingCount >= 3) {
      job.status = 'under_review';
      await job.save();

      await createNotification({
        userId: job.postedBy,
        type: 'job_auto_hidden',
        message: `Your job posting "${job.title}" has been automatically hidden due to multiple reports.`,
        relatedJob: job._id,
        actionUrl: `/jobs/${job._id}`,
        channel: 'both',
        emailData: { jobTitle: job.title }
      });
    }

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already reported this job' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/jobs/:id/analytics
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (!isOwnerOrAdmin(job, req.user)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const views = job.views || 0;
    const applicantCount = job.applicantCount || 0;
    const conversionRate = views > 0 ? (applicantCount / views) : 0;

    // Aggregate status breakdown
    const statusBreakdownRaw = await JobApplication.aggregate([
      { $match: { job: job._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const statusBreakdown = statusBreakdownRaw.map(s => ({
      status: s._id,
      count: s.count
    }));

    // Applications over time (group by day)
    const applicationsOverTimeRaw = await JobApplication.aggregate([
      { $match: { job: job._id } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const applicationsOverTime = applicationsOverTimeRaw.map(a => ({
      date: a._id,
      count: a.count
    }));

    res.json({
      views,
      applicantCount,
      conversionRate,
      statusBreakdown,
      applicationsOverTime
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
