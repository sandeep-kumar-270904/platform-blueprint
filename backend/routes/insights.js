const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const authMiddleware = require('../middleware/auth');

// GET /api/insights/campus-hiring
router.get('/campus-hiring', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    // 1. Top hiring companies this month
    const topCompanies = await Job.aggregate([
      { $match: { status: 'published', createdAt: { $gte: thirtyDaysAgo }, 'company.name': { $exists: true, $ne: null } } },
      { $group: { _id: '$company.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 2. Most in-demand skills this month
    const topSkills = await Job.aggregate([
      { $match: { status: 'published', createdAt: { $gte: thirtyDaysAgo }, skills: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. Average applications-per-job this month
    // First, find jobs created in the last 30 days
    const recentJobs = await Job.find({ status: 'published', createdAt: { $gte: thirtyDaysAgo } }).select('_id');
    const recentJobIds = recentJobs.map(j => j._id);

    let avgApplications = 0;
    if (recentJobIds.length > 0) {
      const appStats = await JobApplication.aggregate([
        { $match: { job: { $in: recentJobIds } } },
        { $group: { _id: '$job', count: { $sum: 1 } } }
      ]);
      
      const totalApps = appStats.reduce((sum, item) => sum + item.count, 0);
      avgApplications = (totalApps / recentJobIds.length).toFixed(1);
    }

    // 4. Trend line: jobs posted per week over the last 8 weeks
    const trendDataRaw = await Job.aggregate([
      { $match: { status: 'published', createdAt: { $gte: eightWeeksAgo } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: "$createdAt" },
            week: { $isoWeek: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // Format trend data
    const trendData = trendDataRaw.map(item => ({
      week: `W${item._id.week} ${item._id.year}`,
      count: item.count
    }));

    res.json({
      topCompanies,
      topSkills,
      avgApplications: Number(avgApplications),
      trendData
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
