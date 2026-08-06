const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const EventFeedback = require('../models/EventFeedback');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const authMiddleware = require('../middleware/auth');
const { notifyDashboardUpdate } = require('../services/dashboardCache');

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
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (filter === 'upcoming') {
      query.endDate = { $gte: new Date() };
    } else if (filter === 'past') {
      query.endDate = { $lt: new Date() };
    } else if (filter === 'this_week') {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(in7Days.getDate() + 7);
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
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('hostedBy', 'username full_name avatar_url')
      .populate('hostCollegeId', 'name')
      .lean();
      
    const total = await Event.countDocuments(query);
      
    // Append registrationCount
    const eventIds = events.map(e => e._id);
    const regCounts = await EventRegistration.aggregate([
      { $match: { eventId: { $in: eventIds }, status: { $in: ['registered', 'waitlisted'] } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ]);
    
    const countMap = {};
    regCounts.forEach(rc => { countMap[rc._id.toString()] = rc.count; });
    
    const eventsWithCount = events.map(e => ({
      ...e,
      id: e._id,
      registrationCount: countMap[e._id.toString()] || 0
    }));
    
    res.json({
      events: eventsWithCount,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('hostedBy', 'username full_name avatar_url')
      .populate('hostCollegeId', 'name');
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
    
    const user = await User.findById(req.user.id);
    const isAdmin = user && user.role === 'admin';
    
    if (!isAdmin) {
      // Enforce max 3 pending_approval events
      const pendingCount = await Event.countDocuments({ hostedBy: req.user.id, status: 'pending_approval' });
      if (pendingCount >= 3) {
        return res.status(403).json({ message: 'You have reached the maximum limit of 3 pending events. Please wait for them to be reviewed.' });
      }
    }

    const event = new Event({
      ...req.body,
      hostedBy: req.user.id,
      status: isAdmin ? 'approved' : 'pending_approval'
    });
    
    await event.save();
    res.status(201).json(event);
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
      const attendees = await EventRegistration.find({ eventId: event._id, status: { $in: ['registered', 'waitlisted'] } });
      for (const attendee of attendees) {
        await notificationService.createNotification({
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
    const attendees = await EventRegistration.find({ eventId: event._id, status: { $in: ['registered', 'waitlisted'] } });
    for (const attendee of attendees) {
      await notificationService.createNotification({
        userId: attendee.userId,
        type: 'event_cancelled',
        message: `The event "${event.title}" has been cancelled by the host.`
      });
    }
    
    // Cleanup registrations and feedback
    await EventRegistration.deleteMany({ eventId: req.params.id });
    await EventFeedback.deleteMany({ eventId: req.params.id });
    
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id/registrations/me
router.get('/:id/registrations/me', authMiddleware, async (req, res) => {
  try {
    const reg = await EventRegistration.findOne({ eventId: req.params.id, userId: req.user.id });
    if (!reg) return res.status(404).json({ message: 'Not registered' });
    res.json(reg);
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
    
    const teamName = req.body.teamName || null;
    const lookingForTeammates = req.body.lookingForTeammates || false;
    const skills = req.body.skills || '';
    
    if (event.eventType === 'hackathon' || event.eventType === 'competition') {
      const min = event.teamSize?.min || 1;
      const max = event.teamSize?.max || 1;
      
      if (teamName) {
        const existingTeamMembers = await EventRegistration.countDocuments({ eventId: event._id, teamName });
        if (existingTeamMembers + 1 > max) {
          return res.status(400).json({ message: `Team '${teamName}' is already full (max ${max} members).` });
        }
      } else if (!lookingForTeammates && min > 1) {
        return res.status(400).json({ message: `You must provide a Team Name to team up, or mark as looking for teammates.` });
      }
    }

    const reg = new EventRegistration({
      eventId: event._id,
      userId: req.user.id,
      status,
      teamName: req.body.teamName || null,
      lookingForTeammates,
      skills
    });
    
    await reg.save();
    
    if (req.io) {
      req.io.emit('event_updated', { eventId: event._id });
    }
    
    notifyDashboardUpdate(req, req.user.id);
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
        const event = await Event.findById(req.params.id);
        
        await notificationService.createNotification({
          userId: nextWaitlisted.userId,
          type: 'waitlist_confirmed',
          relatedContentId: event._id,
          message: `Good news! A spot opened up for "${event.title}" and you are now officially registered.`
        });
      }
    }
    
    if (req.io) {
      req.io.emit('event_updated', { eventId: req.params.id });
    }
    
    notifyDashboardUpdate(req, req.user.id);
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

// GET /api/events/:id/feedback
router.get('/:id/feedback', async (req, res) => {
  try {
    const EventFeedback = require('../models/EventFeedback');
    const { page = 1, limit = 10 } = req.query;
    
    const feedback = await EventFeedback.find({ eventId: req.params.id })
      .populate('userId', 'username full_name avatar_url')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
      
    const count = await EventFeedback.countDocuments({ eventId: req.params.id });
    
    res.json({
      feedback,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/feedback
router.post('/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed events' });
    }
    
    const reg = await EventRegistration.findOne({ eventId: event._id, userId: req.user.id });
    if (!reg || reg.status !== 'registered') {
      return res.status(403).json({ message: 'Only registered attendees can leave feedback' });
    }
    
    const EventFeedback = require('../models/EventFeedback');
    const existing = await EventFeedback.findOne({ eventId: event._id, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ message: 'You have already submitted feedback for this event' });
    }
    
    const { rating, reviewText, wouldRecommend } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }
    
    const feedback = new EventFeedback({
      eventId: event._id,
      userId: req.user.id,
      rating,
      reviewText,
      wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true
    });
    
    await feedback.save();
    
    // Recalculate event ratings
    const allFeedback = await EventFeedback.find({ eventId: event._id });
    const avg = allFeedback.reduce((acc, curr) => acc + curr.rating, 0) / allFeedback.length;
    
    event.avgRating = avg;
    event.totalFeedbackCount = allFeedback.length;
    await event.save();
    
    res.status(201).json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/events/:id/feedback/:feedbackId
router.put('/:id/feedback/:feedbackId', authMiddleware, async (req, res) => {
  try {
    const EventFeedback = require('../models/EventFeedback');
    const feedback = await EventFeedback.findById(req.params.feedbackId);
    
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    if (feedback.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { rating, reviewText, wouldRecommend } = req.body;
    if (rating) feedback.rating = rating;
    if (reviewText !== undefined) feedback.reviewText = reviewText;
    if (wouldRecommend !== undefined) feedback.wouldRecommend = wouldRecommend;
    
    await feedback.save();
    
    // Recalculate event ratings
    const allFeedback = await EventFeedback.find({ eventId: req.params.id });
    const avg = allFeedback.reduce((acc, curr) => acc + curr.rating, 0) / allFeedback.length;
    
    const event = await Event.findById(req.params.id);
    event.avgRating = avg;
    await event.save();
    
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/events/:id/feedback/:feedbackId
router.delete('/:id/feedback/:feedbackId', authMiddleware, async (req, res) => {
  try {
    const EventFeedback = require('../models/EventFeedback');
    const feedback = await EventFeedback.findById(req.params.feedbackId);
    
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    
    const user = await User.findById(req.user.id);
    if (feedback.userId.toString() !== req.user.id && (!user || user.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await EventFeedback.findByIdAndDelete(req.params.feedbackId);
    
    // Recalculate event ratings
    const allFeedback = await EventFeedback.find({ eventId: req.params.id });
    const avg = allFeedback.length > 0 ? allFeedback.reduce((acc, curr) => acc + curr.rating, 0) / allFeedback.length : 0;
    
    const event = await Event.findById(req.params.id);
    event.avgRating = avg;
    event.totalFeedbackCount = allFeedback.length;
    await event.save();
    
    res.json({ message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id/teammates
router.get('/:id/teammates', authMiddleware, async (req, res) => {
  try {
    const teammates = await EventRegistration.find({ 
      eventId: req.params.id, 
      lookingForTeammates: true,
      userId: { $ne: req.user.id } // exclude self
    }).populate('userId', 'username full_name avatar_url email');
    
    // Get incoming and outgoing team requests for the current user
    const TeamRequest = require('../models/TeamRequest');
    const incomingRequests = await TeamRequest.find({ eventId: req.params.id, toUserId: req.user.id, status: 'pending' }).populate('fromUserId', 'username full_name avatar_url');
    const outgoingRequests = await TeamRequest.find({ eventId: req.params.id, fromUserId: req.user.id, status: 'pending' });

    res.json({ teammates, incomingRequests, outgoingRequests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/team-request
router.post('/:id/team-request', authMiddleware, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'Target user ID is required' });

    const TeamRequest = require('../models/TeamRequest');
    
    const existing = await TeamRequest.findOne({ eventId: req.params.id, fromUserId: req.user.id, toUserId });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const reqDoc = new TeamRequest({
      eventId: req.params.id,
      fromUserId: req.user.id,
      toUserId
    });
    await reqDoc.save();

    const event = await Event.findById(req.params.id);
    await notificationService.createNotification({
      userId: toUserId,
      type: 'team_request',
      relatedContentId: event._id,
      message: `Someone wants to team up with you for ${event.title}!`
    });

    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/team-requests/:reqId/accept
router.post('/:id/team-requests/:reqId/accept', authMiddleware, async (req, res) => {
  try {
    const TeamRequest = require('../models/TeamRequest');
    const teamReq = await TeamRequest.findById(req.params.reqId).populate('fromUserId');
    if (!teamReq) return res.status(404).json({ message: 'Request not found' });
    
    if (teamReq.toUserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }

    teamReq.status = 'accepted';
    await teamReq.save();

    // Update registrations
    const myReg = await EventRegistration.findOne({ eventId: req.params.id, userId: req.user.id });
    const theirReg = await EventRegistration.findOne({ eventId: req.params.id, userId: teamReq.fromUserId._id });
    
    if (myReg && theirReg) {
      // Ensure there is a team name
      if (!myReg.teamName && !theirReg.teamName) {
        myReg.teamName = 'Team ' + myReg._id.toString().slice(-6).toUpperCase();
      } else if (!myReg.teamName) {
        myReg.teamName = theirReg.teamName;
      }
      
      myReg.lookingForTeammates = false;
      await myReg.save();

      // Update their reg
      theirReg.lookingForTeammates = false;
      theirReg.teamName = myReg.teamName;
      await theirReg.save();
    }

    const event = await Event.findById(req.params.id);
    await notificationService.createNotification({
      userId: teamReq.fromUserId._id,
      type: 'team_request_accepted',
      relatedContentId: event._id,
      message: `Your team request for ${event.title} was accepted!`
    });

    res.json({ message: 'Request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/events/:id/checkin
router.post('/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    if (event.hostedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the host can check in attendees' });
    }

    const { registrationId } = req.body;
    if (!registrationId) return res.status(400).json({ message: 'Registration ID required' });

    const reg = await EventRegistration.findById(registrationId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    if (reg.eventId.toString() !== req.params.id) return res.status(400).json({ message: 'Registration does not belong to this event' });

    reg.checkedIn = true;
    reg.checkedInAt = new Date();
    await reg.save();

    res.json({ message: 'Attendee checked in', registration: reg });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/events/:id/teammates
router.get('/:id/teammates', authMiddleware, async (req, res) => {
  try {
    const EventRegistration = require('../models/EventRegistration');
    const TeamRequest = require('../models/TeamRequest');

    const teammates = await EventRegistration.find({ 
      eventId: req.params.id, 
      status: 'registered',
      lookingForTeammates: true,
      userId: { $ne: req.user.id }
    }).populate('userId', 'username full_name avatar_url');

    const incomingRequests = await TeamRequest.find({
      eventId: req.params.id,
      toUserId: req.user.id,
      status: 'pending'
    }).populate('fromUserId', 'username full_name avatar_url');

    const outgoingRequests = await TeamRequest.find({
      eventId: req.params.id,
      fromUserId: req.user.id,
      status: 'pending'
    });
    
    res.json({ teammates, incomingRequests, outgoingRequests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/events/:id/team-request
router.post('/:id/team-request', authMiddleware, async (req, res) => {
  try {
    const { toUserId } = req.body;
    const event = await Event.findById(req.params.id);
    const TeamRequest = require('../models/TeamRequest');
    
    if (!event) return res.status(404).json({ message: 'Event not found' });
    
    const existingReq = await TeamRequest.findOne({
      eventId: event._id,
      fromUserId: req.user.id,
      toUserId
    });

    if (existingReq) return res.status(400).json({ message: 'Request already sent' });

    const newReq = new TeamRequest({
      eventId: event._id,
      fromUserId: req.user.id,
      toUserId
    });
    await newReq.save();

    const sender = await User.findById(req.user.id);
    
    await notificationService.createNotification({
      userId: toUserId,
      type: 'team_invite',
      relatedContentId: event._id,
      message: `${sender?.full_name || sender?.username} sent you a request to join their team for "${event.title}".`
    });
    
    res.json({ message: 'Team request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/events/:id/team-requests/:reqId/accept
router.post('/:id/team-requests/:reqId/accept', authMiddleware, async (req, res) => {
  try {
    const TeamRequest = require('../models/TeamRequest');
    const EventRegistration = require('../models/EventRegistration');
    
    const teamReq = await TeamRequest.findById(req.params.reqId).populate('fromUserId');
    if (!teamReq) return res.status(404).json({ message: 'Request not found' });
    if (teamReq.toUserId.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    teamReq.status = 'accepted';
    await teamReq.save();

    // Group them up by giving them a teamName
    const teamName = `Team ${teamReq.fromUserId.full_name || teamReq.fromUserId.username}`;

    await EventRegistration.updateMany(
      { eventId: req.params.id, userId: { $in: [teamReq.fromUserId._id, teamReq.toUserId] } },
      { $set: { teamName, lookingForTeammates: false } }
    );

    const event = await Event.findById(req.params.id);
    const acceptor = await User.findById(req.user.id);

    await notificationService.createNotification({
      userId: teamReq.fromUserId._id,
      type: 'team_accept',
      relatedContentId: event._id,
      message: `${acceptor?.full_name || acceptor?.username} accepted your team request for "${event.title}".`
    });

    res.json({ message: 'Team request accepted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
