const IdeaCircle = require('../models/IdeaCircle');
const CirclePost = require('../models/CirclePost');
const notificationService = require('../services/notificationService');

exports.getCircles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Only return public circles for guest/unjoined users if they are querying generally,
    // though the prompt says "Private circles are unreadable to non-members".
    // We handle that by filtering here.
    const query = { $or: [{ isPrivate: false }] };
    if (req.user) {
      query.$or.push({ members: req.user.id });
    }

    const circles = await IdeaCircle.find(query)
      .sort({ created_at: -1 })
      .skip(skip).limit(limit)
      .populate('owner', 'username avatar_url');
    
    const total = await IdeaCircle.countDocuments(query);
    res.json({ circles, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCircleById = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id)
      .populate('owner', 'username avatar_url')
      .populate('members', 'username avatar_url');
    
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.isPrivate) {
      if (!req.user || (!circle.members.some(m => m._id.toString() === req.user.id) && circle.owner._id.toString() !== req.user.id)) {
        return res.status(403).json({ message: 'Private circle' });
      }
    }
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createCircle = async (req, res) => {
  try {
    const { name, description, category, isPrivate } = req.body;
    const circle = new IdeaCircle({
      name, description, category, isPrivate, owner: req.user.id, members: [req.user.id]
    });
    await circle.save();
    res.status(201).json(circle);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateCircle = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { name, description, category, isPrivate } = req.body;
    if (name) circle.name = name;
    if (description) circle.description = description;
    if (category) circle.category = category;
    if (isPrivate !== undefined) circle.isPrivate = isPrivate;

    await circle.save();
    res.json(circle);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteCircle = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await circle.deleteOne();
    res.json({ message: 'Circle deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinCircle = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.isPrivate) return res.status(403).json({ message: 'Cannot freely join private circles' });

    if (!circle.members.includes(req.user.id)) {
      circle.members.push(req.user.id);
      await circle.save();

      if (circle.creator.toString() !== req.user.id) {
        await notificationService.createNotification({
          userId: circle.creator,
          type: 'circle_joined',
          relatedContentId: circle._id,
          message: 'Someone joined your idea circle!'
        });
      }
    }
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.leaveCircle = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });

    const userIdToRemove = req.params.userId || req.user.id;
    if (userIdToRemove !== req.user.id && circle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to remove this member' });
    }

    circle.members = circle.members.filter(m => m.toString() !== userIdToRemove);
    await circle.save();
    res.json(circle);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Posts
exports.getPosts = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (circle.isPrivate && (!req.user || (!circle.members.includes(req.user.id) && circle.owner.toString() !== req.user.id))) {
      return res.status(403).json({ message: 'Private circle' });
    }

    const posts = await CirclePost.find({ circle: circle._id })
      .populate('owner', 'username avatar_url')
      .sort({ isPinned: -1, created_at: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createPost = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: 'Circle not found' });
    if (!circle.members.includes(req.user.id) && circle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Must be a member to post' });
    }

    const post = new CirclePost({
      content: req.body.content,
      owner: req.user.id,
      circle: circle._id
    });
    await post.save();
    await post.populate('owner', 'username avatar_url');
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await CirclePost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    post.editHistory.push({ content: post.content });
    post.content = req.body.content;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await CirclePost.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.pinPost = async (req, res) => {
  try {
    const circle = await IdeaCircle.findById(req.params.id);
    if (!circle || circle.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to pin posts' });
    }
    
    const post = await CirclePost.findById(req.params.postId);
    if (!post || post.circle.toString() !== circle._id.toString()) {
      return res.status(404).json({ message: 'Post not found in this circle' });
    }

    post.isPinned = req.body.isPinned !== undefined ? req.body.isPinned : true;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
