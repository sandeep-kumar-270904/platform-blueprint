const DirectMessage = require('../models/DirectMessage');

exports.getConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversations = await DirectMessage.find({ participants: req.user.id })
      .sort({ 'messages.sentAt': -1 })
      .skip(skip).limit(limit)
      .populate('participants', 'username avatar_url');
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getConversationById = async (req, res) => {
  try {
    const conversation = await DirectMessage.findById(req.params.id)
      .populate('participants', 'username avatar_url')
      .populate('messages.sender', 'username avatar_url');
    
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
    if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { participantIds, content } = req.body; // array of user ids if new
    let conversation;

    if (req.params.id) {
      conversation = await DirectMessage.findById(req.params.id);
      if (!conversation || !conversation.participants.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else {
      // Find existing or create new
      const pIds = [...new Set([...participantIds, req.user.id])];
      conversation = await DirectMessage.findOne({ participants: { $all: pIds, $size: pIds.length } });
      if (!conversation) {
        conversation = new DirectMessage({ participants: pIds, messages: [] });
      }
    }

    const newMessage = {
      sender: req.user.id,
      content,
      readBy: [req.user.id],
      sentAt: new Date()
    };
    conversation.messages.push(newMessage);
    await conversation.save();

    // Populate sender for realtime broadcast
    const populatedConv = await DirectMessage.populate(conversation, { path: 'messages.sender', select: 'username avatar_url' });
    const addedMessage = populatedConv.messages[populatedConv.messages.length - 1];

    if (req.io) {
      // Broadcast to all participants' rooms
      conversation.participants.forEach(pId => {
        req.io.to(`user:${pId.toString()}`).emit('new_direct_message', { conversationId: conversation._id, message: addedMessage });
      });
    }

    res.status(201).json(conversation);
  } catch (error) {
    res.status(400).json({ message: 'Validation error', error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const conversation = await DirectMessage.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let modified = false;
    conversation.messages.forEach(msg => {
      if (!msg.readBy.includes(req.user.id)) {
        msg.readBy.push(req.user.id);
        modified = true;
      }
    });

    if (modified) await conversation.save();
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
