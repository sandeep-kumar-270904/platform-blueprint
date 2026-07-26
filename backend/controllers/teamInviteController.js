const Team = require('../models/Team');
const TeamInvite = require('../models/TeamInvite');
const TeamApplication = require('../models/TeamApplication');
const { sendNotification } = require('../services/notificationService');

// @desc    Invite a user to a team
// @route   POST /api/teams/:id/invites
// @access  Private
exports.createInvite = async (req, res) => {
  try {
    const teamId = req.params.id;
    const { invitedUserId } = req.body;

    if (!invitedUserId) {
      return res.status(400).json({ success: false, message: 'Please provide a user to invite' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Must be creator to invite
    if (team.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the creator can invite members' });
    }

    if (team.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Cannot invite to a closed or full team' });
    }

    if (team.teamSize.current >= team.teamSize.max) {
      return res.status(400).json({ success: false, message: 'Team is already full' });
    }

    // Check if already a member (accepted application)
    const existingApp = await TeamApplication.findOne({ team: teamId, applicant: invitedUserId, status: 'accepted' });
    if (existingApp) {
      return res.status(400).json({ success: false, message: 'User is already a member of this team' });
    }

    // Check if already invited and pending
    const existingInvite = await TeamInvite.findOne({ team: teamId, invitedUser: invitedUserId, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'User already has a pending invite' });
    }

    const invite = await TeamInvite.create({
      team: teamId,
      invitedUser: invitedUserId,
      invitedBy: req.user.id
    });

    // Notify user
    await sendNotification({
      userId: invitedUserId,
      type: 'team_invite',
      actorId: req.user.id,
      relatedContentId: team._id.toString(),
      title: 'New Team Invitation',
      body: `You have been invited to join ${team.title}`
    });

    res.status(201).json({
      success: true,
      data: invite
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Invite already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get my pending invites
// @route   GET /api/users/me/invites
// @access  Private
exports.getMyInvites = async (req, res) => {
  try {
    const invites = await TeamInvite.find({ invitedUser: req.user.id, status: 'pending' })
      .populate('team', 'title description category status teamSize requiredRoles requiredSkills deadline')
      .populate('invitedBy', 'username full_name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invites.length,
      data: invites
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Respond to invite (accept/decline)
// @route   PUT /api/invites/:id/respond
// @access  Private
exports.respondToInvite = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or declined' });
    }

    const invite = await TeamInvite.findById(req.params.id).populate('team');
    
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }

    if (invite.invitedUser.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this invite' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Invite already ${invite.status}` });
    }

    const team = invite.team;

    if (status === 'accepted') {
      if (team.status !== 'open' || team.teamSize.current >= team.teamSize.max) {
        return res.status(400).json({ success: false, message: 'Team is no longer open or is full' });
      }

      // Concurrency guard: increment if room available
      const updatedTeam = await Team.findOneAndUpdate(
        { _id: team._id, 'teamSize.current': { $lt: team.teamSize.max } },
        { $inc: { 'teamSize.current': 1 } },
        { new: true }
      );

      if (!updatedTeam) {
        return res.status(400).json({ success: false, message: 'Team became full concurrently' });
      }

      invite.status = 'accepted';
      await invite.save();

      // Create an accepted application record for consistency in "My Teams" view
      await TeamApplication.findOneAndUpdate(
        { team: team._id, applicant: req.user.id },
        { status: 'accepted', message: 'Joined via invite' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (updatedTeam.teamSize.current >= updatedTeam.teamSize.max) {
        updatedTeam.status = 'full';
        await updatedTeam.save();
      }

      // Notify creator
      await sendNotification({
        userId: team.creator.toString(),
        type: 'team_invite_accepted',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Invite Accepted',
        body: `Your invite to join ${team.title} was accepted!`
      });

    } else if (status === 'declined') {
      invite.status = 'declined';
      await invite.save();

      // Notify creator
      await sendNotification({
        userId: team.creator.toString(),
        type: 'team_invite_declined',
        actorId: req.user.id,
        relatedContentId: team._id.toString(),
        title: 'Invite Declined',
        body: `Your invite to join ${team.title} was declined.`
      });
    }

    res.status(200).json({
      success: true,
      data: invite
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
