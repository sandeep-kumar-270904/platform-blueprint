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

    const classrooms = await VirtualClassroom.find()
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

    participant.status = 'left';
    await participant.save();

    // Decrement count if they were registered (not waitlisted)
    if (participant.status !== 'waitlisted') {
      const classroom = await VirtualClassroom.findById(req.params.id);
      if (classroom && classroom.participant_count > 0) {
        classroom.participant_count -= 1;
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
    res.json(messages);
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

module.exports = router;
