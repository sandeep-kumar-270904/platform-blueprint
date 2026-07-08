const express = require('express');
const router = express.Router();
const { NoteComment, CommentVote } = require('../models/NoteComment');
const Report = require('../models/Report');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get comments for a note
router.get('/notes/:noteId/comments', async (req, res) => {
  try {
    const { sort = 'top', page = 0, limit = 15 } = req.query;
    const skip = parseInt(page) * parseInt(limit);
    
    // Sort logic
    let sortQuery = {};
    if (sort === 'top') {
      sortQuery = { is_helpful: -1, upvotes: -1 };
    } else if (sort === 'new') {
      sortQuery = { created_at: -1 };
    } else if (sort === 'discussed') {
      sortQuery = { upvotes: -1, created_at: -1 };
    }
    
    const count = await NoteComment.countDocuments({ note_id: req.params.noteId });
    
    const comments = await NoteComment.find({ note_id: req.params.noteId })
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));
      
    // Populate user profiles
    const userIds = [...new Set(comments.map(c => c.user_id))];
    const profiles = await User.find({ _id: { $in: userIds } }).select('username full_name');
    const profileMap = profiles.reduce((acc, p) => { acc[p._id] = p; return acc; }, {});
    
    // Check current user votes
    let userVotes = {};
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const votes = await CommentVote.find({
          user_id: decoded.id,
          comment_id: { $in: comments.map(c => c._id) }
        });
        userVotes = votes.reduce((acc, v) => { acc[v.comment_id] = v.vote_type; return acc; }, {});
      } catch (err) {}
    }
    
    const enriched = comments.map(c => {
      const cObj = c.toObject();
      cObj.profile = profileMap[c.user_id] || { username: null, full_name: null };
      cObj.userVote = userVotes[c._id] || null;
      return cObj;
    });
    
    res.json({ data: enriched, count });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Post a comment
router.post('/notes/:noteId/comments', authMiddleware, async (req, res) => {
  try {
    const comment = new NoteComment({
      note_id: req.params.noteId,
      user_id: req.user.id,
      content: req.body.content,
      parent_id: req.body.parent_id || null
    });
    
    await comment.save();
    
    if (req.io) {
      req.io.emit(`comments-${req.params.noteId}`, { action: 'create', data: comment });
    }
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a comment
router.put('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await NoteComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    
    comment.content = req.body.content;
    comment.is_edited = true;
    await comment.save();
    
    if (req.io) {
      req.io.emit(`comments-${comment.note_id}`, { action: 'update', data: comment });
    }
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await NoteComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    
    await NoteComment.deleteOne({ _id: req.params.id });
    
    if (req.io) {
      req.io.emit(`comments-${comment.note_id}`, { action: 'delete', id: req.params.id });
    }
    
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote
router.post('/comments/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { vote_type } = req.body; // 'up' or 'down'
    const existing = await CommentVote.findOne({ comment_id: req.params.id, user_id: req.user.id });
    const comment = await NoteComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    
    if (existing) {
      if (existing.vote_type === vote_type) {
        // Toggle off
        await CommentVote.deleteOne({ _id: existing._id });
        if (vote_type === 'up') comment.upvotes = Math.max(0, comment.upvotes - 1);
        if (vote_type === 'down') comment.downvotes = Math.max(0, comment.downvotes - 1);
      } else {
        // Switch vote
        if (vote_type === 'up') {
          comment.downvotes = Math.max(0, comment.downvotes - 1);
          comment.upvotes += 1;
        } else {
          comment.upvotes = Math.max(0, comment.upvotes - 1);
          comment.downvotes += 1;
        }
        existing.vote_type = vote_type;
        await existing.save();
      }
    } else {
      // New vote
      const nv = new CommentVote({ comment_id: req.params.id, user_id: req.user.id, vote_type });
      await nv.save();
      if (vote_type === 'up') comment.upvotes += 1;
      if (vote_type === 'down') comment.downvotes += 1;
    }
    
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark helpful
router.post('/comments/:id/helpful', authMiddleware, async (req, res) => {
  try {
    const comment = await NoteComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    // TODO: Ideally check if current user owns the note, but allow for now
    comment.is_helpful = req.body.is_helpful;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Report comment
router.post('/comments/:id/report', authMiddleware, async (req, res) => {
  try {
    const comment = await NoteComment.findByIdAndUpdate(req.params.id, { is_reported: true });
    
    const report = new Report({
      content_type: 'comment',
      content_id: req.params.id,
      reported_by: req.user.id,
      reason: req.body.reason || 'Reported by user'
    });
    await report.save();
    
    res.json({ message: 'Reported' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
