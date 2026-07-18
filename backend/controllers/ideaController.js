const Idea = require('../models/Idea');
const IdeaComment = require('../models/IdeaComment');
const IdeaUpvote = require('../models/IdeaUpvote');
const IdeaSave = require('../models/IdeaSave');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.getIdeas = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = { is_public: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;

    const ideas = await Idea.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'username avatar_url full_name');
    
    const total = await Idea.countDocuments(filter);
    res.json({ ideas, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getIdeaById = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('owner', 'username avatar_url full_name')
      .populate('collaborators.user', 'username avatar_url');
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    res.json(idea);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createIdea = async (req, res) => {
  try {
    const { title, description, category, is_public, collaborators, imageAttachments } = req.body;
    const newIdea = new Idea({
      title, description, category, is_public, imageAttachments, owner: req.user.id
    });
    if (collaborators) newIdea.collaborators = collaborators;
    await newIdea.save();
    res.status(201).json(newIdea);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    if (idea.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    // Save edit history
    idea.editHistory.push({ title: idea.title, description: idea.description });

    const { title, description, category, is_public, status } = req.body;
    if (title) idea.title = title;
    if (description) idea.description = description;
    if (category) idea.category = category;
    if (is_public !== undefined) idea.is_public = is_public;
    if (status) idea.status = status;

    await idea.save();
    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    if (idea.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await idea.deleteOne(); // triggers pre hooks
    res.json({ message: 'Idea deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upvotes
exports.toggleUpvote = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    const existing = await IdeaUpvote.findOne({ user: req.user.id, idea: idea._id });
    if (existing) {
      await existing.deleteOne();
      idea.upvoteCount = Math.max(0, idea.upvoteCount - 1);
    } else {
      await IdeaUpvote.create({ user: req.user.id, idea: idea._id });
      idea.upvoteCount += 1;
      
      if (idea.owner.toString() !== req.user.id) {
        await notificationService.createNotification({
          userId: idea.owner,
          type: 'idea_upvote',
          relatedContentId: idea._id,
          message: 'Someone upvoted your idea!'
        });
      }
    }
    await idea.save();
    res.json({ upvoteCount: idea.upvoteCount, upvoted: !existing });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Saves
exports.toggleSave = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    const existing = await IdeaSave.findOne({ user: req.user.id, idea: idea._id });
    if (existing) {
      await existing.deleteOne();
      res.json({ saved: false });
    } else {
      await IdeaSave.create({ user: req.user.id, idea: idea._id });
      res.json({ saved: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Comments
exports.getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const comments = await IdeaComment.find({ parentIdea: req.params.id, parentComment: null })
      .sort({ created_at: -1 })
      .skip(skip).limit(limit)
      .populate('owner', 'username avatar_url');
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) return res.status(404).json({ message: 'Idea not found' });

    const comment = new IdeaComment({
      content: req.body.content,
      owner: req.user.id,
      parentIdea: idea._id,
      parentComment: req.body.parentComment || null
    });
    await comment.save();
    idea.commentCount += 1;
    await idea.save();

    if (idea.owner.toString() !== req.user.id) {
      await notificationService.createNotification({
        userId: idea.owner,
        type: 'idea_comment',
        relatedContentId: idea._id,
        message: 'Someone commented on your idea!'
      });
    }

    // Mentions parsing
    const mentions = req.body.content.match(/@(\w+)/g);
    if (mentions) {
      const usernames = mentions.map(m => m.substring(1));
      const mentionedUsers = await User.find({ username: { $in: usernames } });
      for (const user of mentionedUsers) {
        if (user._id.toString() !== req.user.id) {
          await notificationService.createNotification({
            userId: user._id,
            type: 'mention',
            relatedContentId: idea._id,
            message: `You were mentioned in an idea comment!`
          });
        }
      }
    }

    await comment.populate('owner', 'username avatar_url');
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const comment = await IdeaComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    comment.editHistory.push({ content: comment.content });
    comment.content = req.body.content;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await IdeaComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await comment.deleteOne();
    await Idea.findByIdAndUpdate(comment.parentIdea, { $inc: { commentCount: -1 } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
