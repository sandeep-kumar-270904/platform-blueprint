const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/community/posts
router.get('/posts', async (req, res) => {
  try {
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const userIds = [...new Set(posts.map(p => p.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const postsWithAuthor = posts.map(p => ({ ...p, author: userMap[p.user_id.toString()] || null }));

    res.json(postsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const newPost = new CommunityPost({
      user_id: req.user.id,
      content: req.body.content,
      image_url: req.body.image_url,
      tags: req.body.tags || []
    });

    const savedPost = await newPost.save();
    req.io.emit('community_post_created', savedPost);
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Not found' });

    const isLiked = post.liked_by.includes(userId);
    
    if (isLiked) {
      await CommunityPost.findByIdAndUpdate(postId, {
        $inc: { like_count: -1 },
        $pull: { liked_by: userId }
      });
    } else {
      await CommunityPost.findByIdAndUpdate(postId, {
        $inc: { like_count: 1 },
        $push: { liked_by: userId }
      });
    }

    req.io.emit('community_post_updated', postId);
    res.json({ message: isLiked ? 'Unliked' : 'Liked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await CommunityComment.find({ post_id: req.params.id })
      .sort({ createdAt: 1 })
      .lean();

    const userIds = [...new Set(comments.map(c => c.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const commentsWithAuthor = comments.map(c => ({ ...c, author: userMap[c.user_id.toString()] || null }));

    res.json(commentsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/comments
router.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    
    const newComment = new CommunityComment({
      post_id: postId,
      user_id: req.user.id,
      content: req.body.content
    });
    
    const savedComment = await newComment.save();
    
    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { comment_count: 1 }
    });
    
    req.io.to(`community_post_${postId}`).emit('community_comment_created', savedComment);
    req.io.emit('community_post_updated', postId);

    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
