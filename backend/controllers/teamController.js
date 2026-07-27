const Team = require('../models/Team');
const TeamApplication = require('../models/TeamApplication');
const TeamReport = require('../models/TeamReport');
const User = require('../models/User');
const { calculateMatchScore } = require('../services/teamMatchService');
const { sendNotification } = require('../services/notificationService');
const { assessModeration } = require('../utils/moderation');
const teamCache = require('../utils/teamCache');
const skillGapAdvisor = require('../services/skillGapAdvisor');
const secondChanceService = require('../services/secondChanceService');
const teamBadgeService = require('../services/teamBadgeService');

const attachCreatorTrustList = async (teamsList) => {
  if (!teamsList || !Array.isArray(teamsList)) return;
  const trustCache = {};
  await Promise.all(teamsList.map(async (t) => {
    if (t && t.creator && (t.creator._id || t.creator.id || typeof t.creator === 'string')) {
      const creatorId = (t.creator._id || t.creator.id || t.creator).toString();
      if (!trustCache[creatorId]) {
        trustCache[creatorId] = teamBadgeService.getCreatorTrust(creatorId);
      }
      const trust = await trustCache[creatorId];
      if (trust && typeof t.creator === 'object') {
        t.creator.creatorTrust = {
          teamsCreated: trust.teamsCreated,
          teamsCompleted: trust.teamsCompleted,
          averageRatingReceived: trust.averageRatingReceived,
          totalReviews: trust.totalReviews,
          isFirstTimeCreator: trust.isFirstTimeCreator
        };
      } else if (trust && typeof t.creator === 'string') {
        t.creatorTrust = {
          teamsCreated: trust.teamsCreated,
          teamsCompleted: trust.teamsCompleted,
          averageRatingReceived: trust.averageRatingReceived,
          totalReviews: trust.totalReviews,
          isFirstTimeCreator: trust.isFirstTimeCreator
        };
      }
    }
  }));
};

const attachCreatorTrustSingle = async (teamObj) => {
  if (!teamObj || !teamObj.creator) return;
  const creatorId = (teamObj.creator._id || teamObj.creator.id || teamObj.creator).toString();
  const trust = await teamBadgeService.getCreatorTrust(creatorId);
  if (trust && typeof teamObj.creator === 'object') {
    teamObj.creator.creatorTrust = trust;
  } else if (trust && typeof teamObj.creator === 'string') {
    teamObj.creatorTrust = trust;
  }
};

