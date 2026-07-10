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
    
    const notificationsCount = await Notification.countDocuments({ user_id: userId, is_read: false });
    
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

module.exports = router;
