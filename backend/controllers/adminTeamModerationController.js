const TeamReport = require('../models/TeamReport');
const Team = require('../models/Team');
const { sendNotification } = require('../services/notificationService');

// @desc    Get all team reports
// @route   GET /api/admin/team-moderation/reports
// @access  Private/Admin
exports.getTeamReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await TeamReport.find(query)
      .populate('team', 'title status creator')
      .populate('reportedBy', 'username full_name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await TeamReport.countDocuments(query);

    res.status(200).json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a team report status
// @route   PUT /api/admin/team-moderation/reports/:id
// @access  Private/Admin
exports.updateTeamReport = async (req, res) => {
  try {
    const { status, actionDetails } = req.body;
    
    const report = await TeamReport.findById(req.params.id).populate('team');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = status;
    await report.save();

    // If admin actions it, close the team
    if (status === 'actioned' && report.team && report.team.status !== 'closed') {
      const team = await Team.findById(report.team._id);
      if (team) {
        team.status = 'closed';
        team.disbandReason = `Closed by moderation: ${actionDetails || report.reason}`;
        await team.save();

        // Notify creator
        await sendNotification({
          userId: team.creator.toString(),
          type: 'team_moderated',
          actorId: req.user.id,
          title: 'Team Closed by Moderation',
          body: `Your team "${team.title}" has been closed. Reason: ${actionDetails || report.reason}`
        });
      }
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all teams for admin overview
// @route   GET /api/admin/team-moderation/teams
// @access  Private/Admin
exports.getAdminTeams = async (req, res) => {
  try {
    const { page = 1, limit = 20, flaggedOnly } = req.query;
    
    const query = {};
    if (flaggedOnly === 'true') {
      query.flagged = true;
    }

    const teams = await Team.find(query)
      .populate('creator', 'username full_name email')
      .sort({ reportCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Team.countDocuments(query);

    res.status(200).json({
      success: true,
      data: teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Get admin team hunt analytics
// @route   GET /api/admin/team-hunt/analytics
// @access  Private/Admin
exports.getAdminTeamHuntAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const TeamApplication = require('../models/TeamApplication');

    const [growth, byCategory, byStatus, applicationsCount, totalTeams] = await Promise.all([
      Team.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            teams: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Team.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),
      Team.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      TeamApplication ? TeamApplication.countDocuments({ appliedAt: { $gte: startDate } }) : 0,
      Team.countDocuments()
    ]);

    const filledGrowth = [];
    const curr = new Date(startDate);
    const end = new Date();
    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const found = growth.find(g => g._id === dateStr);
      filledGrowth.push({
        date: dateStr,
        teams: found ? found.teams : 0
      });
      curr.setDate(curr.getDate() + 1);
    }

    res.status(200).json({
      success: true,
      data: {
        totalTeams,
        recentApplications: applicationsCount,
        growth: filledGrowth,
        byCategory,
        byStatus
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
