const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { type, status, filter, search, sort } = req.query;
    
    // Default to approved public events
    let query = { status: status || 'approved' };
    
    if (type && type !== 'all') {
      query.eventType = type;
    }
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    
    if (filter === 'upcoming') {
      query.startDate = { $gte: new Date() };
    } else if (filter === 'past') {
      query.startDate = { $lt: new Date() };
    } else if (filter === 'this_week') {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query.startDate = { $gte: now, $lte: in7Days };
    }
    
    if (req.query.month) {
      // e.g. 2026-07
      const [year, month] = req.query.month.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      query.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
    
    let sortObj = { startDate: 1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'date_desc') sortObj = { startDate: -1 };
    
    const events = await Event.find(query).sort(sortObj).populate('hostedBy', 'username full_name avatar_url');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('hostedBy', 'username full_name avatar_url');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const registrationCount = await EventRegistration.countDocuments({ eventId: event._id, status: { $in: ['registered', 'waitlisted'] } });
    
    // Return event with registration count attached
    const eventObj = event.toObject();
    eventObj.registrationCount = registrationCount;
    
    res.json(eventObj);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, capacity, title, description, eventType, startTime, endTime, venue, hostName } = req.body;
    
    if (!title || !description || !eventType || !startDate || !endDate || !startTime || !endTime || !venue || !hostName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (new Date(startDate) < new Date(new Date().setHours(0,0,0,0))) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after or equal to start date' });
    }
    if (capacity !== undefined && capacity !== null && capacity <= 0) {
      return res.status(400).json({ message: 'Capacity must be positive' });
    }
    
    const newEvent = new Event({
      ...req.body,
      hostedBy: req.user.id,
      status: 'pending_approval'
    });
    
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const user = await User.findById(req.user.id);
    const isAdmin = user && user.role === 'admin';
    
    if (event.hostedBy.toString() !== req.user.id && !isAdmin) {
      return res.status(403).json({ message: 'Unauthorized to edit this event' });
    }
    
    const { startDate, endDate, capacity, title, venue } = req.body;
    
    if (startDate && new Date(startDate) < new Date(new Date().setHours(0,0,0,0)) && new Date(startDate).getTime() !== event.startDate.getTime()) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ message: 'End date must be after or equal to start date' });
    }
    if (capacity !== undefined && capacity !== null && capacity <= 0) {
      return res.status(400).json({ message: 'Capacity must be positive' });
    }
    
    // Check if significant fields changed
    const needsReapproval = (
      (title && title !== event.title) ||
      (startDate && new Date(startDate).getTime() !== event.startDate.getTime()) ||
      (venue && venue !== event.venue)
    );
    
    Object.assign(event, req.body);
    
    if (needsReapproval && event.status === 'approved' && !isAdmin) {
      event.status = 'pending_approval';
    }
    
    await event.save();
    
    // Notify attendees if crucial details changed
    if (needsReapproval) {
      const Notification = require('../models/Notification');
      const attendees = await EventRegistration.find({ eventId: event._id, status: { $in: ['registered', 'waitlisted'] } });
      for (const attendee of attendees) {
        await Notification.create({
          userId: attendee.userId,
          type: 'event_updated',
          relatedContentId: event._id,
          message: `The event "${event.title}" has been updated (Date/Time/Venue changed).`
        });
      }
    }
    
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const user = await User.findById(req.user.id);
    if (event.hostedBy.toString() !== req.user.id && (!user || user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    
    // Notify attendees before cleaning up registrations
    const Notification = require('../models/Notification');
    const attendees = await EventRegistration.find({ eventId: event._id, status: { $in: ['registered', 'waitlisted'] } });
    for (const attendee of attendees) {
      await Notification.create({
        userId: attendee.userId,
        type: 'event_cancelled',
        message: `The event "${event.title}" has been cancelled by the host.`
      });
    }
    
    // Cleanup registrations
    await EventRegistration.deleteMany({ eventId: req.params.id });
    
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/register
router.post('/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'approved') return res.status(400).json({ message: 'Event is not open for registration' });
    
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }
    
    const existingReg = await EventRegistration.findOne({ eventId: event._id, userId: req.user.id });
    if (existingReg) {
      return res.status(400).json({ message: 'Already registered' });
    }
    
    const count = await EventRegistration.countDocuments({ eventId: event._id, status: 'registered' });
    
    let status = 'registered';
    if (event.capacity && count >= event.capacity) {
      status = 'waitlisted';
    }
    
    const reg = new EventRegistration({
      eventId: event._id,
      userId: req.user.id,
      status,
      teamName: req.body.teamName || null,
      teamMembers: req.body.teamMembers || []
    });
    
    await reg.save();
    res.json({ message: 'Registration successful', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/events/:id/register
router.delete('/:id/register', authMiddleware, async (req, res) => {
  try {
    const reg = await EventRegistration.findOneAndDelete({ eventId: req.params.id, userId: req.user.id });
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    
    // If they were 'registered', promote a waitlisted user
    if (reg.status === 'registered') {
      const nextWaitlisted = await EventRegistration.findOne({ eventId: req.params.id, status: 'waitlisted' }).sort({ registeredAt: 1 });
      if (nextWaitlisted) {
        nextWaitlisted.status = 'registered';
        await nextWaitlisted.save();
        
        const Event = require('../models/Event');
        const Notification = require('../models/Notification');
        const event = await Event.findById(req.params.id);
        
        await Notification.create({
          userId: nextWaitlisted.userId,
          type: 'waitlist_confirmed',
          relatedContentId: event._id,
          message: `Good news! A spot opened up for "${event.title}" and you are now officially registered.`
        });
      }
    }
    
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id/attendees
router.get('/:id/attendees', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const user = await User.findById(req.user.id);
    if (event.hostedBy.toString() !== req.user.id && (!user || user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized to view attendees' });
    }
    
    const attendees = await EventRegistration.find({ eventId: event._id })
      .populate('userId', 'username full_name email avatar_url')
      .sort({ registeredAt: 1 });
      
    res.json(attendees);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
