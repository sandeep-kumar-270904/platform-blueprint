const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const CommunityFollow = require('../models/CommunityFollow');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const maskAnonymous = (post) => {
  if (post && post.isAnonymous) {
    post.user_id = {
      _id: "anonymous",
      full_name: "Anonymous Student",
      username: "anonymous",
      avatar: null,
      profile_picture: null,
      current_role: null,
      headline: null
    };
  }
  return post;
};

// POST /api/community-feed
// Create a new post (general or college-scoped)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, collegeId, parentPostId, image_urls, category, pollOptions, isAnonymous } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    let isOfficial = false;

    // Check if user is a verified official
    const officialQuery = { userId: req.user.id, verificationStatus: 'verified' };
    if (collegeId) officialQuery.collegeId = collegeId;
    
    const officialAccount = await CollegeOfficialAccount.findOne(officialQuery);
    if (officialAccount) {
      isOfficial = true;
    }

    let finalCategory = category;
    if (pollOptions && pollOptions.length > 0) {
      finalCategory = "poll";
    }

    // Restrict "campus_update" to official accounts
    if (finalCategory === "campus_update" && !isOfficial) {
      return res.status(403).json({ message: 'Only verified official accounts can post campus updates' });
    }

    const post = new CommunityPost({
      user_id: req.user.id,
      content,
      category: finalCategory,
      pollOptions: pollOptions || [],
      isAnonymous: isAnonymous || false,
      isOfficial: isOfficial || false,
      collegeId: collegeId || null,
      parentPostId: parentPostId || null,
      image_urls: image_urls || []
    });

    await post.save();

    // If it's a reply, increment parent comment count
    if (parentPostId) {
      await CommunityPost.findByIdAndUpdate(parentPostId, { $inc: { comment_count: 1 } });
      const parentPost = await CommunityPost.findById(parentPostId);
      if (parentPost && parentPost.user_id.toString() !== req.user.id) {
        await notificationService.createNotification(
          parentPost.user_id,
          'community_reply',
          'Someone replied to your post',
          `/community/post/${parentPostId}`
        );
      }
    }

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('user_id', 'full_name username avatar profile_picture current_role headline')
      .lean();

    res.status(201).json(maskAnonymous(populatedPost));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community-feed/general
// Get cross-college feed
router.get('/general', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await CommunityPost.find({ collegeId: null, parentPostId: null, status: 'active' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user_id', 'full_name username avatar profile_picture current_role headline')
      .lean();

    res.json(posts.map(maskAnonymous));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community-feed/college/:id
// Get college-scoped feed
router.get('/college/:id', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const posts = await CommunityPost.find({ collegeId: req.params.id, parentPostId: null, status: 'active' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user_id', 'full_name username avatar profile_picture current_role headline')
      .lean();

    res.json(posts.map(maskAnonymous));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community-feed/post/:id/thread
// Get a post and its replies
router.get('/post/:id/thread', async (req, res) => {
  try {
    const post = await CommunityPost.findOne({ _id: req.params.id, status: 'active' })
      .populate('user_id', 'full_name username avatar profile_picture current_role headline')
      .lean();
    
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const replies = await CommunityPost.find({ parentPostId: req.params.id, status: 'active' })
      .sort({ createdAt: 1 })
      .populate('user_id', 'full_name username avatar profile_picture current_role headline')
      .lean();

    res.json({ post: maskAnonymous(post), replies: replies.map(maskAnonymous) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community-feed/post/:id/like
router.post('/post/:id/like', authMiddleware, async (req, res) => {
  try {
    // Basic implementation (not tracking individual likes in a separate collection for simplicity of v1 feed, just incrementing)
    // For robust implementation, we would use CommunityLike model.
    const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { like_count: 1 } }, { new: true });
    res.json({ like_count: post.like_count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community-feed/post/:id/vote
router.post('/post/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.category !== 'poll') return res.status(400).json({ message: 'Not a poll' });

    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    const isOfficial = await CollegeOfficialAccount.findOne({ userId: req.user.id, verificationStatus: 'verified' });
    if (isOfficial) return res.status(403).json({ message: 'Official accounts cannot vote on polls' });

    // Check if user already voted
    const existingVote = post.pollVoters.find(v => v.userId.toString() === req.user.id);
    if (existingVote) return res.status(400).json({ message: 'Already voted' });

    post.pollVoters.push({ userId: req.user.id, optionIndex });
    if (post.pollOptions[optionIndex]) {
      post.pollOptions[optionIndex].voteCount += 1;
    }

    await post.save();
    res.json({ pollOptions: post.pollOptions, pollVoters: post.pollVoters });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community-feed/follow/user/:id
router.post('/follow/user/:id', authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const targetUserId = req.params.id;
    if (followerId === targetUserId) return res.status(400).json({ message: "Cannot follow yourself" });

    const existing = await CommunityFollow.findOne({ followerId, targetUserId });
    if (existing) {
      await CommunityFollow.findByIdAndDelete(existing._id);
      return res.json({ following: false });
    }

    await CommunityFollow.create({ followerId, targetUserId });
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community-feed/follow/college/:id
router.post('/follow/college/:id', authMiddleware, async (req, res) => {
  try {
    const followerId = req.user.id;
    const targetCollegeId = req.params.id;

    const existing = await CommunityFollow.findOne({ followerId, targetCollegeId });
    if (existing) {
      await CommunityFollow.findByIdAndDelete(existing._id);
      return res.json({ following: false });
    }

    await CommunityFollow.create({ followerId, targetCollegeId });
    res.json({ following: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community-feed/follows
router.get('/follows', authMiddleware, async (req, res) => {
  try {
    const follows = await CommunityFollow.find({ followerId: req.user.id });
    res.json(follows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
