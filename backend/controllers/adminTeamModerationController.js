const TeamReport = require('../models/TeamReport');
const Team = require('../models/Team');
const TeamAuditLog = require('../models/TeamAuditLog');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const mongoose = require('mongoose');

// @desc    Get all team reports
// @route   GET /api/admin/team-moderation/reports
// @access  Private/Admin
exports.getTeamReports = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20, institutionId } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    let reports = await TeamReport.find(query)
      .populate('team', 'title status creator institution')
      .populate('reportedBy', 'username full_name email')
      .sort({ createdAt: -1 })
      .lean();
      
    if (institutionId) {
      reports = reports.filter(r => r.team && r.team.institution && r.team.institution.toString() === institutionId);
    }

    const total = reports.length;
    const paginatedReports = reports.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      data: paginatedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit) || 1
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
    const { status, actionDetails, action } = req.body;
    
    const report = await TeamReport.findById(req.params.id).populate('team');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    report.status = status;
    await report.save();

    let logAction = 'resolve_report';
    if (action === 'dismiss_report') logAction = 'dismiss_report';

    if (action === 'close_and_warn' && report.team && report.team.status !== 'closed') {
      const team = await Team.findById(report.team._id);
      if (team) {
        team.status = 'closed';
        team.disbandReason = `Closed by moderation: ${actionDetails || report.reason}`;
        await team.save();
        logAction = 'warn_team';

        await sendNotification({
          userId: team.creator.toString(),
          type: 'team_moderated',
          actorId: req.user.id,
          title: 'Team Closed & Warning Issued',
          body: `Your team "${team.title}" was closed due to community reports. Reason: ${actionDetails || report.reason}`
        });
      }
    } else if (status === 'actioned' && report.team && report.team.status !== 'closed') {
      const team = await Team.findById(report.team._id);
      if (team) {
        team.status = 'closed';
        team.disbandReason = `Closed by moderation: ${actionDetails || report.reason}`;
        await team.save();

        await sendNotification({
          userId: team.creator.toString(),
          type: 'team_moderated',
          actorId: req.user.id,
          title: 'Team Closed by Moderation',
          body: `Your team "${team.title}" has been closed. Reason: ${actionDetails || report.reason}`
        });
      }
    }

    const auditLog = new TeamAuditLog({
      adminId: req.user.id,
      action: logAction,
      targetTeamId: report.team ? report.team._id : undefined,
      details: actionDetails || 'Report updated'
    });
    await auditLog.save();

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
    const { page = 1, limit = 20, flaggedOnly, institutionId, search } = req.query;
    
    const query = {};
    if (flaggedOnly === 'true') {
      query.flagged = true;
    }
    if (institutionId) {
      query.institution = institutionId;
    }
    if (search) {
      query.$text = { $search: search };
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

// @desc    Close Team
// @route   PUT /api/admin/team-moderation/teams/:id/close
// @access  Private/Admin
exports.closeTeam = async (req, res) => {
  try {
    const { reason } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.status = 'closed';
    team.disbandReason = `Closed by admin: ${reason || 'Administrative override'}`;
    await team.save();

    const auditLog = new TeamAuditLog({
      adminId: req.user.id,
      action: 'force_close_team',
      targetTeamId: team._id,
      details: reason
    });
    await auditLog.save();

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove Team (Soft Delete)
// @route   DELETE /api/admin/team-moderation/teams/:id
// @access  Private/Admin
exports.removeTeam = async (req, res) => {
  try {
    const { reason } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.status = 'closed';
    team.disbandReason = `Deleted by admin: ${reason || 'Administrative override'}`;
    await team.save();

    const auditLog = new TeamAuditLog({
      adminId: req.user.id,
      action: 'soft_delete_team',
      targetTeamId: team._id,
      details: reason
    });
    await auditLog.save();

    res.status(200).json({ success: true, message: 'Team removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Flag/Unflag Team
// @route   PUT /api/admin/team-moderation/teams/:id/flag
// @access  Private/Admin
exports.flagTeam = async (req, res) => {
  try {
    const { flag, reason } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    team.flagged = flag;
    await team.save();

    const auditLog = new TeamAuditLog({
      adminId: req.user.id,
      action: flag ? 'flag_team' : 'unflag_team',
      targetTeamId: team._id,
      details: reason
    });
    await auditLog.save();

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Ban Creator from Team Hunt
// @route   POST /api/admin/team-moderation/users/:id/ban
// @access  Private/Admin
exports.banCreator = async (req, res) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.teamHuntBanned = ban;
    await user.save();

    const auditLog = new TeamAuditLog({
      adminId: req.user.id,
      action: 'team_hunt_ban',
      targetUserId: user._id,
      details: `Ban: ${ban}. Reason: ${reason}`
    });
    await auditLog.save();

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get admin team hunt analytics
// @route   GET /api/admin/team-hunt/analytics
// @access  Private/Admin
exports.getAdminTeamHuntAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const { institutionId } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const TeamApplication = require('../models/TeamApplication');

    const matchQuery = { createdAt: { $gte: startDate } };
    const globalMatch = {};
    
    if (institutionId) {
      const instIdObj = new mongoose.Types.ObjectId(institutionId);
      matchQuery.institution = instIdObj;
      globalMatch.institution = instIdObj;
    }

    const [growth, byCategory, byStatus, totalTeams, applicationsCount] = await Promise.all([
      Team.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            teams: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Team.aggregate([
        { $match: globalMatch },
        { $group: { _id: "$category", count: { $sum: 1 } } }
      ]),
      Team.aggregate([
        { $match: globalMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Team.countDocuments(globalMatch),
      TeamApplication ? TeamApplication.countDocuments({ appliedAt: { $gte: startDate } }) : 0
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
