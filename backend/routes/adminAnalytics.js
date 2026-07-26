const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Middleware to verify admin status
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

router.use(isAdmin);

// GET /api/admin/analytics/growth
router.get('/growth', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const growth = await User.aggregate([
      { $match: { created_at: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", users: 1, _id: 0 } }
    ]);

    // Fill in missing dates with 0
    const filledData = [];
    const curr = new Date(startDate);
    const end = new Date();
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const found = growth.find(g => g.date === dateStr);
      filledData.push({
        date: dateStr,
        users: found ? found.users : 0
      });
      curr.setDate(curr.getDate() + 1);
    }

    res.json(filledData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/analytics/engagement
router.get('/engagement', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const QuizAttempt = mongoose.models.QuizAttempt;
    const JobApplication = mongoose.models.JobApplication;
    const MentorBooking = mongoose.models.MentorBooking;

    const query = { createdAt: { $gte: startDate } };
    const groupStage = {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    };

    const [quizzes, jobs, mentorBookings] = await Promise.all([
      QuizAttempt ? QuizAttempt.aggregate([{ $match: { startedAt: { $gte: startDate } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } }, count: { $sum: 1 } } }]) : [],
      JobApplication ? JobApplication.aggregate([{ $match: query }, groupStage]) : [],
      MentorBooking ? MentorBooking.aggregate([{ $match: query }, groupStage]) : []
    ]);

    // Combine them
    const filledData = [];
    const curr = new Date(startDate);
    const end = new Date();
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      
      const q = quizzes.find(x => x._id === dateStr)?.count || 0;
      const j = jobs.find(x => x._id === dateStr)?.count || 0;
      const m = mentorBookings.find(x => x._id === dateStr)?.count || 0;
      
      filledData.push({
        date: dateStr,
        quizzes: q,
        jobs: j,
        mentorships: m
      });
      curr.setDate(curr.getDate() + 1);
    }

    res.json(filledData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/analytics/reports
router.get('/reports', async (req, res) => {
  try {
    const Report = mongoose.models.Report;
    const IdeaReport = mongoose.models.IdeaReport;
    const JobReport = mongoose.models.JobReport;
    const QuizReport = mongoose.models.QuizReport;
    const NewsReport = mongoose.models.NewsReport;

    const counts = await Promise.all([
      Report ? Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]) : [],
      IdeaReport ? IdeaReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]) : [],
      JobReport ? JobReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]) : [],
      QuizReport ? QuizReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]) : [],
      NewsReport ? NewsReport.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]) : [],
    ]);

    // Aggregate into a simple list of { name: 'Module', pending: X, resolved: Y }
    const data = [
      { name: 'Community', pending: counts[0].find(c => c._id === 'pending')?.count || 0, resolved: counts[0].find(c => c._id !== 'pending')?.count || 0 },
      { name: 'Ideas', pending: counts[1].find(c => c._id === 'pending')?.count || 0, resolved: counts[1].find(c => c._id !== 'pending')?.count || 0 },
      { name: 'Jobs', pending: counts[2].find(c => c._id === 'pending')?.count || 0, resolved: counts[2].find(c => c._id !== 'pending')?.count || 0 },
      { name: 'Quizzes', pending: counts[3].find(c => c._id === 'pending')?.count || 0, resolved: counts[3].find(c => c._id !== 'pending')?.count || 0 },
      { name: 'News', pending: counts[4].find(c => c._id === 'pending')?.count || 0, resolved: counts[4].find(c => c._id !== 'pending')?.count || 0 }
    ];

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
