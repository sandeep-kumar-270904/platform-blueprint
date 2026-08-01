const RoommateChat = require('../models/RoommateChat');
const RoommateConnection = require('../models/RoommateConnection');

// Retrieve a chat by the roommate connection ID
exports.getChatByConnectionId = async (req, res) => {
  try {
    const { connectionId } = req.params;
    
    // Validate connection exists and user is a participant
    const connection = await RoommateConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Roommate connection not found' });
    }
    
    if (connection.requester.toString() !== req.user.id && connection.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    if (connection.status !== 'Accepted') {
      return res.status(403).json({ message: 'Chat is only available for accepted connections' });
    }

    let chat = await RoommateChat.findOne({ connectionId })
      .populate('participants', 'name full_name profilePicture avatar_url')
      .populate('messages.sender', 'name full_name profilePicture avatar_url');

    if (!chat) {
      // Create empty chat
      chat = new RoommateChat({
        connectionId,
        participants: [connection.requester, connection.recipient],
        messages: []
      });
      await chat.save();
      // Repopulate for return
      chat = await RoommateChat.populate(chat, { path: 'participants', select: 'name full_name profilePicture avatar_url' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Retrieve a chat by the roommate group ID
exports.getChatByGroupId = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Validate group exists and user is an active member
    const RoommateGroup = require('../models/RoommateGroup');
    const group = await RoommateGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Roommate group not found' });
    }
    
    if (!group.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this group chat' });
    }

    let chat = await RoommateChat.findOne({ groupId })
      .populate('participants', 'name full_name profilePicture avatar_url')
      .populate('messages.sender', 'name full_name profilePicture avatar_url');

    if (!chat) {
      // Create empty chat
      chat = new RoommateChat({
        groupId,
        participants: group.members,
        messages: []
      });
      await chat.save();
      // Repopulate for return
      chat = await RoommateChat.populate(chat, { path: 'participants', select: 'name full_name profilePicture avatar_url' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching group chat:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { content, isGroup } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ message: 'Message exceeds maximum length of 2000 characters' });
    }

    let chat;
    if (isGroup) {
      chat = await RoommateChat.findOne({ groupId: connectionId });
    } else {
      const connection = await RoommateConnection.findById(connectionId);
      if (!connection) {
        return res.status(404).json({ message: 'Roommate connection not found' });
      }
      if (connection.requester.toString() !== req.user.id && connection.recipient.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to send messages' });
      }
      chat = await RoommateChat.findOne({ connectionId });
      if (!chat) {
        chat = new RoommateChat({
          connectionId,
          participants: [connection.requester, connection.recipient],
          messages: []
        });
      }
    }

    if (chat.status === 'archived') {
      return res.status(403).json({ message: 'This chat is archived and read-only' });
    }

    const newMessage = {
      sender: req.user.id,
      content,
      readBy: [req.user.id],
      sentAt: new Date()
    };

    chat.messages.push(newMessage);
    chat.updated_at = new Date();
    await chat.save();

    const populatedChat = await RoommateChat.populate(chat, { path: 'messages.sender', select: 'name full_name profilePicture avatar_url' });
    const addedMessage = populatedChat.messages[populatedChat.messages.length - 1];

    // Determine room ID for Socket.IO
    const roomPrefix = isGroup ? 'roommate_group_chat_' : 'roommate_chat_';
    const roomId = `${roomPrefix}${connectionId}`;

    // Emit event via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('roommate_message:new', {
        chatId: chat._id,
        message: addedMessage,
        groupId: isGroup ? connectionId : null
      });
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error sending roommate message:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark chat messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { isGroup } = req.body;

    let chat;
    if (isGroup) {
      chat = await RoommateChat.findOne({ groupId: connectionId });
    } else {
      chat = await RoommateChat.findOne({ connectionId });
    }
    
    if (!chat || !chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let modified = false;
    chat.messages.forEach(msg => {
      if (!msg.readBy.includes(req.user.id)) {
        msg.readBy.push(req.user.id);
        modified = true;
      }
    });

    if (modified) await chat.save();
    res.json({ message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking roommate messages read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
