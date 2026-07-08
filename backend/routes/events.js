const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventAttendance = require('../models/EventAttendance');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let query = { status: 'published' };
    if (type && type !== 'all') {
      query.type = type;
    }

    const events = await Event.find(query).sort({ starts_at: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events
router.post('/', authMiddleware, async (req, res) => {
  try {
    const newEvent = new Event({
      organizer_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      type: req.body.type,
      mode: req.body.mode,
      venue: req.body.venue,
      starts_at: req.body.starts_at,
      ends_at: req.body.ends_at,
      registration_deadline: req.body.registration_deadline,
      capacity: req.body.capacity,
      prize: req.body.prize,
      tags: req.body.tags || []
    });

    const savedEvent = await newEvent.save();
    req.io.emit('event_created', savedEvent);
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/register
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Not found' });

    if (!event.registered_users.includes(userId)) {
      event.registered_users.push(userId);
      await event.save();
    }

    req.io.emit('event_updated', eventId);
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/events/:id/register
router.delete('/:id/register', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Not found' });

    event.registered_users = event.registered_users.filter(id => id.toString() !== userId.toString());
    await event.save();

    req.io.emit('event_updated', eventId);
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/registrations/me
router.get('/registrations/me', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ registered_users: req.user.id }).select('_id');
    res.json(events.map(e => ({ event_id: e._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id/attendance
router.get('/:id/attendance', async (req, res) => {
  try {
    const attendance = await EventAttendance.find({ event_id: req.params.id }).lean();
    
    const userIds = [...new Set(attendance.map(a => a.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username').lean();
    
    // We return both rows and profiles to easily map in frontend
    res.json({ rows: attendance, profiles: users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/check-in
router.post('/:id/check-in', authMiddleware, async (req, res) => {
  try {
    const eventId = req.params.id;
    const targetUserId = req.body.user_id || req.user.id;
    
    const checkIn = new EventAttendance({
      event_id: eventId,
      user_id: targetUserId
    });
    await checkIn.save();
    
    req.io.emit('event_attendance_updated', eventId);
    res.json(checkIn);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Already checked in' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/attendance/me
router.get('/attendance/me', authMiddleware, async (req, res) => {
  try {
    const count = await EventAttendance.countDocuments({ user_id: req.user.id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
