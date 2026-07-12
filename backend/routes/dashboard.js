const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Note = require('../models/Note');
const Idea = require('../models/Idea');
const StudyGroup = require('../models/StudyGroup');
const Notification = require('../models/Notification');
const VirtualClassroom = require('../models/VirtualClassroom');

// GET /api/dashboard/stats
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Aggregate notes stats
    const notes = await Note.find({ user_id: userId });
    const views = notes.reduce((sum, n) => sum + (n.views || 0), 0);
    const downloads = notes.reduce((sum, n) => sum + (n.downloads || 0), 0);
    
    const ideasCount = await Idea.countDocuments({ user_id: userId });
    
    // Check if user is part of a study group
    const teamsCount = await StudyGroup.countDocuments({ 
      $or: [ { creator_id: userId }, { 'members.user_id': userId } ]
    });
    
    const notificationsCount = await Notification.countDocuments({ userId: userId, isRead: false });
    
    res.json({
      notes: { total: notes.length, views, downloads },
      ideas: ideasCount,
      teams: teamsCount,
      notifications: notificationsCount,
      gamification: { points: 1250, level: 5, rank: 'Scholar', next_level_points: 2000 }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/host
router.get('/host', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const sessions = await VirtualClassroom.find({ host_id: userId }).sort({ scheduled_at: 1 });
    // Assume templates are empty for now as it's a mock
    const templates = [];
    
    res.json({ sessions, templates });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notes = await Note.find({ user_id: userId })
      .select('title views downloads rating')
      .sort({ views: -1 });
    
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');

// GET /api/dashboard/join-requests
router.get('/join-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Get all ideas owned by the user
    const userIdeas = await Idea.find({ user_id: userId });
    const ideaIds = userIdeas.map(i => i._id);
    
    // Find all pending join requests for these ideas
    const requests = await JoinRequest.find({ idea_id: { $in: ideaIds }, status: 'pending' }).sort({ created_at: -1 });
    
    // Enrich with idea title and applicant name
    const applicantIds = [...new Set(requests.map(r => r.user_id))];
    const applicants = await User.find({ _id: { $in: applicantIds } }).select('username');
    const applicantMap = applicants.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const ideaMap = userIdeas.reduce((acc, i) => { acc[i._id] = i; return acc; }, {});
    
    const enriched = requests.map(r => {
      const rObj = r.toObject();
      rObj.id = r._id;
      rObj.idea_title = ideaMap[r.idea_id]?.title || 'Unknown Idea';
      rObj.applicant_name = applicantMap[r.user_id]?.username || 'Unknown User';
      return rObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dashboard/join-requests/:id/accept
router.post('/join-requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndUpdate(req.params.id, { status: 'accepted' }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    
    // In a real app we would add the user to the team here
    // const TeamMember = require('../models/TeamMember');
    // await new TeamMember({ team_id: request.team_id || request.idea_id, user_id: request.user_id, role: request.requested_role }).save();
    
    res.json({ message: 'Accepted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/dashboard/join-requests/:id/reject
router.post('/join-requests/:id/reject', authMiddleware, async (req, res) => {
  try {
    const request = await JoinRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json({ message: 'Rejected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
