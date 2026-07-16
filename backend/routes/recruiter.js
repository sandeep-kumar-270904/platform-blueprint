const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// POST /api/recruiter/verify
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { companyName, companyWebsite, verificationDocUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.recruiterProfile?.verificationStatus === 'verified') {
      return res.status(400).json({ message: 'Already verified' });
    }
    
    if (user.recruiterProfile?.verificationStatus === 'pending') {
      return res.status(400).json({ message: 'Verification already pending' });
    }

    user.role = user.role === 'admin' ? 'admin' : 'recruiter';
    
    user.recruiterProfile = {
      ...user.recruiterProfile,
      companyName,
      companyWebsite,
      verificationDocUrl,
      verificationStatus: 'pending'
    };

    await user.save();
    res.json({ message: 'Verification submitted successfully', recruiterProfile: user.recruiterProfile });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/recruiter/analytics/overview
router.get('/analytics/overview', authMiddleware, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ postedBy: req.user.id });

    const totalJobs = jobs.length;
    const totalViews = jobs.reduce((sum, job) => sum + (job.views || 0), 0);
    const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicantCount || 0), 0);
    const averageConversionRate = totalViews > 0 ? (totalApplicants / totalViews) : 0;

    let bestPerformingJob = null;
    let highestConvRate = -1;

    jobs.forEach(job => {
      const views = job.views || 0;
      const applicants = job.applicantCount || 0;
      const convRate = views > 0 ? (applicants / views) : 0;

      if (convRate > highestConvRate) {
        highestConvRate = convRate;
        bestPerformingJob = {
          id: job._id,
          title: job.title,
          conversionRate: convRate
        };
      }
    });

    res.json({
      totalJobs,
      totalViews,
      totalApplicants,
      averageConversionRate,
      bestPerformingJob
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const Notification = require('../models/Notification');
const JobInvite = require('../models/JobInvite');

// GET /api/recruiter/candidates
router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    const { skills, preferredRole, location, department, minCTC, maxCTC, noticePeriod, sort } = req.query;

    const query = { 'careerVisibility.visibleToRecruiters': true, banned: { $ne: true } };

    if (preferredRole) {
      query['careerVisibility.visiblePreferredRoles'] = { $regex: preferredRole, $options: 'i' };
    }
    if (location) {
      query['careerVisibility.visiblePreferredLocations'] = { $regex: location, $options: 'i' };
    }
    if (minCTC) {
      query['careerVisibility.expectedCTC.min'] = { $gte: Number(minCTC) };
    }
    if (maxCTC) {
      query['careerVisibility.expectedCTC.max'] = { $lte: Number(maxCTC) };
    }
    if (noticePeriod) {
      query['careerVisibility.noticePeriod'] = { $regex: noticePeriod, $options: 'i' };
    }
    if (department) {
       query.degree = { $regex: department, $options: 'i' };
    }

    let candidates = await User.find(query)
      .select('full_name username avatar_url skills verifiedSkills careerVisibility degree university')
      .lean();

    // Scoring
    const requestedSkills = skills ? skills.split(',').map(s => s.trim().toLowerCase()) : [];
    
    candidates = candidates.map(candidate => {
      let score = 0;
      if (requestedSkills.length > 0) {
        const candidateKeywords = (candidate.careerVisibility?.searchKeywords || []).map(k => k.toLowerCase());
        const candidateSkills = (candidate.skills || []).map(s => s.skillName.toLowerCase());
        const verifiedSkills = (candidate.verifiedSkills || []).map(s => s.skill.toLowerCase());
        const allTerms = new Set([...candidateKeywords, ...candidateSkills]);
        
        requestedSkills.forEach(rs => {
          if (verifiedSkills.includes(rs)) {
            score += 2; // Verified skills weigh more
          } else if (allTerms.has(rs)) {
            score += 1;
          }
        });
      }
      return { ...candidate, matchScore: score };
    });

    if (sort === 'recentlyActive') {
      candidates.sort((a, b) => {
        const dateA = new Date(a.careerVisibility?.profileLastUpdatedForVisibility || 0).getTime();
        const dateB = new Date(b.careerVisibility?.profileLastUpdatedForVisibility || 0).getTime();
        return dateB - dateA;
      });
    } else {
      // Relevance (matchScore descending), then recentlyActive
      candidates.sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        const dateA = new Date(a.careerVisibility?.profileLastUpdatedForVisibility || 0).getTime();
        const dateB = new Date(b.careerVisibility?.profileLastUpdatedForVisibility || 0).getTime();
        return dateB - dateA;
      });
    }

    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/recruiter/candidates/:userId
router.get('/candidates/:userId', authMiddleware, async (req, res) => {
  try {
    const candidate = await User.findOne({ _id: req.params.userId, 'careerVisibility.visibleToRecruiters': true })
      .select('full_name username avatar_url skills verifiedSkills videoIntroUrl institutionVerified careerVisibility degree university bio');
    
    if (!candidate) {
      return res.status(403).json({ message: 'Candidate not found or profile is not visible to recruiters.' });
    }

    // Update view count and viewers
    await User.updateOne(
      { _id: candidate._id },
      { 
        $inc: { 'careerVisibility.profileViewCount': 1 },
        $push: { 
          'careerVisibility.profileViewers': {
            $each: [{ recruiter: req.user.id, viewedAt: new Date() }],
            $slice: -50
          }
        }
      }
    );

    const fullCandidate = await User.findById(candidate._id).select('notificationPreferences');
    if (fullCandidate?.notificationPreferences?.profileViews?.inApp !== false) {
      const { createNotification } = require('../services/notificationService');
      await createNotification({
        userId: candidate._id,
        type: 'profile_viewed',
        message: 'A recruiter viewed your profile',
        channel: 'in_app'
      }, req.app.get('io'));
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/recruiter/candidates/:userId/invite
router.post('/candidates/:userId/invite', authMiddleware, async (req, res) => {
  try {
    const { jobId, message } = req.body;
    
    const Job = require('../models/Job');
    const job = await Job.findOne({ _id: jobId, postedBy: req.user.id });
    if (!job) return res.status(404).json({ message: 'Job not found or you are not the owner.' });

    const candidate = await User.findOne({ _id: req.params.userId, 'careerVisibility.visibleToRecruiters': true });
    if (!candidate) return res.status(403).json({ message: 'Candidate not found or profile is not visible.' });

    const existingInvite = await JobInvite.findOne({ job: jobId, candidate: candidate._id });
    if (existingInvite) return res.status(400).json({ message: 'Candidate already invited to this job.' });

    const invite = new JobInvite({
      job: jobId,
      recruiter: req.user.id,
      candidate: candidate._id,
      message
    });
    await invite.save();

    const { createNotification } = require('../services/notificationService');
    await createNotification({
      userId: candidate._id,
      type: 'job_invite_received',
      relatedJob: jobId,
      message: `You have been invited to apply for ${job.title}`,
      actionUrl: `/jobs/${jobId}`,
      channel: 'in_app'
    }, req.app.get('io'));

    res.status(201).json({ message: 'Invite sent successfully', invite });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
