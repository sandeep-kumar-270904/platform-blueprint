const express = require('express');
const router = express.Router();
const VirtualClassroom = require('../models/VirtualClassroom');
const ClassroomParticipant = require('../models/ClassroomParticipant');
const ClassroomCollection = require('../models/ClassroomCollection');
const ClassroomMessage = require('../models/ClassroomMessage');
const authMiddleware = require('../middleware/auth'); // ensure user is logged in

// GET /api/classrooms - Fetch classrooms with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    let query = {};
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      query = { $or: [{ title: regex }, { subject: regex }, { description: regex }] };
    }

    const classrooms = await VirtualClassroom.find(query)
      .sort({ is_featured: -1, scheduled_at: 1 })
      .skip(skip)
      .limit(limit);

    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/host - Fetch classrooms hosted by the user
router.get('/host', authMiddleware, async (req, res) => {
  try {
    const classrooms = await VirtualClassroom.find({ host_id: req.user.id }).sort({ scheduled_at: 1 });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/host/analytics - Fetch analytics for host
router.get('/host/analytics', authMiddleware, async (req, res) => {
  try {
    const hostedClasses = await VirtualClassroom.find({ host_id: req.user.id });
    
    if (!hostedClasses || hostedClasses.length === 0) {
      return res.json({ totalSessions: 0 });
    }

    // Mock analytics for now, can be replaced with real DB models later
    res.json({
      totalSessions: hostedClasses.length,
      totalAttendees: Math.floor(Math.random() * 100) + 10,
      avgRating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
      avgDuration: Math.floor(Math.random() * 60) + 30, // 30 - 90 mins
      totalEarnings: Math.floor(Math.random() * 1000)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/templates - Fetch classroom templates for host
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const VirtualClassroomTemplate = require('../models/VirtualClassroomTemplate');
    const templates = await VirtualClassroomTemplate.find({ host_id: req.user.id }).sort({ created_at: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/templates - Create a classroom template
router.post('/templates', authMiddleware, async (req, res) => {
  try {
    const VirtualClassroomTemplate = require('../models/VirtualClassroomTemplate');
    const newTemplate = new VirtualClassroomTemplate({
      ...req.body,
      host_id: req.user.id
    });
    const savedTemplate = await newTemplate.save();
    res.status(201).json(savedTemplate);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/bulk - Create multiple sessions
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const sessions = req.body.sessions.map(s => ({
      ...s,
      host_id: req.user.id,
      join_code: Math.random().toString(36).substring(2, 10)
    }));
    
    const savedSessions = await VirtualClassroom.insertMany(sessions);
    res.status(201).json(savedSessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/my-participation - Fetch user's RSVPs
router.get('/my-participation', authMiddleware, async (req, res) => {
  try {
    const participations = await ClassroomParticipant.find({ user_id: req.user.id });
    res.json(participations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/collections - Fetch collections
router.get('/collections', async (req, res) => {
  try {
    const collections = await ClassroomCollection.find({ is_active: true }).populate('items.classroom_id');
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms - Create a new classroom
router.post('/', authMiddleware, async (req, res) => {
  try {
    const join_code = Math.random().toString(36).substring(2, 10);
    const newClassroom = new VirtualClassroom({
      ...req.body,
      host_id: req.user.id,
      join_code
    });

    const savedClassroom = await newClassroom.save();
    res.status(201).json(savedClassroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/classrooms/:id/join - RSVP/Join a classroom
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    let participant = await ClassroomParticipant.findOne({ classroom_id: classroom._id, user_id: req.user.id });
    
    if (participant) {
      if (participant.status === 'left') {
        participant.status = 'registered';
        await participant.save();
        return res.json({ message: 'Re-joined successfully' });
      }
      return res.status(400).json({ message: 'Already joined' });
    }

    const status = classroom.participant_count >= classroom.max_participants ? 'waitlisted' : 'registered';
    
    participant = new ClassroomParticipant({
      classroom_id: classroom._id,
      user_id: req.user.id,
      status,
      role: classroom.host_id.toString() === req.user.id ? 'host' : 'participant'
    });

    await participant.save();

    if (status === 'registered') {
      classroom.participant_count += 1;
      await classroom.save();
    }

    res.json({ message: status === 'waitlisted' ? 'Added to waitlist' : 'Joined successfully', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/leave - Leave a classroom
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    const wasRegistered = participant.status === 'registered' || participant.status === 'attending';

    participant.status = 'left';
    await participant.save();

    // Decrement count if they were registered (not waitlisted)
    if (wasRegistered) {
      const classroom = await VirtualClassroom.findById(req.params.id);
      if (classroom && classroom.participant_count > 0) {
        classroom.participant_count -= 1;
        
        // Waitlist promotion logic
        const nextInLine = await ClassroomParticipant.findOne({ classroom_id: classroom._id, status: 'waitlisted' }).sort({ createdAt: 1 });
        if (nextInLine) {
          nextInLine.status = 'registered';
          await nextInLine.save();
          classroom.participant_count += 1;
        }

        await classroom.save();
      }
    }

    res.json({ message: 'Left successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classrooms/:id - Delete a classroom
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });

    if (classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await classroom.deleteOne();
    await ClassroomParticipant.deleteMany({ classroom_id: req.params.id });
    
    res.json({ message: 'Classroom deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id/messages - Get chat messages
router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await ClassroomMessage.find({ classroom_id: req.params.id }).sort({ created_at: 1 });
    
    // Enrich with profiles
    const User = require('../models/User');
    const userIds = [...new Set(messages.map(m => m.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('username full_name avatar_url');
    const userMap = users.reduce((acc, u) => { acc[u._id] = u; return acc; }, {});
    
    const enriched = messages.map(m => {
      const mObj = m.toObject();
      mObj.profile = userMap[m.user_id];
      return mObj;
    });
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/messages - Send chat message
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const newMessage = new ClassroomMessage({
      classroom_id: req.params.id,
      user_id: req.user.id,
      content: req.body.content
    });
    const savedMessage = await newMessage.save();
    
    // Broadcast message to room using socket.io
    req.io.to(`classroom_${req.params.id}`).emit('new_message', savedMessage);
    
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/messages/:messageId/reactions - React to message
router.post('/:id/messages/:messageId/reactions', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await ClassroomMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // In a full implementation, this might be a separate Reaction model or an array on the message
    // For now we will just mock a success since we are finishing up the blueprint
    req.io.to(`classroom_${req.params.id}`).emit('message_reaction', {
      message_id: req.params.messageId,
      user_id: req.user.id,
      emoji
    });
    
    res.json({ message: 'Reaction added' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/classrooms/:id/messages/:messageId - Delete a message
router.delete('/:id/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await ClassroomMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });
    
    // Allow author or classroom host to delete
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (message.user_id.toString() !== req.user.id && classroom.host_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }
    
    await message.deleteOne();
    
    req.io.to(`classroom_${req.params.id}`).emit('message_deleted', req.params.messageId);
    
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/settings - Update settings (Host only)
router.post('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.room_settings = { ...classroom.room_settings, ...req.body.settings };
    await classroom.save();

    req.io.to(`classroom_${req.params.id}`).emit('settings_updated', classroom.room_settings);

    res.json(classroom.room_settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classrooms/:id - Get single classroom details
router.get('/:id', async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/transactions - Mock payment completion
router.post('/:id/transactions', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Classroom not found' });
    
    // In a real app we'd save a transaction record to Stripe and the DB here
    res.json({ message: 'Payment successful', transaction_id: 'tx_mock_' + Date.now() });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/classrooms/:id - Edit a classroom (Host only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(classroom, req.body);
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/cancel - Cancel a classroom (Host only)
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.status = 'cancelled';
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/recording - Add recording URL (Host only)
router.patch('/:id/recording', authMiddleware, async (req, res) => {
  try {
    const classroom = await VirtualClassroom.findById(req.params.id);
    if (!classroom) return res.status(404).json({ message: 'Not found' });
    if (classroom.host_id.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    classroom.recording_url = req.body.recording_url;
    await classroom.save();
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/classrooms/:id/reminders - Toggle reminders (Participant only)
router.patch('/:id/reminders', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    participant.reminders_opt_in = !participant.reminders_opt_in;
    await participant.save();
    res.json({ message: 'Reminders updated', reminders_opt_in: participant.reminders_opt_in });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classrooms/:id/rating - Submit rating (Participant only)
router.post('/:id/rating', authMiddleware, async (req, res) => {
  try {
    const participant = await ClassroomParticipant.findOne({ classroom_id: req.params.id, user_id: req.user.id });
    if (!participant) return res.status(400).json({ message: 'Not joined' });

    const { rating, feedback } = req.body;
    
    const isNewRating = participant.rating == null;
    participant.rating = rating;
    participant.feedback = feedback;
    await participant.save();

    const classroom = await VirtualClassroom.findById(req.params.id);
    if (classroom) {
      if (isNewRating) {
        const total = classroom.rating_avg * classroom.rating_count;
        classroom.rating_count += 1;
        classroom.rating_avg = (total + rating) / classroom.rating_count;
      } else {
        const allRatings = await ClassroomParticipant.find({ classroom_id: classroom._id, rating: { $ne: null } });
        const sum = allRatings.reduce((acc, p) => acc + p.rating, 0);
        classroom.rating_count = allRatings.length;
        classroom.rating_avg = sum / allRatings.length;
      }
      await classroom.save();
    }

    res.json({ message: 'Rating submitted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
