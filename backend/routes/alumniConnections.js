const express = require('express');
const router = express.Router();
const ConnectionRequest = require('../models/ConnectionRequest');
const AlumniProfile = require('../models/AlumniProfile');
const Event = require('../models/Event');
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');

// Helper to rate limit (basic implementation)
// 3 requests per day per user
const checkRateLimit = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const count = await ConnectionRequest.countDocuments({
    requesterId: userId,
    createdAt: { $gte: today }
  });
  return count >= 3;
};

// POST /api/alumni/connections/request
router.post('/request', auth, async (req, res) => {
  try {
    const { alumniProfileId, type, message, isAnonymous } = req.body;
    
    if (!alumniProfileId || !type || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (await checkRateLimit(req.user.id)) {
      return res.status(429).json({ message: 'Daily request limit reached (3/day).' });
    }

    const profile = await AlumniProfile.findById(alumniProfileId);
    if (!profile) return res.status(404).json({ message: 'Alumni profile not found' });

    // Validate willingness
    if (type === 'qa' && !profile.willingness.openToQa) {
      return res.status(403).json({ message: 'Alumni is not open to Q&A' });
    }
    if ((type === 'session_1on1' || type === 'relay') && !profile.willingness.openToMentoring) {
      return res.status(403).json({ message: 'Alumni is not open to mentoring/direct relays' });
    }

    const request = new ConnectionRequest({
      requesterId: req.user.id,
      alumniProfileId: profile._id,
      alumniUserId: profile.userId,
      type,
      message,
      isAnonymous: type === 'qa' ? isAnonymous : false
    });

    await request.save();

    // Send notification to alum
    await notificationService.createNotification({
      userId: profile.userId,
      type: 'alumni_connection_request',
      relatedContentId: request._id,
      message: `You have a new ${type.replace('_', ' ')} request from a student.`
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/me - Fetch my outgoing requests
router.get('/me', auth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({ requesterId: req.user.id })
      .populate('alumniUserId', 'full_name avatar_url')
      .populate('alumniProfileId', 'currentRole currentCompany collegeId visibility')
      .populate('generatedEventId')
      .sort({ createdAt: -1 });
      
    // Privacy sanitize: if visibility is private, hide name/avatar unless accepted?
    // According to plan, we don't expose raw contact info anyway.
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/inbox - Fetch my incoming requests
router.get('/inbox', auth, async (req, res) => {
  try {
    const requests = await ConnectionRequest.find({ alumniUserId: req.user.id })
      .populate('requesterId', 'full_name avatar_url')
      .populate('generatedEventId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/alumni/connections/:id/respond
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { status, response } = req.body;
    
    const request = await ConnectionRequest.findOne({ _id: req.params.id, alumniUserId: req.user.id });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    if (response) {
      request.response = response;
    }

    if (status === 'accepted' && request.type === 'session_1on1') {
      // Create Event
      const profile = await AlumniProfile.findOne({ userId: req.user.id }).populate('collegeId');
      
      const event = new Event({
        title: `1:1 Session with Alumni`,
        description: `Topic: ${request.message}`,
        eventType: 'seminar',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to next week
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        startTime: '10:00',
        endTime: '11:00',
        isVirtual: true,
        hostCollegeId: profile.collegeId?._id,
        hostedBy: req.user.id,
        hostName: req.user.full_name || 'Alumni',
        status: 'approved',
        capacity: 2
      });
      await event.save();
      
      request.generatedEventId = event._id;
    }
    
    // Auto complete QA/Relay if they answered
    if (status === 'accepted' && (request.type === 'qa' || request.type === 'relay') && response) {
      request.status = 'completed';
    }

    await request.save();

    // Notify requester
    await notificationService.createNotification({
      userId: request.requesterId,
      type: 'alumni_connection_response',
      relatedContentId: request._id,
      message: `Your ${request.type.replace('_', ' ')} request was ${status === 'completed' ? 'answered' : status}.`
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/qa/:collegeId
router.get('/qa/:collegeId', async (req, res) => {
  try {
    const profiles = await AlumniProfile.find({ collegeId: req.params.collegeId }).select('_id');
    const profileIds = profiles.map(p => p._id);

    const qas = await ConnectionRequest.find({
      alumniProfileId: { $in: profileIds },
      type: 'qa',
      status: 'completed'
    })
    .populate('requesterId', 'full_name') // Filter out if anonymous later in map
    .populate('alumniUserId', 'full_name avatar_url')
    .sort({ updatedAt: -1 })
    .limit(50);

    const safeQas = qas.map(qa => {
      const obj = qa.toObject();
      if (obj.isAnonymous && obj.requesterId) {
        obj.requesterId.full_name = 'Student';
      }
      return obj;
    });

    res.json(safeQas);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
