const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Idea = require('../models/Idea');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Task = require('../models/Task');
const TeamMessage = require('../models/TeamMessage');
const mongoose = require('mongoose');

// =======================
// IDEAS
// =======================

// GET /api/innovation/ideas
router.get('/ideas', async (req, res) => {
  try {
    const ideas = await Idea.find({ is_public: true }).sort({ created_at: -1 });
    
    // Enrich with profiles
    const userIds = [...new Set(ideas.map(i => i.user_id))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const enriched = ideas.map(i => {
      const iObj = i.toObject();
      iObj.profile = profileMap[i.user_id] || undefined;
      return iObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/innovation/ideas
router.post('/ideas', authMiddleware, async (req, res) => {
  try {
    const newIdea = new Idea({
      user_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      tags: req.body.tags || [],
      status: req.body.status || 'draft',
      is_public: req.body.is_public !== undefined ? req.body.is_public : true
    });
    await newIdea.save();
    res.status(201).json(newIdea);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/innovation/ideas/:id
router.get('/ideas/:id', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    
    const profile = await User.findById(idea.user_id).select('username avatar_url');
    const ideaObj = idea.toObject();
    ideaObj.profile = profile;
    
    res.json(ideaObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/innovation/ideas/:id/upvote
router.post('/ideas/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const idea = await Idea.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    
    if (req.io) {
      req.io.emit('ideas-realtime', { action: 'update', data: idea });
    }
    
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// IDEA MESSAGES
// =======================

// GET /api/innovation/ideas/:id/messages
router.get('/ideas/:id/messages', async (req, res) => {
  try {
    // In a real app this would query an IdeaMessage collection.
    // Re-using TeamMessage logic as generic messages for demo purposes.
    const messages = await TeamMessage.find({ team_id: req.params.id }).sort({ created_at: 1 }).limit(100);
    
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const enriched = messages.map(m => {
      const mObj = m.toObject();
      mObj.user = profileMap[m.user_id];
      return mObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/innovation/ideas/:id/messages
router.post('/ideas/:id/messages', authMiddleware, async (req, res) => {
  try {
    const newMessage = new TeamMessage({
      team_id: req.params.id, // using idea id here
      user_id: req.user.id,
      content: req.body.content,
      message_type: req.body.message_type || 'text',
      reply_to: req.body.reply_to
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// TEAMS & DASHBOARD
// =======================

// GET /api/innovation/teams/:id
router.get('/teams/:id', authMiddleware, async (req, res) => {
  try {
    // Check if team exists. If not, create mock data for demonstration
    let team = await Team.findById(req.params.id);
    if (!team) {
      // Return 404 for actual missing, but for demo UI we might just return empty if valid ID
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const members = await TeamMember.find({ team_id: req.params.id });
    
    // Fetch profiles for members
    const userIds = members.map(m => m.user_id);
    const profiles = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const enrichedMembers = members.map(m => {
      const mObj = m.toObject();
      mObj.profile = profileMap[m.user_id];
      return mObj;
    });
    
    const ideasCount = await Idea.countDocuments({ team_id: req.params.id });
    const tasks = await Task.find({ team_id: req.params.id });
    const messagesCount = await TeamMessage.countDocuments({ team_id: req.params.id });
    
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    
    res.json({
      team,
      members: enrichedMembers,
      stats: {
        ideas: ideasCount,
        tasks: tasks.length,
        completedTasks,
        messages: messagesCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// TASKS
// =======================

// GET /api/innovation/teams/:id/tasks
router.get('/teams/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ team_id: req.params.id }).sort({ created_at: -1 });
    
    const userIds = [...new Set(tasks.map(t => t.assigned_to).filter(Boolean))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const enriched = tasks.map(t => {
      const tObj = t.toObject();
      if (t.assigned_to) tObj.assignee = profileMap[t.assigned_to];
      return tObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/innovation/teams/:id/tasks
router.post('/teams/:id/tasks', authMiddleware, async (req, res) => {
  try {
    const newTask = new Task({
      team_id: req.params.id,
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status || 'todo',
      required_skills: req.body.required_skills || [],
      created_by: req.user.id
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/innovation/tasks/:taskId
router.put('/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.taskId, { status: req.body.status }, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// TEAM MESSAGES
// =======================

// GET /api/innovation/teams/:id/messages
router.get('/teams/:id/messages', authMiddleware, async (req, res) => {
  try {
    const messages = await TeamMessage.find({ team_id: req.params.id }).sort({ created_at: 1 }).limit(100);
    
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    const enriched = messages.map(m => {
      const mObj = m.toObject();
      mObj.user = profileMap[m.user_id];
      return mObj;
    });
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/innovation/teams/:id/messages
router.post('/teams/:id/messages', authMiddleware, async (req, res) => {
  try {
    const newMessage = new TeamMessage({
      team_id: req.params.id,
      user_id: req.user.id,
      content: req.body.content,
      message_type: req.body.message_type || 'text',
      reply_to: req.body.reply_to
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// =======================
// LEADERBOARD
// =======================

// GET /api/innovation/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    // Generate some mock leaderboard data or compute it
    const stats = {
      ideasCount: await Idea.countDocuments(),
      membersCount: await User.countDocuments(),
      investments: 1450000,
      activeProjects: await Team.countDocuments()
    };
    
    // Get top users based on ideas created (simple proxy for leaderboard)
    const topUsers = await Idea.aggregate([
      { $group: { _id: "$user_id", ideaCount: { $sum: 1 }, upvotes: { $sum: "$upvotes" } } },
      { $sort: { ideaCount: -1, upvotes: -1 } },
      { $limit: 10 }
    ]);
    
    const userIds = topUsers.map(u => u._id);
    const users = await User.find({ _id: { $in: userIds } }).select('username avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const leaderboard = topUsers.map((u, i) => ({
      id: u._id,
      rank: i + 1,
      user_id: u._id,
      username: userMap[u._id]?.username || 'Anonymous',
      avatar_url: userMap[u._id]?.avatar_url,
      score: u.upvotes * 10 + u.ideaCount * 50,
      badges: ['Innovator', 'Early Adopter'].slice(0, Math.floor(Math.random() * 2) + 1),
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
    }));
    
    res.json({ leaderboard, stats });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
