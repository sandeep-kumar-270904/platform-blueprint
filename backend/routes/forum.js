const express = require('express');
const router = express.Router();
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const User = require('../models/User'); // Required to populate user details
const authMiddleware = require('../middleware/auth');

// GET /api/forum/threads
router.get('/threads', async (req, res) => {
  try {
    const { category, sort } = req.query;
    let query = {};
    if (category && category !== 'All') query.category = category;

    let sortObj = { is_pinned: -1 }; // always pin first
    if (sort === 'trending') sortObj.like_count = -1;
    else if (sort === 'unanswered') {
      query.reply_count = 0;
      sortObj.created_at = -1;
    } else {
      sortObj.last_activity_at = -1;
    }

    const threads = await ForumThread.find(query)
      .sort(sortObj)
      .limit(100)
      .lean(); // lean for adding author

    // Fetch user profiles (simulated by querying users)
    const userIds = [...new Set(threads.map(t => t.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const threadsWithAuthor = threads.map(t => ({ ...t, author: userMap[t.user_id.toString()] || null }));

    res.json(threadsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/forum/threads
router.post('/threads', authMiddleware, async (req, res) => {
  try {
    const newThread = new ForumThread({
      user_id: req.user.id,
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      tags: req.body.tags || []
    });
    const savedThread = await newThread.save();
    
    // Broadcast via socket.io
    req.io.emit('forum_thread_created', savedThread);
    
    res.status(201).json(savedThread);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/forum/threads/:id/like
router.post('/threads/:id/like', authMiddleware, async (req, res) => {
  try {
    const threadId = req.params.id;
    const userId = req.user.id;

    const thread = await ForumThread.findById(threadId);
    if (!thread) return res.status(404).json({ message: 'Not found' });

    const isLiked = thread.liked_by.includes(userId);
    
    if (isLiked) {
      await ForumThread.findByIdAndUpdate(threadId, {
        $inc: { like_count: -1 },
        $pull: { liked_by: userId }
      });
    } else {
      await ForumThread.findByIdAndUpdate(threadId, {
        $inc: { like_count: 1 },
        $push: { liked_by: userId }
      });
    }

    // Broadcast update
    req.io.emit('forum_thread_updated', threadId);

    res.json({ message: isLiked ? 'Unliked' : 'Liked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/forum/threads/:id/view
router.post('/threads/:id/view', async (req, res) => {
  try {
    await ForumThread.findByIdAndUpdate(req.params.id, {
      $inc: { view_count: 1 }
    });
    // We don't broadcast view counts to avoid spamming sockets
    res.json({ message: 'View incremented' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/forum/threads/:id/replies
router.get('/threads/:id/replies', async (req, res) => {
  try {
    const replies = await ForumReply.find({ thread_id: req.params.id })
      .sort({ created_at: 1 })
      .lean();

    const userIds = [...new Set(replies.map(r => r.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const repliesWithAuthor = replies.map(r => ({ ...r, author: userMap[r.user_id.toString()] || null }));

    res.json(repliesWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/forum/threads/:id/replies
router.post('/threads/:id/replies', authMiddleware, async (req, res) => {
  try {
    const threadId = req.params.id;
    
    const newReply = new ForumReply({
      thread_id: threadId,
      user_id: req.user.id,
      body: req.body.body,
      parent_id: req.body.parent_id || null
    });
    const savedReply = await newReply.save();
    
    // Update thread reply count and last activity
    await ForumThread.findByIdAndUpdate(threadId, {
      $inc: { reply_count: 1 },
      $set: { last_activity_at: new Date() }
    });
    
    // Broadcast via socket.io to the specific thread room
    req.io.to(`forum_thread_${threadId}`).emit('forum_reply_created', savedReply);
    // Also notify main forum listing that thread updated
    req.io.emit('forum_thread_updated', threadId);

    res.status(201).json(savedReply);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