// @desc    Get all teams (with pagination, search, filters)
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const { search, category, status, role, skill, institution, sort = 'newest', page = 1, limit = 10 } = req.query;

    let query = {};

    if (institution) {
      query.institution = institution;
    } else if (institution === false || institution === 'none') {
      query.institution = { $exists: false };
    }

    if (status && status !== 'all') {
      query.status = status;
    } else if (!status) {
      query.status = 'open';
    }

    if (category) query.category = category;
    if (role) query.requiredRoles = role;
    if (skill) query.requiredSkills = skill;
    if (search) {
      query.$text = { $search: search };
    }

    // Default to visibility public
    query.visibility = { $ne: 'invite-only' };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortObj = { createdAt: -1 };
    if (search) {
      sortObj = { score: { $meta: 'textScore' } };
    } else if (sort === 'deadline-soonest') {
      sortObj = { deadline: 1, createdAt: -1 };
      // Make sure we only show things with a deadline if sorted by deadline, or put them first
    } else if (sort === 'oldest') {
      sortObj = { createdAt: 1 };
    }

    let teams = [];
    const total = await Team.countDocuments(query);

    if (sort === 'most-applicants' && !search) {
      // Use aggregation to join with TeamApplications and sort by count
      const pipeline = [
        { $match: query },
        { $lookup: { from: 'teamapplications', localField: '_id', foreignField: 'team', as: 'apps' } },
        { $addFields: { applicantCount: { $size: '$apps' } } },
        { $sort: { applicantCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $project: { apps: 0 } }
      ];
      teams = await Team.aggregate(pipeline);
      
      // Populate creator manually
      await Team.populate(teams, { path: 'creator', select: 'username full_name avatar' });
    } else {
      teams = await Team.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('creator', 'username full_name avatar')
        .lean();
    }

    await attachCreatorTrustList(teams);

    res.status(200).json({
      success: true,
      count: teams.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: teams
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single team by ID
// @route   GET /api/teams/:id
// @access  Private
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('creator', 'username full_name avatar')
      .lean();

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // View tracking
    await Team.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    // Count pending applications
    const pendingCount = await TeamApplication.countDocuments({ team: team._id, status: 'pending' });

    await attachCreatorTrustSingle(team);

    res.status(200).json({
      success: true,
      data: { ...team, pendingApplications: pendingCount }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { title, description, teamSize, requiredRoles, requiredSkills, category, deadline, tags, institution } = req.body;

    if (!title || !description || !teamSize || !teamSize.max) {
      return res.status(400).json({ success: false, message: 'Please provide title, description, and max team size' });
    }

    // Content Moderation
    const modTitle = await assessModeration(title);
    const modDesc = await assessModeration(description);
    if (modTitle.flagged || modDesc.flagged) {
      return res.status(400).json({ success: false, message: 'Your team contains flagged content and cannot be created.' });
    }

    // Shadow Banning Check: >=3 actioned reports in 90 days against teams created by this user
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Find all teams created by this user
    const userTeams = await Team.find({ creator: req.user.id }, '_id');
    const userTeamIds = userTeams.map(t => t._id);
    
    // Count actioned reports against these teams in the last 90 days
    const actionedReportsCount = await TeamReport.countDocuments({
      team: { $in: userTeamIds },
      status: 'actioned',
      createdAt: { $gte: ninetyDaysAgo }
    });

    const teamStatus = actionedReportsCount >= 3 ? 'requires_admin_approval' : 'open';

    const teamData = {
      title,
      name: title, // for backwards compatibility
      description,
      creator: req.user.id,
      teamSize: {
        current: 1, // Creator counts as 1
        max: parseInt(teamSize.max)
      },
      requiredRoles: requiredRoles || [],
      requiredSkills: requiredSkills || [],
      category: category || 'Other',
      deadline: deadline ? new Date(deadline) : null,
      tags: tags || [],
      status: teamStatus
    };

    if (institution) {
      teamData.institution = institution;
    }

    const team = await Team.create(teamData);

    res.status(201).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team creator
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this team' });
    }

    // Allowed fields to update
    const { title, description, teamSize, requiredRoles, requiredSkills, category, status, deadline, tags } = req.body;

    if (title) { team.title = title; team.name = title; }
    if (description) team.description = description;
    if (teamSize && teamSize.max) team.teamSize.max = parseInt(teamSize.max);
    if (requiredRoles) team.requiredRoles = requiredRoles;
    if (requiredSkills) team.requiredSkills = requiredSkills;
    if (category) team.category = category;
    if (status) team.status = status;
    if (deadline !== undefined) team.deadline = deadline ? new Date(deadline) : null;
    if (tags) team.tags = tags;

    // Check if max is now smaller than current
    if (team.teamSize.max < team.teamSize.current) {
      return res.status(400).json({ success: false, message: 'Max team size cannot be smaller than current team size' });
    }

    await team.save();

    res.status(200).json({
      success: true,
      data: team
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Soft delete team
// @route   DELETE /api/teams/:id
// @access  Private
exports.deleteTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Make sure user is team creator
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this team' });
    }

    // Soft delete
    team.status = 'closed';
    await team.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Apply to a team
// @route   POST /api/teams/:id/apply
// @access  Private
exports.applyToTeam = async (req, res) => {
  try {
    const { message, skillsOffered } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Team is not open for applications' });
    }

    if (team.creator.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot apply to your own team' });
    }

    if (team.teamSize.current >= team.teamSize.max) {
      return res.status(400).json({ success: false, message: 'Team is already full' });
    }

    // Check if already applied
    const existingApp = await TeamApplication.findOne({ team: teamId, applicant: req.user.id });
    if (existingApp) {
      return res.status(409).json({ success: false, message: 'You have already applied to this team' });
    }

    const application = await TeamApplication.create({
      team: teamId,
      applicant: req.user.id,
      message,
      skillsOffered: skillsOffered || []
    });

    // Notify creator
    await sendNotification({
      userId: team.creator.toString(),
      type: 'team_application',
      actorId: req.user.id,
      relatedContentId: team._id.toString(),
      title: 'New Team Application',
      body: `Someone applied to join your team: ${team.title}`
    });

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this team' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get team applicants
// @route   GET /api/teams/:id/applicants
// @access  Private
exports.getTeamApplicants = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants for this team' });
    }

    const applicants = await TeamApplication.find({ team: req.params.id })
      .populate('applicant', 'username full_name avatar email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applicants
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update application status
// @route   PUT /api/teams/:id/applicants/:applicationId
// @access  Private
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const application = await TeamApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.team.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Application does not belong to this team' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Application is already ${application.status}` });
    }

    if (status === 'accepted') {
      if (team.teamSize.current >= team.teamSize.max) {
        return res.status(400).json({ success: false, message: 'Team is already full' });
      }

      // Increment team size safely using $inc
      const updatedTeam = await Team.findOneAndUpdate(
        { _id: team._id, 'teamSize.current': { $lt: team.teamSize.max } },
        { $inc: { 'teamSize.current': 1 } },
        { new: true }
      );

      if (!updatedTeam) {
        // This means the condition failed, so team is full
        return res.status(400).json({ success: false, message: 'Team became full concurrently' });
      }

      application.status = 'accepted';
      await application.save();

      // If team is now full, auto-close it
      if (updatedTeam.teamSize.current >= updatedTeam.teamSize.max) {
        updatedTeam.status = 'full';
        await updatedTeam.save();
      }

      // Notify applicant
      await sendNotification({
        userId: application.applicant.toString(),
        type: 'team_application_accepted',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Application Accepted!',
        body: `Your application to join ${team.title} was accepted!`
      });

    } else if (status === 'rejected') {
      application.status = 'rejected';
      await application.save();

      // Find second chance alternative teams
      let secondChanceMatches = [];
      try {
        secondChanceMatches = await secondChanceService.findAlternativeTeams(application.applicant.toString(), team._id.toString());
      } catch (scErr) {
        console.error('[SecondChanceService] Error finding alternative teams:', scErr.message || scErr);
      }

      let notifBody = `Your application to join ${team.title} was declined. See how to build the skills for this team →`;
      if (secondChanceMatches && secondChanceMatches.length > 0) {
        notifBody = `Your application to join ${team.title} was declined. ${secondChanceMatches.length} other ${secondChanceMatches.length === 1 ? 'team is' : 'teams are'} looking for someone like you!`;
      }

      // Notify applicant with actionable skill gap advisor link and second chance matches
      await sendNotification({
        userId: application.applicant.toString(),
        type: 'team_application_rejected',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Application Status Update',
        body: notifBody,
        metadata: {
          secondChanceMatches: secondChanceMatches || []
        }
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Withdraw application
// @route   DELETE /api/teams/:id/applicants/:applicationId
// @access  Private
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await TeamApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.applicant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application' });
    }

    if (application.team.toString() !== req.params.id) {
      return res.status(400).json({ success: false, message: 'Application does not belong to this team' });
    }

    // Only allow withdraw if pending (optional product decision, but usually accepted ones should leave through a different flow if any)
    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Cannot withdraw an application that is already ${application.status}` });
    }

    application.status = 'withdrawn';
    await application.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// @desc    Mark team as complete
// @route   PUT /api/teams/:id/complete
// @access  Private
exports.completeTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can complete the team' });
    }

    if (team.status === 'completed' || team.status === 'closed') {
      return res.status(400).json({ success: false, message: `Team is already ${team.status}` });
    }

    team.status = 'completed';
    team.completedAt = Date.now();
    await team.save();

    // Notify all accepted members
    const members = await TeamApplication.find({ team: team._id, status: 'accepted' });
    for (const member of members) {
      await sendNotification({
        userId: member.applicant.toString(),
        type: 'team_completed',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Project Completed!',
        body: `The team ${team.title} has marked the project as complete. Please leave a review for your teammates!`
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Disband team
// @route   PUT /api/teams/:id/disband
// @access  Private
exports.disbandTeam = async (req, res) => {
  try {
    const { disbandReason } = req.body;
    if (!disbandReason) return res.status(400).json({ success: false, message: 'Please provide a reason for disbanding' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can disband the team' });
    }

    if (team.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Team is already closed' });
    }

    team.status = 'closed';
    team.disbandReason = disbandReason;
    await team.save();

    // Notify all accepted members
    const members = await TeamApplication.find({ team: team._id, status: 'accepted' });
    for (const member of members) {
      await sendNotification({
        userId: member.applicant.toString(),
        type: 'team_disbanded',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Team Disbanded',
        body: `The team ${team.title} has been disbanded. Reason: ${disbandReason}`
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove an accepted member
// @route   PUT /api/teams/:id/members/:userId/remove
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can remove members' });
    }

    const application = await TeamApplication.findOne({ team: team._id, applicant: req.params.userId, status: 'accepted' });
    if (!application) {
      return res.status(404).json({ success: false, message: 'User is not an accepted member of this team' });
    }

    // Decrement team size
    team.teamSize.current = Math.max(1, team.teamSize.current - 1);
    if (team.status === 'full' && team.teamSize.current < team.teamSize.max) {
      team.status = 'open'; // Re-open if it was full
    }
    await team.save();

    application.status = 'removed';
    await application.save();

    await sendNotification({
      userId: req.params.userId,
      type: 'team_member_removed',
      actorId: req.user.id,
      relatedContentId: team._id.toString(),
      title: 'Removed from Team',
      body: `You have been removed from the team: ${team.title}`
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get my created and joined teams
// @route   GET /api/teams/me
// @access  Private
exports.getMyTeams = async (req, res) => {
  try {
    // 1. Teams I created
    const createdTeams = await Team.find({ creator: req.user.id }).sort({ createdAt: -1 }).lean();
    
    // 2. Teams I joined (accepted applications)
    const acceptedApps = await TeamApplication.find({ applicant: req.user.id, status: 'accepted' }).populate('team');
    const joinedTeams = acceptedApps.map(app => app.team).filter(t => t && t.creator.toString() !== req.user.id);

    res.status(200).json({
      success: true,
      data: { created: createdTeams, joined: joinedTeams }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Mark team as complete
// @route   PUT /api/teams/:id/complete
// @access  Private
exports.completeTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can complete the team' });
    }

    if (team.status === 'completed' || team.status === 'closed') {
      return res.status(400).json({ success: false, message: `Team is already ${team.status}` });
    }

    team.status = 'completed';
    team.completedAt = Date.now();
    await team.save();

    // Notify all accepted members
    const members = await TeamApplication.find({ team: team._id, status: 'accepted' });
    for (const member of members) {
      await sendNotification({
        userId: member.applicant.toString(),
        type: 'team_completed',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Project Completed!',
        body: `The team ${team.title} has marked the project as complete. Please leave a review for your teammates!`
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Disband team
// @route   PUT /api/teams/:id/disband
// @access  Private
exports.disbandTeam = async (req, res) => {
  try {
    const { disbandReason } = req.body;
    if (!disbandReason) return res.status(400).json({ success: false, message: 'Please provide a reason for disbanding' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can disband the team' });
    }

    if (team.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Team is already closed' });
    }

    team.status = 'closed';
    team.disbandReason = disbandReason;
    await team.save();

    // Notify all accepted members
    const members = await TeamApplication.find({ team: team._id, status: 'accepted' });
    for (const member of members) {
      await sendNotification({
        userId: member.applicant.toString(),
        type: 'team_disbanded',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Team Disbanded',
        body: `The team ${team.title} has been disbanded. Reason: ${disbandReason}`
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Remove an accepted member
// @route   PUT /api/teams/:id/members/:userId/remove
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });
    
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only creator can remove members' });
    }

    const application = await TeamApplication.findOne({ team: team._id, applicant: req.params.userId, status: 'accepted' });
    if (!application) {
      return res.status(404).json({ success: false, message: 'User is not an accepted member of this team' });
    }

    // Decrement team size
    team.teamSize.current = Math.max(1, team.teamSize.current - 1);
    if (team.status === 'full' && team.teamSize.current < team.teamSize.max) {
      team.status = 'open'; // Re-open if it was full
    }
    await team.save();

    application.status = 'removed';
    await application.save();

    await sendNotification({
      userId: req.params.userId,
      type: 'team_member_removed',
      actorId: req.user.id,
      relatedContentId: team._id.toString(),
      title: 'Removed from Team',
      body: `You have been removed from the team: ${team.title}`
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get my created and joined teams
// @route   GET /api/teams/me
// @access  Private
exports.getMyTeams = async (req, res) => {
  try {
    // 1. Teams I created
    const createdTeams = await Team.find({ creator: req.user.id }).sort({ createdAt: -1 }).lean();
    
    // 2. Teams I joined (accepted applications)
    const acceptedApps = await TeamApplication.find({ applicant: req.user.id, status: 'accepted' }).populate('team');
    const joinedTeams = acceptedApps.map(app => app.team).filter(t => t && t.creator.toString() !== req.user.id);

    res.status(200).json({
      success: true,
      data: { created: createdTeams, joined: joinedTeams }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get my applications
// @route   GET /api/teams/applications/me
// @access  Private
exports.getMyApplications = async (req, res) => {
  try {
    const apps = await TeamApplication.find({ applicant: req.user.id })
      .populate('team')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: apps
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get match score for a specific team
// @route   GET /api/teams/:id/match-score
// @access  Private
exports.getMatchScore = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userSkills = (user.skills || []).map(s => s.skillName).concat((user.verifiedSkills || []).map(s => s.skill));
    
    const match = calculateMatchScore(userSkills, team.requiredSkills);

    res.status(200).json({
      success: true,
      data: match
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get recommended teams for logged in user
// @route   GET /api/teams/recommended
// @access  Private
exports.getRecommendedTeams = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userSkills = (user.skills || []).map(s => s.skillName).concat((user.verifiedSkills || []).map(s => s.skill));

    // Get open teams
    const teams = await Team.find({ status: 'open' })
      .populate('creator', 'username full_name avatar')
      .limit(50)
      .lean();

    // Calculate score for each
    const scoredTeams = teams.map(team => {
      const match = calculateMatchScore(userSkills, team.requiredSkills);
      return {
        ...team,
        matchScore: match.score,
        matchDetails: match
      };
    });

    // Sort by score descending
    scoredTeams.sort((a, b) => b.matchScore - a.matchScore);

    await attachCreatorTrustList(scoredTeams);

    res.status(200).json({
      success: true,
      data: scoredTeams
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Report a team
// @route   POST /api/teams/:id/report
// @access  Private
exports.reportTeam = async (req, res) => {
  try {
    const { reason, details } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Check duplicate
    const existing = await TeamReport.findOne({ team: team._id, reportedBy: req.user.id, status: 'pending' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have a pending report for this team' });
    }

    await TeamReport.create({
      team: team._id,
      reportedBy: req.user.id,
      reason,
      details
    });

    // Check flag threshold
    const pendingCount = await TeamReport.countDocuments({ team: team._id, status: 'pending' });
    if (pendingCount >= 3) {
      team.flagged = true;
      team.reportCount = pendingCount;
      await team.save();
    } else {
      team.reportCount = pendingCount;
      await team.save();
    }

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Phase 4: Chat & Match Explanations
const teamMatchExplainer = require('../services/teamMatchExplainer');
const TeamMessage = require('../models/TeamMessage');

exports.getMatchExplanation = async (req, res) => {
  try {
    const explanation = await teamMatchExplainer.generateExplanation(req.params.id, req.user.id);
    res.json({ success: true, explanation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getTeamMessages = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    let hasAccess = false;
    if (team.creator.toString() === req.user.id) {
      hasAccess = true;
    } else {
      const applicant = await TeamApplication.findOne({ team: req.params.id, applicant: req.user.id, status: 'accepted' });
      if (applicant) hasAccess = true;
    }

    if (!hasAccess) return res.status(403).json({ message: 'Not authorized' });

    let { cursor, limit = 50 } = req.query;
    limit = Math.min(parseInt(limit), 50); // Hard cap limit

    let query = { team: req.params.id };
    if (cursor) {
      // Decode cursor (assuming base64 encoded _id or just passing _id directly for simplicity)
      query._id = { $lt: cursor };
    }

    const messages = await TeamMessage.find(query)
      .populate('sender', 'username full_name avatar_url')
      .sort({ _id: -1 }) // Sort by _id descending to get newest before cursor
      .limit(limit);

    // Reverse to send oldest first for UI
    messages.reverse();
    
    let nextCursor = null;
    if (messages.length > 0) {
      nextCursor = messages[0]._id; // The oldest message in this batch is the cursor for the next batch
    }

    res.json({ success: true, messages, nextCursor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.sendTeamMessage = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    let hasAccess = false;
    if (team.creator.toString() === req.user.id) {
      hasAccess = true;
    } else {
      const applicant = await TeamApplication.findOne({ team: req.params.id, applicant: req.user.id, status: 'accepted' });
      if (applicant) hasAccess = true;
    }

    if (!hasAccess) return res.status(403).json({ message: 'Not authorized' });

    if (req.body.content) {
      const modResult = await assessModeration(req.body.content);
      if (modResult.flagged) {
        return res.status(400).json({ message: 'Message contains flagged content and was blocked.' });
      }
    }

    const message = new TeamMessage({
      team: req.params.id,
      sender: req.user.id,
      content: req.body.content || '',
      type: req.body.type || 'text',
      attachments: req.body.attachments || [],
      readBy: [{ user: req.user.id, readAt: Date.now() }]
    });

    await message.save();
    const populated = await message.populate('sender', 'username full_name avatar_url');

    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
const TeamCallSession = require('../models/TeamCallSession');

// @desc    Start a Team Call (Ad-Hoc Session)
// @route   POST /api/teams/:id/calls/start
// @access  Private
exports.startCall = async (req, res) => {
  try {
    const { external_video_url } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

    // Ensure user is an accepted member or creator
    const isCreator = team.creator.toString() === req.user.id;
    const member = await TeamApplication.findOne({ team: team._id, applicant: req.user.id, status: 'accepted' });
    
    if (!isCreator && !member) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!external_video_url) {
      return res.status(400).json({ success: false, message: 'Missing external_video_url' });
    }

    const session = await TeamCallSession.create({
      team: team._id,
      startedBy: req.user.id,
      external_video_url,
      participants: [{ user: req.user.id }]
    });

    res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Join a Team Call
// @route   POST /api/teams/:id/calls/:sessionId/join
// @access  Private
exports.joinCall = async (req, res) => {
  try {
    const session = await TeamCallSession.findById(req.params.sessionId);
    if (!session || session.team.toString() !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.endedAt) {
      return res.status(400).json({ success: false, message: 'Session has ended' });
    }

    const participant = session.participants.find(p => p.user.toString() === req.user.id && !p.leftAt);
    if (!participant) {
      session.participants.push({ user: req.user.id });
      await session.save();
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Leave a Team Call
// @route   POST /api/teams/:id/calls/:sessionId/leave
// @access  Private

// @desc    Leave a video/audio call session
// @route   PUT /api/teams/:id/call/:sessionId/leave
// @access  Private
exports.leaveCall = async (req, res) => {
  try {
    const session = await TeamCallSession.findById(req.params.sessionId);
    if (!session || session.team.toString() !== req.params.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const participant = session.participants.find(p => p.user.toString() === req.user.id && !p.leftAt);
    if (participant) {
      participant.leftAt = Date.now();
      
      // If startedBy left, or everyone left, maybe end the session. Let's just end it if everyone left.
      const activeParticipants = session.participants.filter(p => !p.leftAt);
      if (activeParticipants.length === 0) {
        session.endedAt = Date.now();
      }
      
      await session.save();
    }

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get Team Leaderboard
// @route   GET /api/teams/leaderboard
// @access  Private
exports.getTeamLeaderboard = async (req, res) => {
  try {
    const { institution, limit = 20 } = req.query;
    const cacheKey = `team_leaderboard_${institution || 'all'}_${limit}`;
    const cached = teamCache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });
    
    let matchQuery = { status: 'completed' };
    if (institution && institution !== 'all') {
      const mongoose = require('mongoose');
      matchQuery.institution = new mongoose.Types.ObjectId(institution);
    }

    const leaderboard = await Team.aggregate([
      { $match: matchQuery },
      { $lookup: { from: 'users', localField: 'creator', foreignField: '_id', as: 'creatorObj' } },
      { $unwind: { path: '$creatorObj', preserveNullAndEmptyArrays: true } },
      { $project: {
          title: 1,
          category: 1,
          completedAt: 1,
          creator: {
            _id: '$creatorObj._id',
            username: '$creatorObj.username',
            avatar: '$creatorObj.avatar',
            full_name: '$creatorObj.full_name'
          },
          // Fake rating for now as it's not in the schema, or use 5 if completed
          rating: { $literal: 5 },
          score: { $literal: 100 }
      }},
      { $sort: { score: -1, completedAt: -1 } },
      { $limit: parseInt(limit) }
    ]);

    teamCache.set(cacheKey, leaderboard);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get User Leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
exports.getUserLeaderboard = async (req, res) => {
  try {
    const { institution, limit = 20 } = req.query;
    const cacheKey = `user_leaderboard_${institution || 'all'}_${limit}`;
    const cached = teamCache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });
    
    let matchQuery = {};
    if (institution && institution !== 'all') {
      const mongoose = require('mongoose');
      matchQuery.institutionId = new mongoose.Types.ObjectId(institution);
    }

    const leaderboard = await User.aggregate([
      { $match: matchQuery },
      // Look up teams where user was accepted member or creator
      { $lookup: {
          from: 'teamapplications',
          "let": { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ['$applicant', '$$userId'] },
                { $eq: ['$status', 'accepted'] }
              ]}
            }},
            { $lookup: { from: 'teams', localField: 'team', foreignField: '_id', as: 'teamObj' } },
            { $unwind: '$teamObj' },
            { $match: { 'teamObj.status': 'completed' } }
          ],
          as: 'acceptedApps'
      }},
      { $lookup: {
          from: 'teams',
          "let": { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [
                { $eq: ['$creator', '$$userId'] },
                { $eq: ['$status', 'completed'] }
              ]}
            }}
          ],
          as: 'createdTeams'
      }},
      { $addFields: {
          completedProjects: { $add: [{ $size: '$acceptedApps' }, { $size: '$createdTeams' }] }
      }},
      { $match: { completedProjects: { $gt: 0 } } },
      { $addFields: {
          // Since rating isn't in schema, fake score based on completed projects
          score: { $multiply: ['$completedProjects', 100] }
      }},
      { $project: {
          username: 1,
          full_name: 1,
          avatar: 1,
          completedProjects: 1,
          score: 1,
          institutionId: 1
      }},
      { $sort: { score: -1, completedProjects: -1 } },
      { $limit: parseInt(limit) }
    ]);

    teamCache.set(cacheKey, leaderboard);
    res.status(200).json({ success: true, data: leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// @desc    Get team analytics
// @route   GET /api/teams/:id/analytics
// @access  Private
exports.getTeamAnalytics = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const applications = await TeamApplication.find({ team: team._id })
      .populate('applicant', 'skills')
      .lean();

    const totalApplications = applications.length;
    const acceptedApplications = applications.filter(a => a.status === 'accepted').length;
    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;

    let high = 0;
    let medium = 0;
    let low = 0;

    const reqSkills = (team.requiredSkills || []).map(s => s.toLowerCase());

    applications.forEach(app => {
      if (reqSkills.length === 0) {
        high++;
      } else {
        const appSkills = [
          ...(app.skillsOffered || []).map(s => s.toLowerCase()),
          ...(app.applicant?.skills || []).map(s => s.toLowerCase())
        ];
        const matched = reqSkills.filter(rs => appSkills.some(as => as.includes(rs) || rs.includes(as))).length;
        const score = Math.round((matched / reqSkills.length) * 100);
        if (score >= 70) high++;
        else if (score >= 40) medium++;
        else low++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        views: (team.views || 0) + 1,
        totalApplications,
        acceptanceRate,
        matchScoreDistribution: { high, medium, low }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get skill gap advice and curated course recommendations for a user against a team
// @route   GET /api/teams/:id/skill-gap
// @access  Private
exports.getTeamSkillGap = async (req, res) => {
  try {
    const advice = await skillGapAdvisor.getAdviceForUserTeam(req.user.id, req.params.id, req.query.trigger || 'low_match_view');
    res.status(200).json({ success: true, data: advice });
  } catch (err) {
    console.error('Error in getTeamSkillGap:', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get trending/recurring skill gaps for current user across all teams
// @route   GET /api/users/me/skill-gaps/trending OR /api/teams/users/me/skill-gaps/trending
// @access  Private
exports.getTrendingSkillGaps = async (req, res) => {
  try {
    const trending = await skillGapAdvisor.getTrendingGaps(req.user.id);
    res.status(200).json({ success: true, data: trending });
  } catch (err) {
    console.error('Error in getTrendingSkillGaps:', err.message || err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get second chance match alternatives for a rejected applicant
// @route   GET /api/teams/:id/second-chance
// @access  Private
exports.getSecondChanceMatches = async (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;

    // Check if user has a rejected application for this team
    const rejectedApp = await TeamApplication.findOne({
      team: teamId,
      applicant: userId,
      status: 'rejected'
    });

    if (!rejectedApp) {
      return res.status(403).json({
        success: false,
        message: 'You must have a rejected application for this team to view second chance alternatives.'
      });
    }

    const matches = await secondChanceService.findAlternativeTeams(userId, teamId, 'on_demand_view');

    res.status(200).json({
      success: true,
      data: matches
    });
  } catch (err) {
    console.error('[getSecondChanceMatches]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
