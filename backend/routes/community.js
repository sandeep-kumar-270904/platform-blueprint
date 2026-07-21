const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const CommunityComment = require('../models/CommunityComment');
const CommunityLike = require('../models/CommunityLike');
const SavedCommunityPost = require('../models/SavedCommunityPost');
const CommunityPollVote = require('../models/CommunityPollVote');
const CommunityReport = require('../models/CommunityReport');
const UserFollow = require('../models/UserFollow');
const UserInterest = require('../models/UserInterest');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cheerio = require('cheerio');

const optionalAuth = async (req, res, next) => {
  let token = req.cookies?.accessToken;
  if (!token && req.header('Authorization')) {
    const authHeader = req.header('Authorization');
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.id || decoded._id);
      if (user) {
        req.user = { 
          id: user._id.toString(), 
          role: user.role
        };
      }
    } catch (err) {
      // ignore
    }
  }
  next();
};

// GET /api/community/posts
router.get('/posts', optionalAuth, async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    const { page = 1, limit = 20, sort = 'newest', tag, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    let currentUser = null;
    let followedIds = [];
    let userInterests = [];
    let blockedByIds = [];
    
    if (req.user) {
      const [userDoc, follows, interest, blockedByUsers] = await Promise.all([
        User.findById(req.user.id).lean(),
        UserFollow.find({ follower_id: req.user.id }).lean(),
        UserInterest.findOne({ user_id: req.user.id }).lean(),
        User.find({ blocked_users: req.user.id }, '_id').lean()
      ]);
      currentUser = userDoc;
      followedIds = follows.map(f => f.followed_id);
      if (interest && interest.tags) userInterests = interest.tags;
      blockedByIds = blockedByUsers.map(u => u._id.toString());
    }

    // Filter out hidden/deleted posts and apply privacy/moderation
    let query = { $and: [] };
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'moderator')) {
      query.$and.push({ status: { $ne: 'deleted' } });
    } else if (req.user) {
      query.$and.push({ status: { $ne: 'deleted' } });
      query.$and.push({
        $or: [
          { status: { $nin: ['hidden', 'pending_review'] } },
          { user_id: req.user.id }
        ]
      });
      
      // Privacy and Mute/Block (Bidirectional)
      const excludeUserIds = [
        ...(currentUser?.muted_users || []),
        ...(currentUser?.blocked_users || []),
        ...blockedByIds
      ];
      query.$and.push({ user_id: { $nin: excludeUserIds } });
      
      query.$and.push({
        $or: [
          { privacy: 'public' },
          { privacy: { $exists: false } },
          { privacy: 'followers', user_id: { $in: followedIds } },
          { privacy: 'club', club_id: { $in: currentUser?.clubs || [] } },
          { user_id: req.user.id }
        ]
      });
    } else {
      query.$and.push({ status: { $nin: ['hidden', 'deleted', 'pending_review'] } });
      query.$and.push({ $or: [{ privacy: 'public' }, { privacy: { $exists: false } }] });
    }
    
    if (tag) {
      query.tags = tag;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const matchingUsers = await User.find({
        $or: [
          { full_name: searchRegex },
          { username: searchRegex }
        ]
      }).select('_id').lean();
      
      const searchCondition = {
        $or: [
          { content: searchRegex },
          { tags: searchRegex },
          { user_id: { $in: matchingUsers.map(u => u._id) } }
        ]
      };

      if (query.$and) {
        query.$and.push(searchCondition);
      } else {
        query = { $and: [query, searchCondition] };
      }
    }

    if (sort === 'following' && req.user) {
      query.$and.push({ user_id: { $in: followedIds } });
    }

    let sortObj = { is_pinned: -1, createdAt: -1 };
    if (sort === 'most_liked') {
      sortObj = { is_pinned: -1, like_count: -1, createdAt: -1 };
    }

    let posts;
    if (sort === 'trending') {
      posts = await CommunityPost.aggregate([
        { $match: query },
        { 
          $addFields: {
            trendingScore: {
              $divide: [
                { $add: [ "$like_count", { $multiply: [ "$comment_count", 2 ] } ] },
                { $pow: [ { $add: [ { $divide: [ { $subtract: [ new Date(), "$createdAt" ] }, 3600000 ] }, 2 ] }, 1.5 ] }
              ]
            }
          }
        },
        { $sort: { is_pinned: -1, trendingScore: -1, createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum }
      ]);
      posts = posts.map(p => { p.id = p._id.toString(); return p; });
    } else if (sort === 'for_you') {
      posts = await CommunityPost.aggregate([
        { $match: query },
        { 
          $addFields: {
            trendingScore: {
              $divide: [
                { $add: [ "$like_count", { $multiply: [ "$comment_count", 2 ] } ] },
                { $pow: [ { $add: [ { $divide: [ { $subtract: [ new Date(), "$createdAt" ] }, 3600000 ] }, 2 ] }, 1.5 ] }
              ]
            },
            followBoost: { $cond: [{ $in: ["$user_id", followedIds] }, 5, 0] },
            interestBoost: { 
              $multiply: [
                { $size: { $setIntersection: [{ $ifNull: ["$tags", []] }, userInterests] } }, 
                2
              ] 
            }
          }
        },
        {
          $addFields: {
            forYouScore: { $add: ["$trendingScore", "$followBoost", "$interestBoost"] }
          }
        },
        { $sort: { is_pinned: -1, forYouScore: -1, createdAt: -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum }
      ]);
      posts = posts.map(p => { p.id = p._id.toString(); return p; });
    } else {
      posts = await CommunityPost.find(query)
        .sort(sortObj)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
    }

    const userIds = [...new Set(posts.map(p => p.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url adminRole communityTitle institutionVerified role').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const postIds = posts.map(p => p._id);
    const likes = await CommunityLike.find({ post_id: { $in: postIds } }).lean();
    
    // Fetch Saved posts for current user
    let savedPostIds = new Set();
    let userVotes = {};
    if (req.user) {
      const saved = await SavedCommunityPost.find({ user_id: req.user.id, post_id: { $in: postIds } }).lean();
      saved.forEach(s => savedPostIds.add(s.post_id.toString()));
      
      const votes = await CommunityPollVote.find({ user_id: req.user.id, post_id: { $in: postIds } }).lean();
      votes.forEach(v => userVotes[v.post_id.toString()] = v.option_index);
    }

    const likesMap = {};
    const reactionsMap = {};
    const userReactionMap = {};
    
    likes.forEach(like => {
      const pid = like.post_id.toString();
      if (!likesMap[pid]) likesMap[pid] = [];
      likesMap[pid].push(like.user_id.toString());
      
      if (!reactionsMap[pid]) {
        reactionsMap[pid] = { like: 0, celebrate: 0, insightful: 0, support: 0 };
      }
      reactionsMap[pid][like.type || 'like']++;
      
      if (req.user && like.user_id.toString() === req.user.id) {
        userReactionMap[pid] = like.type || 'like';
      }
    });

    const postsWithAuthor = posts.map(p => {
      const pid = p._id.toString();
      return { 
        ...p, 
        author: userMap[p.user_id.toString()] || null,
        liked_by: likesMap[pid] || [],
        reactions: reactionsMap[pid] || { like: 0, celebrate: 0, insightful: 0, support: 0 },
        user_reaction: userReactionMap[pid] || null,
        is_saved: savedPostIds.has(pid),
        user_voted_option_index: userVotes[pid] !== undefined ? userVotes[pid] : null
      };
    });

    res.json(postsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/tags/popular
router.get('/tags/popular', async (req, res) => {
  try {
    const popularTags = await CommunityPost.aggregate([
      { $match: { status: { $nin: ['hidden', 'deleted'] }, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json(popularTags.map(t => t._id));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/link-preview
router.get('/link-preview', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: 'URL is required' });
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
    const $ = cheerio.load(response.data);
    const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;

    res.json({ title, description, image, siteName, url });
  } catch (err) {
    res.status(400).json({ message: 'Failed to fetch preview' });
  }
});

// PATCH /api/community/posts/:id
router.patch('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user_id.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.tags !== undefined) post.tags = req.body.tags;
    if (req.body.image_url !== undefined) post.image_url = req.body.image_url;
    if (req.body.image_urls !== undefined) post.image_urls = req.body.image_urls;
    
    post.edited_at = new Date();
    
    const updatedPost = await post.save();
    req.io.emit('community_post_updated', { 
      postId: updatedPost._id, 
      content: updatedPost.content, 
      tags: updatedPost.tags, 
      edited_at: updatedPost.edited_at 
    });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/community/posts/:id
router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user_id.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });

    await CommunityPost.findByIdAndDelete(req.params.id);
    await CommunityComment.deleteMany({ post_id: req.params.id });
    await CommunityLike.deleteMany({ post_id: req.params.id });
    req.io.emit('community_post_deleted', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/report
router.post('/posts/:id/report', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user_id.toString() === req.user.id) return res.status(400).json({ message: 'Cannot report your own post' });

    const existingReport = await CommunityReport.findOne({ post_id: postId, reporting_user_id: req.user.id });
    if (existingReport) return res.status(400).json({ message: 'You have already reported this post' });

    const report = new CommunityReport({
      post_id: postId,
      reporting_user_id: req.user.id,
      reason: req.body.reason || 'Inappropriate content'
    });
    await report.save();

    post.report_count += 1;
    if (post.report_count >= 5) {
      post.status = 'hidden';
      req.io.emit('community_post_deleted', post._id); // tell clients to remove it
    }
    await post.save();

    // Only notify on first report or let mods handle it. For now, notify author that their post was reported
    if (post.report_count === 1) {
        await notificationService.createNotification({
          userId: post.user_id,
          message: 'Your post was reported by the community and is under review.',
          type: 'community_post_reported',
          relatedContentId: post._id,
          actionUrl: `/community`
        });
    }

    res.json({ message: 'Post reported successfully', status: post.status });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'You have already reported this post' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    if (req.body.requestId) {
      const existingReq = await CommunityPost.findOne({ user_id: req.user.id, request_id: req.body.requestId }).populate('user_id', 'full_name username avatar_url');
      if (existingReq) {
        const postToEmit = { ...existingReq.toObject(), author: existingReq.user_id, liked_by: [] };
        postToEmit.id = postToEmit._id.toString();
        return res.status(200).json(postToEmit);
      }
    }

    // Rate Limiting: Max 3 posts per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentPostsCount = await CommunityPost.countDocuments({
      user_id: req.user.id,
      createdAt: { $gte: oneMinuteAgo }
    });

    if (recentPostsCount >= 3) {
      return res.status(429).json({ message: 'Rate limit exceeded. Please wait a minute before posting again.' });
    }
    
    if (!req.body.content || req.body.content.trim().length === 0) {
      return res.status(400).json({ message: 'Post content cannot be empty.' });
    }
    if (req.body.content.length > 2000) {
      return res.status(400).json({ message: 'Post content exceeds maximum length of 2000 characters.' });
    }

    const content = req.body.content;

    // Duplicate check: Same content within 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const duplicate = await CommunityPost.findOne({
      user_id: req.user.id,
      content: content,
      createdAt: { $gte: fiveMinutesAgo }
    });
    if (duplicate) {
      return res.status(429).json({ message: 'You recently posted identical content. Please wait a bit before posting it again.' });
    }

    // Spam heuristics check
    let auto_flag_reason = null;
    let status = 'active';

    const urlMatches = content.match(/https?:\/\/[^\s]+/g);
    if (urlMatches && urlMatches.length > 3) {
      auto_flag_reason = 'Excessive URLs detected';
      status = 'pending_review';
    } else if (/(.)\1{10,}/.test(content)) {
      auto_flag_reason = 'Repeating characters detected';
      status = 'pending_review';
    }

    // Parse @mentions
    const mentionMatches = content.match(/(^|\s)@([a-zA-Z0-9_]+)/g);
    let mentionedUserIds = [];
    if (mentionMatches) {
      const usernames = mentionMatches.map(m => m.trim().substring(1));
      const users = await User.find({ username: { $in: usernames } }, '_id').lean();
      mentionedUserIds = users.map(u => u._id);
    }

    // Parse link preview
    let link_preview = undefined;
    const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      try {
        const url = urlMatch[0];
        const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
        const $ = cheerio.load(response.data);
        const title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
        const image = $('meta[property="og:image"]').attr('content') || '';
        const siteName = $('meta[property="og:site_name"]').attr('content') || new URL(url).hostname;
        
        if (title || image) {
          link_preview = { title, description, image, siteName, url };
        }
      } catch (err) {}
    }

    const newPost = new CommunityPost({
      user_id: req.user.id,
      request_id: req.body.requestId,
      content: content,
      image_url: req.body.image_url,
      image_urls: req.body.image_urls || [],
      tags: req.body.tags || [],
      mentions: mentionedUserIds,
      link_preview: link_preview,
      poll: req.body.poll,
      privacy: req.body.privacy || 'public',
      club_id: req.body.clubId || undefined,
      template: req.body.template || 'standard',
      template_data: req.body.templateData || {},
      status: status,
      auto_flag_reason: auto_flag_reason
    });

    const savedPost = await newPost.save();
    
    const user = await User.findById(req.user.id, 'full_name username avatar_url').lean();
    
    // Create notifications for mentioned users
    for (const userId of mentionedUserIds) {
      if (userId.toString() !== req.user.id) {
          await notificationService.createNotification({
            userId,
            message: `${user.username || 'Someone'} mentioned you in a community post.`,
            type: 'community_mention',
            relatedContentId: savedPost._id,
            actionUrl: `/community`
          });
      }
    }

    const postToEmit = { ...savedPost.toObject(), author: user, liked_by: [] };
    postToEmit.id = postToEmit._id.toString();
    
    if (status === 'active') {
      req.io.emit('community_post_created', postToEmit);
    }
    
    res.status(201).json(postToEmit);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/like
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { type = 'like' } = req.body;

    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ message: 'Not found' });

    const existingLike = await CommunityLike.findOne({ post_id: postId, user_id: userId });
    
    let action = '';

    if (existingLike) {
      if (existingLike.type === type) {
        // Toggle off
        await CommunityLike.findByIdAndDelete(existingLike._id);
        await CommunityPost.findByIdAndUpdate(postId, { $inc: { like_count: -1 } });
        action = 'removed';
      } else {
        // Change type
        existingLike.type = type;
        await existingLike.save();
        action = 'changed';
      }
    } else {
      const newLike = new CommunityLike({ post_id: postId, user_id: userId, type });
      await newLike.save();
      await CommunityPost.findByIdAndUpdate(postId, { $inc: { like_count: 1 } });
      action = 'added';
      
      // Notify author if they didn't like their own post
      if (post.user_id.toString() !== userId) {
          await notificationService.createNotification({
            userId: post.user_id,
            message: `Someone reacted to your community post.`,
            type: 'community_post_liked',
            relatedContentId: post._id,
            actionUrl: `/community`
          });
      }
    }

    const updatedPost = await CommunityPost.findById(postId);
    
    // Calculate new reactions map
    const likes = await CommunityLike.find({ post_id: postId }).lean();
    const reactions = { like: 0, celebrate: 0, insightful: 0, support: 0 };
    likes.forEach(like => {
      reactions[like.type || 'like']++;
    });

    req.io.emit('community_post_liked', { postId, like_count: updatedPost.like_count, reactions });
    res.json({ action, like_count: updatedPost.like_count, reactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/posts/:id
router.get('/posts/:id', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
      .populate('user_id', 'username full_name avatar_url role blocked_users')
      .populate('mentions', 'username full_name')
      .lean();

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check visibility
    if (post.status === 'hidden' || post.status === 'deleted') {
      // Allow author or admin to see hidden/deleted posts
      if (!req.user || (req.user.id !== post.user_id._id.toString() && req.user.role !== 'admin')) {
        return res.status(403).json({ message: 'Post is no longer available' });
      }
    }

    // Bidirectional blocking check
    if (req.user && post.user_id && req.user.role !== 'admin') {
      const isBlockedByAuthor = post.user_id.blocked_users && post.user_id.blocked_users.some(id => id.toString() === req.user.id);
      
      const currentUser = await User.findById(req.user.id, 'blocked_users').lean();
      const hasBlockedAuthor = currentUser && currentUser.blocked_users && currentUser.blocked_users.some(id => id.toString() === post.user_id._id.toString());
      
      if (isBlockedByAuthor || hasBlockedAuthor) {
        return res.status(403).json({ message: 'Post is no longer available' });
      }
    }

    let hasLiked = false;
    let saved = false;

    if (req.user) {
      const like = await CommunityLike.findOne({ post_id: post._id, user_id: req.user.id });
      hasLiked = !!like;
      
      const savedPost = await SavedCommunityPost.findOne({ post_id: post._id, user_id: req.user.id });
      saved = !!savedPost;
    }

    const postToReturn = {
      ...post,
      author: post.user_id,
      hasLiked,
      saved
    };
    
    // Anonymize if author is null (account deleted)
    if (!postToReturn.author) {
      postToReturn.author = {
        _id: 'deleted',
        username: 'deleted_user',
        full_name: 'Deleted User',
        avatar_url: null
      };
    }
    
    postToReturn.id = postToReturn._id;
    delete postToReturn.user_id;

    res.json(postToReturn);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/posts/:id/comments
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const comments = await CommunityComment.find({ post_id: req.params.id })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
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
    const { text, parent_id } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text cannot be empty' });
    }
    
    const newComment = new CommunityComment({
      post_id: postId,
      user_id: req.user.id,
      text: text.trim(),
      parent_id: parent_id || null
    });
    
    const savedComment = await newComment.save();
    
    await CommunityPost.findByIdAndUpdate(postId, {
      $inc: { comment_count: 1 }
    });
    
    const post = await CommunityPost.findById(postId);
    if (post && post.user_id.toString() !== req.user.id) {
        await notificationService.createNotification({
          userId: post.user_id,
          message: 'Someone commented on your community post.',
          type: 'community_post_commented',
          relatedContentId: post._id,
          actionUrl: `/community`
        });
    }

    req.io.to(`community_post_${postId}`).emit('community_comment_created', savedComment);
    req.io.emit('community_post_commented', { postId, comment_count: post.comment_count });

    res.status(201).json(savedComment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/posts/:id/reactions
router.get('/posts/:id/reactions', optionalAuth, async (req, res) => {
  try {
    const likes = await CommunityLike.find({ post_id: req.params.id })
      .populate('user_id', 'username full_name avatar_url')
      .lean();
    
    // Format reaction list
    const reactions = likes.map(like => ({
      user: like.user_id,
      type: like.type || 'like',
      createdAt: like.createdAt
    }));
    
    res.json(reactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/save
router.post('/posts/:id/save', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    
    const existing = await SavedCommunityPost.findOne({ post_id: postId, user_id: userId });
    if (existing) {
      await SavedCommunityPost.findByIdAndDelete(existing._id);
      return res.json({ action: 'unsaved' });
    } else {
      const saved = new SavedCommunityPost({ post_id: postId, user_id: userId });
      await saved.save();
      return res.json({ action: 'saved' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/saved-posts
router.get('/saved-posts', authMiddleware, async (req, res) => {
  try {
    const saved = await SavedCommunityPost.find({ user_id: req.user.id })
      .populate({
        path: 'post_id',
        populate: { path: 'user_id', select: 'full_name username avatar_url' }
      })
      .sort({ createdAt: -1 })
      .lean();
      
    // Transform to standard post format
    const posts = saved.map(s => {
      const p = s.post_id;
      return {
        ...p,
        author: p.user_id,
        is_saved: true
      };
    });
    
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/vote
router.post('/posts/:id/vote', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { option_index } = req.body;
    
    if (typeof option_index !== 'number') return res.status(400).json({ message: 'Invalid option_index' });
    
    const post = await CommunityPost.findById(postId);
    if (!post || !post.poll || !post.poll.options[option_index]) {
      return res.status(404).json({ message: 'Poll or option not found' });
    }
    
    const existingVote = await CommunityPollVote.findOne({ post_id: postId, user_id: userId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted' });
    }
    
    const newVote = new CommunityPollVote({ post_id: postId, user_id: userId, option_index });
    await newVote.save();
    
    // Increment vote count in post
    const updatePath = `poll.options.${option_index}.votes`;
    await CommunityPost.findByIdAndUpdate(postId, { $inc: { [updatePath]: 1 } });
    
    const updatedPost = await CommunityPost.findById(postId);
    
    // Emit real-time poll update
    req.io.emit('community_post_voted', { postId, poll: updatedPost.poll });
    
    res.json({ message: 'Voted successfully', poll: updatedPost.poll });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'You have already voted' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/view
router.post('/posts/:id/view', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { view_count: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ view_count: post.view_count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/community/posts/:id/pin
router.put('/posts/:id/pin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.adminRole !== 'moderator') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    post.is_pinned = !post.is_pinned;
    await post.save();
    res.json({ message: post.is_pinned ? 'Post pinned' : 'Post unpinned', is_pinned: post.is_pinned });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/posts/:id/report
router.post('/posts/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const existingReport = await CommunityReport.findOne({
      post_id: post._id,
      reporting_user_id: req.user.id
    });

    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    const report = new CommunityReport({
      post_id: post._id,
      reporting_user_id: req.user.id,
      reason
    });
    await report.save();

    await CommunityPost.findByIdAndUpdate(post._id, { $inc: { report_count: 1 } });

    res.json({ message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/admin/reports
router.get('/admin/reports', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.adminRole !== 'moderator') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Group reports by post_id
    const reports = await CommunityReport.aggregate([
      { $match: { status: 'pending' } },
      { $group: {
          _id: '$post_id',
          report_count: { $sum: 1 },
          reasons: { $push: '$reason' },
          reporters: { $push: '$reporting_user_id' },
          last_reported_at: { $max: '$createdAt' }
      }},
      { $sort: { report_count: -1, last_reported_at: -1 } }
    ]);

    const postIds = reports.map(r => r._id);
    const reportedPosts = await CommunityPost.find({ _id: { $in: postIds } }).populate('user_id', 'username full_name avatar_url').lean();
    
    let result = reports.map(r => {
      const post = reportedPosts.find(p => p._id.toString() === r._id.toString());
      return {
        post,
        report_count: r.report_count,
        reasons: r.reasons,
        reporters: r.reporters,
        last_reported_at: r.last_reported_at
      };
    });

    // Add auto-flagged pending posts
    const autoFlaggedPosts = await CommunityPost.find({ status: 'pending_review' }).populate('user_id', 'username full_name avatar_url').lean();
    
    for (const afp of autoFlaggedPosts) {
      if (!result.find(r => r.post && r.post._id.toString() === afp._id.toString())) {
        result.push({
          post: afp,
          report_count: 0,
          reasons: [afp.auto_flag_reason || 'Auto-flagged as spam'],
          reporters: ['System'],
          last_reported_at: afp.createdAt
        });
      }
    }

    result = result.filter(r => r.post != null);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/admin/reports/:postId/approve
router.post('/admin/reports/:postId/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.adminRole !== 'moderator') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { postId } = req.params;
    
    // Mark reports as reviewed
    await CommunityReport.updateMany({ post_id: postId }, { status: 'reviewed' });
    // Reset report count on post and activate it
    await CommunityPost.findByIdAndUpdate(postId, { report_count: 0, status: 'active', auto_flag_reason: null });
    
    res.json({ message: 'Post approved and reports dismissed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/admin/reports/:postId/remove
router.post('/admin/reports/:postId/remove', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.adminRole !== 'moderator') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { postId } = req.params;
    
    // Soft delete the post
    await CommunityPost.findByIdAndUpdate(postId, { status: 'deleted' });
    // Mark reports as reviewed
    await CommunityReport.updateMany({ post_id: postId }, { status: 'reviewed' });
    
    res.json({ message: 'Post removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/admin/telemetry
router.get('/admin/telemetry', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.adminRole !== 'moderator') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const totalPosts = await CommunityPost.countDocuments({ status: { $ne: 'deleted' } });
    const autoFlagged = await CommunityPost.countDocuments({ status: 'pending_review' });
    const userReports = await CommunityReport.countDocuments({ status: 'pending' });
    
    res.json({
      totalActivePosts: totalPosts,
      pendingAutoFlagged: autoFlagged,
      pendingUserReports: userReports
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/users/:id/follow
router.post('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    const existingFollow = await UserFollow.findOne({ follower_id: req.user.id, followed_id: req.params.id });
    if (existingFollow) {
      await UserFollow.findByIdAndDelete(existingFollow._id);
      return res.json({ following: false });
    } else {
      await new UserFollow({ follower_id: req.user.id, followed_id: req.params.id }).save();
      return res.json({ following: true });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/users/:id/follow-status
router.get('/users/:id/follow-status', authMiddleware, async (req, res) => {
  try {
    const follow = await UserFollow.findOne({ follower_id: req.user.id, followed_id: req.params.id });
    res.json({ following: !!follow });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/community/users/interests
router.post('/users/interests', authMiddleware, async (req, res) => {
  try {
    const { tags } = req.body;
    let interest = await UserInterest.findOne({ user_id: req.user.id });
    if (interest) {
      interest.tags = tags;
      await interest.save();
    } else {
      interest = await new UserInterest({ user_id: req.user.id, tags }).save();
    }
    res.json(interest);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/users/interests
router.get('/users/interests', authMiddleware, async (req, res) => {
  try {
    const interest = await UserInterest.findOne({ user_id: req.user.id });
    res.json(interest || { tags: [] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/community/posts/:id/similar
router.get('/posts/:id/similar', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post || !post.tags || post.tags.length === 0) return res.json([]);
    
    // Find posts with overlapping tags, newest first
    const similar = await CommunityPost.find({
      _id: { $ne: post._id },
      tags: { $in: post.tags },
      status: { $nin: ['hidden', 'deleted'] }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user_id', 'full_name username avatar_url adminRole communityTitle institutionVerified role')
    .lean();
    
    // Standardize IDs for frontend
    const result = similar.map(p => {
      p.id = p._id.toString();
      if (p.user_id) p.author = p.user_id;
      return p;
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/community/posts/:id/resolve
router.put('/posts/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only author can resolve this question' });
    }
    if (post.template !== 'question') {
      return res.status(400).json({ message: 'Only question posts can be resolved' });
    }

    if (!post.template_data) post.template_data = {};
    post.template_data.is_resolved = !post.template_data.is_resolved;
    post.markModified('template_data');
    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
