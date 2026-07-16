const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const JobReport = require('../models/JobReport');
const User = require('../models/User');
const Notification = require('../models/Notification');
const JobAlert = require('../models/JobAlert');
const CompanyFollow = require('../models/CompanyFollow');
const { getCampusHiringInsights } = require('./insights'); // Assuming it's exported or we can just import the logic.

// GET /api/admin/career-opportunities/overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      publishedJobs, draftJobs, closedJobs, underReviewJobs, recentJobs,
      totalApps, appsStatusRaw, recentApps,
      pendingReports, pendingVerifications, bannedUsers,
      totalNotifs, failedEmails,
      totalSavedJobsAgg, totalAlerts, totalFollows,
      visibleCandidates, totalProfileViewsAgg,
      recentEvents
    ] = await Promise.all([
      // Jobs
      Job.countDocuments({ status: 'published' }),
      Job.countDocuments({ status: 'draft' }),
      Job.countDocuments({ status: 'closed' }),
      Job.countDocuments({ status: 'under_review' }),
      Job.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      
      // Applications
      JobApplication.countDocuments(),
      JobApplication.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      JobApplication.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),

      // Moderation
      JobReport.countDocuments({ status: 'pending' }),
      User.countDocuments({ 'recruiterProfile.verificationStatus': 'pending' }),
      User.countDocuments({ banned: true }),

      // Notifications
      Notification.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Notification.countDocuments({ emailSent: false, emailFailureReason: { $exists: true, $ne: null }, createdAt: { $gte: sevenDaysAgo } }),

      // Engagement
      User.aggregate([
        { $project: { count: { $size: { $ifNull: ["$savedJobs", []] } } } },
        { $group: { _id: null, total: { $sum: "$count" } } }
      ]),
      JobAlert.countDocuments({ active: true }),
      CompanyFollow.countDocuments(),

      // Candidate Visibility
      User.countDocuments({ 'careerVisibility.visibleToRecruiters': true }),
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$careerVisibility.profileViewCount" } } }
      ]),
      
      // Recent Activity (Lightweight Union)
      // We will fetch 5 of each and sort in memory
      Promise.all([
        Job.find().sort({ createdAt: -1 }).limit(5).select('title company createdAt status').lean(),
        JobReport.find().sort({ createdAt: -1 }).limit(5).populate('reportedBy', 'full_name').select('reason status createdAt').lean(),
        User.find({ 'recruiterProfile.verificationStatus': { $exists: true } }).sort({ updatedAt: -1 }).limit(5).select('full_name recruiterProfile updatedAt').lean()
      ])
    ]);

    const appsStatus = appsStatusRaw.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalSavedJobs = totalSavedJobsAgg[0]?.total || 0;
    const totalProfileViews = totalProfileViewsAgg[0]?.total || 0;

    // Combine recent events
    let activityFeed = [];
    recentEvents[0].forEach(job => activityFeed.push({ type: 'job', action: `Job ${job.title} created`, date: job.createdAt }));
    recentEvents[1].forEach(report => activityFeed.push({ type: 'report', action: `Report filed by ${report.reportedBy?.full_name}: ${report.reason}`, date: report.createdAt }));
    recentEvents[2].forEach(user => activityFeed.push({ type: 'verification', action: `Recruiter ${user.full_name} verification: ${user.recruiterProfile?.verificationStatus}`, date: user.updatedAt }));
    
    activityFeed.sort((a, b) => new Date(b.date) - new Date(a.date));
    activityFeed = activityFeed.slice(0, 15);

    // Campus Insights - reuse the logic or fetch from DB
    // We can just fetch the raw data directly here since it's admin facing
    const topSkillsAgg = await Job.aggregate([
      { $match: { status: 'published' } },
      { $unwind: "$skills" },
      { $group: { _id: "$skills", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const topCompaniesAgg = await Job.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: "$company.name", jobCount: { $sum: 1 } } },
      { $sort: { jobCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      jobs: { published: publishedJobs, draft: draftJobs, closed: closedJobs, underReview: underReviewJobs, recent: recentJobs },
      applications: { total: totalApps, recent: recentApps, status: appsStatus },
      moderation: { pendingReports, pendingVerifications, bannedUsers },
      notifications: { totalSent: totalNotifs, failedEmails },
      engagement: { savedJobs: totalSavedJobs, jobAlerts: totalAlerts, companyFollows: totalFollows },
      visibility: { visibleCandidates, totalProfileViews },
      activityFeed,
      insights: { topSkills: topSkillsAgg, topCompanies: topCompaniesAgg }
    });
  } catch (err) {
    console.error('Overview Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/career-opportunities/consistency-check
router.get('/consistency-check', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const issues = {
      orphanedApplications: [],
      applicantCountMismatches: [],
      alertsForBannedUsers: [],
      silentEmailFailures: []
    };

    // 1. Orphaned Applications
    const allApps = await JobApplication.find().select('job applicant');
    for (const app of allApps) {
      const jobExists = await Job.exists({ _id: app.job });
      if (!jobExists) {
        issues.orphanedApplications.push(`Application ${app._id} references missing Job ${app.job}`);
      }
    }

    // 2. applicantCount Mismatches
    const jobs = await Job.find().select('title applicantCount');
    for (const job of jobs) {
      const actualCount = await JobApplication.countDocuments({ job: job._id, status: { $ne: 'withdrawn' } });
      if ((job.applicantCount || 0) !== actualCount) {
        issues.applicantCountMismatches.push(`Job ${job._id} ("${job.title}") has applicantCount ${job.applicantCount || 0} but actual is ${actualCount}`);
      }
    }

    // 3. Alerts for banned users
    const alerts = await JobAlert.find({ active: true }).populate('user', 'banned');
    for (const alert of alerts) {
      if (alert.user && alert.user.banned) {
        issues.alertsForBannedUsers.push(`Alert ${alert._id} belongs to banned user ${alert.user._id}`);
      }
    }

    // 4. Silent email failures (channel includes email but not sent, and no failure reason)
    const silentFailures = await Notification.find({
      channel: { $in: ['email', 'both'] },
      emailSent: false,
      emailFailureReason: { $exists: false }
    }).select('_id type createdAt');
    
    silentFailures.forEach(f => {
      issues.silentEmailFailures.push(`Notification ${f._id} of type ${f.type} failed silently (no emailSent and no failureReason)`);
    });

    res.json(issues);
  } catch (err) {
    console.error('Consistency Check Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
