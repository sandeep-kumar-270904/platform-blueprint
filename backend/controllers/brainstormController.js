const BrainstormSession = require('../models/BrainstormSession');
const BrainstormThought = require('../models/BrainstormThought');
const notificationService = require('../services/notificationService');

exports.getSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const sessions = await BrainstormSession.find()
      .sort({ created_at: -1 })
      .skip(skip).limit(limit)
      .populate('creator', 'username avatar_url')
      .populate('participants', 'username avatar_url');
    
    const total = await BrainstormSession.countDocuments();
    res.json({ sessions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id)
      .populate('creator', 'username avatar_url')
      .populate('participants', 'username avatar_url');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const session = new BrainstormSession({
      title, description, category, creator: req.user.id, participants: [req.user.id]
    });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.creator.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { title, description, category, status } = req.body;
    if (title) session.title = title;
    if (description) session.description = description;
    if (category) session.category = category;
    if (status) session.status = status;

    await session.save();
    res.json(session);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.creator.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await session.deleteOne();
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.joinSession = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'archived') return res.status(400).json({ message: 'Session is archived' });

    if (!session.participants.includes(req.user.id)) {
      session.participants.push(req.user.id);
      await session.save();

      if (session.creator.toString() !== req.user.id) {
        await notificationService.createNotification({
          userId: session.creator,
          type: 'session_joined',
          relatedContentId: session._id,
          message: 'Someone joined your brainstorm session!'
        });
      }
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.leaveSession = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Only creator can remove someone else, otherwise you can only remove yourself
    const userIdToRemove = req.params.userId || req.user.id;
    if (userIdToRemove !== req.user.id && session.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to remove this participant' });
    }

    session.participants = session.participants.filter(p => p.toString() !== userIdToRemove);
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Thoughts
exports.getThoughts = async (req, res) => {
  try {
    const thoughts = await BrainstormThought.find({ session: req.params.id })
      .populate('owner', 'username avatar_url')
      .sort({ created_at: 1 });
    res.json(thoughts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.addThought = async (req, res) => {
  try {
    const session = await BrainstormSession.findById(req.params.id);
    if (!session || session.status === 'archived') return res.status(400).json({ message: 'Session not available' });

    const thought = new BrainstormThought({
      content: req.body.content,
      owner: req.user.id,
      session: session._id
    });
    await thought.save();
    await thought.populate('owner', 'username avatar_url');

    if (req.io) {
      req.io.to(`brainstorm_${session._id}`).emit('brainstorm_thought_added', thought);
    }
    res.status(201).json(thought);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.updateThought = async (req, res) => {
  try {
    const thought = await BrainstormThought.findById(req.params.thoughtId);
    if (!thought) return res.status(404).json({ message: 'Thought not found' });
    if (thought.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    thought.editHistory.push({ content: thought.content });
    thought.content = req.body.content;
    await thought.save();
    await thought.populate('owner', 'username avatar_url');

    if (req.io) {
      req.io.to(`brainstorm_${thought.session}`).emit('brainstorm_thought_updated', thought);
    }
    res.json(thought);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.deleteThought = async (req, res) => {
  try {
    const thought = await BrainstormThought.findById(req.params.thoughtId);
    if (!thought) return res.status(404).json({ message: 'Thought not found' });
    if (thought.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    await thought.deleteOne();

    if (req.io) {
      req.io.to(`brainstorm_${thought.session}`).emit('brainstorm_thought_deleted', thought._id);
    }
    res.json({ message: 'Thought deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.reactToThought = async (req, res) => {
  try {
    const thought = await BrainstormThought.findById(req.params.thoughtId);
    if (!thought) return res.status(404).json({ message: 'Thought not found' });

    const { emoji } = req.body;
    const existingIndex = thought.reactions.findIndex(r => r.user.toString() === req.user.id && r.emoji === emoji);
    if (existingIndex > -1) {
      thought.reactions.splice(existingIndex, 1);
    } else {
      thought.reactions.push({ user: req.user.id, emoji });
    }
    await thought.save();

    if (req.io) {
      req.io.to(`brainstorm_${thought.session}`).emit('brainstorm_thought_reacted', { thoughtId: thought._id, reactions: thought.reactions });
    }
    res.json(thought.reactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
