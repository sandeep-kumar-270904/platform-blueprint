const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isNotBanned = require('../middleware/isNotBanned');
const RoomRentalChat = require('../models/RoomRentalChat');
const RoomRental = require('../models/RoomRental');
const sanitize = require('../middleware/sanitize');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/room-rental-chats/:roomId
router.get('/:roomId', auth, async (req, res) => {
  try {
    const userId = (req.user.id || req.user.userId);
    let chat = await RoomRentalChat.findOne({
      room: req.params.roomId,
      participants: userId
    }).populate('participants', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');
      
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/room-rental-chats/:roomId
router.post('/:roomId', auth, isNotBanned, sanitize, async (req, res) => {
  try {
    const { content, recipientId } = req.body;
    const userId = (req.user.id || req.user.userId);
    
    // Check message length
    if (content.length > 2000) {
      return res.status(400).json({ message: 'Message is too long (max 2000 characters).' });
    }

    let chat = await RoomRentalChat.findOne({
      room: req.params.roomId,
      participants: { $all: [userId, recipientId] }
    });

    if (!chat) {
      // Verify room exists before creating new chat
      const room = await RoomRental.findById(req.params.roomId);
      if (!room) return res.status(404).json({ message: 'Room not found' });
      
      chat = new RoomRentalChat({
        room: req.params.roomId,
        participants: [userId, recipientId],
        messages: []
      });
    } else {
      // Security check: Verify user is a participant
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: 'Unauthorized access to chat.' });
      }
    }

    chat.messages.push({
      sender: userId,
      content,
      readBy: [userId]
    });

    await chat.save();
    
    // Return populated message
    await chat.populate('messages.sender', 'name profilePicture');
    const savedMessage = chat.messages[chat.messages.length - 1];

    // Notify recipient
    try {
      const recipientUser = await User.findById(recipientId).select('notificationPreferences');
      const pref = recipientUser?.notificationPreferences?.roomRentals?.new_messages || 'instant';
      
      if (pref !== 'off') {
        await Notification.create({
          userId: recipientId,
          type: 'room_rental_new_message',
          message: `You received a new message regarding a room rental.`,
          relatedContentId: chat._id,
          actors: [{ userId: userId }],
          isDigest: pref === 'digest'
        });
      }
    } catch (notifErr) {
      console.error('Error sending chat notification:', notifErr);
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
