import os
import re

admin_resumes_path = "backend/routes/adminResumes.js"
admin_resumes_content = """const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Resume = require('../models/Resume');
const CoverLetter = require('../models/CoverLetter');
const PortfolioPage = require('../models/PortfolioPage');
const FeedbackRequest = require('../models/FeedbackRequest');
const GeminiUsage = require('../models/GeminiUsage');

// GET /api/admin/resumes/overview
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
    }

    const [
      totalResumes,
      totalCoverLetters,
      totalPortfolios,
      atsScoreAgg,
      feedbackRequestsRaw,
      geminiUsageRaw
    ] = await Promise.all([
      Resume.countDocuments(),
      CoverLetter.countDocuments(),
      PortfolioPage.countDocuments(),
      Resume.aggregate([
        { $match: { "atsScore.score": { $gt: 0 } } },
        { $group: { _id: null, avgScore: { $avg: "$atsScore.score" } } }
      ]),
      FeedbackRequest.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      GeminiUsage.aggregate([
        { $match: { feature: { $in: ['resume_parse', 'resume_tailoring', 'career_insights', 'resume_narrative', 'resume_panic_rebuild', 'cover_letter'] } } },
        { $group: { _id: "$feature", totalCalls: { $sum: "$calls" }, totalCost: { $sum: "$estimatedCost" } } }
      ])
    ]);

    const avgAtsScore = atsScoreAgg.length > 0 ? Math.round(atsScoreAgg[0].avgScore * 10) / 10 : 0;

    const feedbackHealth = feedbackRequestsRaw.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { pending: 0, in_progress: 0, completed: 0 });

    const geminiUsage = geminiUsageRaw.reduce((acc, curr) => {
      acc.totalCalls += curr.totalCalls || 0;
      acc.totalCost += curr.totalCost || 0;
      return acc;
    }, { totalCalls: 0, totalCost: 0 });

    res.json({
      totals: {
        resumes: totalResumes,
        coverLetters: totalCoverLetters,
        portfolios: totalPortfolios
      },
      avgAtsScore,
      feedbackHealth,
      geminiUsage
    });
  } catch (error) {
    console.error('Admin Resumes Overview Error:', error);
    res.status(500).json({ message: 'Server error fetching resume overview' });
  }
});

module.exports = router;
"""

with open(admin_resumes_path, "w", encoding="utf-8") as f:
    f.write(admin_resumes_content)
print("Created adminResumes.js")

server_js_path = "backend/server.js"
with open(server_js_path, "r", encoding="utf-8") as f:
    server_content = f.read()

if "require('./routes/adminResumes')" not in server_content:
    server_content = server_content.replace(
        "app.use('/api/admin/career-opportunities', require('./routes/adminCareerOpportunities'));",
        "app.use('/api/admin/career-opportunities', require('./routes/adminCareerOpportunities'));\napp.use('/api/admin/resumes', require('./routes/adminResumes'));"
    )
    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(server_content)
    print("Updated server.js")
