const express = require('express');
const router = express.Router();
const Idea = require('../models/Idea');
const User = require('../models/User');

// Get public ideas
router.get('/', async (req, res) => {
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

// Upvote an idea
router.post('/:id/upvote', async (req, res) => {
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

module.exports = router;
