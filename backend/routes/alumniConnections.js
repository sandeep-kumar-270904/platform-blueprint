const express = require('express');
const router = express.Router();
const ConnectionRequest = require('../models/ConnectionRequest');
const AlumniProfile = require('../models/AlumniProfile');
const Event = require('../models/Event');
const Mentorship = require('../models/Mentorship');
const rateLimit = require('express-rate-limit');
const CommunityPost = require('../models/CommunityPost');
const Job = require('../models/Job');
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');
const User = require('../models/User');
const College = require('../models/College');

const connectionRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each user to 5 connection requests per windowMs
  message: { message: 'Too many connection requests created from this IP, please try again after an hour' }
});

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

// POST /api/alumni/connections/request - Send connection request
router.post('/request', auth, connectionRequestLimiter, async (req, res) => {
  try {
    const isRateLimited = await checkRateLimit(req.user.id);
    if (isRateLimited) {
      return res.status(429).json({ message: 'Daily connection request limit reached. Please try again tomorrow.' });
    }

    const { alumniProfileId, type, intent, message, isAnonymous, requestedDate, requestedTime } = req.body;
    
    // Validate requestedDate is in the future
    if (requestedDate && new Date(requestedDate) <= new Date()) {
      return res.status(400).json({ message: 'Requested date must be in the future.' });
    }
    
    if (!alumniProfileId || !type || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
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

    if (type !== 'qa') {
      const result = await ConnectionRequest.findOneAndUpdate(
        {
          requesterId: req.user.id,
          alumniProfileId: profile._id,
          type,
          status: 'pending'
        },
        {
          $setOnInsert: {
            requesterId: req.user.id,
            alumniProfileId: profile._id,
            alumniUserId: profile.userId,
            type,
            intent,
            requestedDate,
            requestedTime,
            message,
            isAnonymous: false,
            status: 'pending'
          }
        },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true }
      );

      if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
        return res.status(400).json({ message: 'You already have a pending request of this type with this alumni.' });
      }

      const request = result.value;

      // Send notification to alum
      await notificationService.createNotification({
        userId: profile.userId,
        type: 'alumni_connection_request',
        relatedContentId: request._id,
        message: `You have a new ${type.replace('_', ' ')} request from a student.`,
        actionUrl: `/alumni/connections/inbox`,
        actors: [{ userId: req.user.id, name: req.user.full_name }],
        metadata: {
          purpose: intent || 'Connection',
          message: message
        }
      });

      return res.status(201).json(request);
    }

    const request = new ConnectionRequest({
      requesterId: req.user.id,
      alumniProfileId: profile._id,
      alumniUserId: profile.userId,
      type,
      intent,
      requestedDate,
      requestedTime,
      message,
      isAnonymous: true // Only qa gets here
    });

    await request.save();

    // Send notification to alum
    await notificationService.createNotification({
      userId: profile.userId,
      type: 'alumni_connection_request',
      relatedContentId: request._id,
      message: `You have a new ${type.replace('_', ' ')} request from a student.`,
      actionUrl: `/alumni/connections/inbox`,
      actors: [{ userId: req.user.id, name: isAnonymous ? 'A student' : req.user.full_name }],
      metadata: {
        purpose: intent || 'Connection',
        message: message
      }
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

// GET /api/alumni/connections/mentorships
router.get('/mentorships', auth, async (req, res) => {
  try {
    const mentorships = await Mentorship.find({
      $or: [{ menteeId: req.user.id }, { mentorId: req.user.id }]
    })
      .populate('menteeId', 'full_name avatar_url')
      .populate({
        path: 'alumniProfileId',
        populate: { path: 'userId', select: 'full_name avatar_url' }
      })
      .sort({ createdAt: -1 });
    res.json(mentorships);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/alumni/connections/mentorships/:id/goals
router.post('/mentorships/:id/goals', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findOne({
      _id: req.params.id,
      $or: [{ menteeId: req.user.id }, { mentorId: req.user.id }]
    });
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found or unauthorized' });

    const { title } = req.body;
    mentorship.goals.push({ title });
    await mentorship.save();

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/alumni/connections/mentorships/:id/goals/:goalId
router.put('/mentorships/:id/goals/:goalId', auth, async (req, res) => {
  try {
    const mentorship = await Mentorship.findOne({
      _id: req.params.id,
      $or: [{ menteeId: req.user.id }, { mentorId: req.user.id }]
    });
    if (!mentorship) return res.status(404).json({ message: 'Mentorship not found' });

    const goal = mentorship.goals.id(req.params.goalId);
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    if (req.body.status) {
      goal.status = req.body.status;
      if (req.body.status === 'completed') {
        goal.completedAt = new Date();
      }
    }

    await mentorship.save();
    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/alumni/connections/:id/respond
router.put('/:id/respond', auth, async (req, res) => {
  try {
    const { status, response } = req.body;
    
    const request = await ConnectionRequest.findOneAndUpdate(
      { _id: req.params.id, alumniUserId: req.user.id, status: 'pending' },
      { 
        $set: { 
          status, 
          ...(response && { response }) 
        } 
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found or already processed' });

    const profile = await AlumniProfile.findOne({ userId: req.user.id }).populate('collegeId');

    if (status === 'accepted' && request.type === 'session_1on1') {
      // Create Event
      let startD = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to next week
      let startTime = '10:00';
      let endTime = '11:00';

      if (request.requestedDate) {
        startD = new Date(request.requestedDate);
      }
      if (request.requestedTime) {
        startTime = request.requestedTime;
        // Simple 1 hour end time
        const [h, m] = startTime.split(':');
        endTime = `${(parseInt(h) + 1).toString().padStart(2, '0')}:${m}`;
      }
      
      const event = new Event({
        title: `1:1 Session with ${req.user.full_name || 'Alumni'}`,
        description: `Topic: ${request.message}`,
        eventType: 'seminar',
        startDate: startD,
        endDate: startD,
        startTime: startTime,
        endTime: endTime,
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

    // Phase 7: Create Mentorship if intent was Mentorship
    if (status === 'accepted' && request.intent === 'Mentorship') {
      const existingMentorship = await Mentorship.findOne({
        menteeId: request.requesterId,
        mentorId: req.user.id
      });
      if (!existingMentorship) {
        const mentorship = new Mentorship({
          menteeId: request.requesterId,
          mentorId: req.user.id,
          alumniProfileId: profile._id,
          status: 'active'
        });
        await mentorship.save();
      }
    }

    await request.save();

    // Notify requester
    await notificationService.createNotification({
      userId: request.requesterId,
      type: 'alumni_connection_response',
      relatedContentId: request._id,
      message: `Your ${request.type.replace('_', ' ')} request was ${status === 'completed' ? 'answered' : status}.`,
      actionUrl: `/alumni/connections`,
      actors: [{ userId: req.user.id, name: req.user.full_name }]
    });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/qa/:collegeId
router.get('/qa/:collegeId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const college = await College.findById(req.params.collegeId);
    
    let isAuthorized = false;
    if (user.role === 'admin') {
      isAuthorized = true;
    } else if (user.university && college && user.university.toLowerCase() === college.name.toLowerCase()) {
      isAuthorized = true;
    } else {
      const isAlum = await AlumniProfile.findOne({ userId: req.user.id, collegeId: req.params.collegeId });
      if (isAlum) isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to view Q&A for this college' });
    }

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
      if (obj.isAnonymous) {
        obj.requesterId = { _id: 'anonymous', full_name: 'Student' };
      }
      return obj;
    });

    res.json(safeQas);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/knowledge - Phase 10
router.get('/knowledge', auth, async (req, res) => {
  try {
    // Get all verified alumni users
    const alumniProfiles = await AlumniProfile.find({ verificationStatus: 'verified' }, 'userId');
    const alumniUserIds = alumniProfiles.map(p => p.userId);

    // Fetch CommunityPosts where author is an alumni and tag contains 'Alumni Knowledge'
    const posts = await CommunityPost.find({
      user_id: { $in: alumniUserIds },
      tags: { $in: ['Alumni Knowledge', 'alumni-knowledge'] }
    })
      .populate('user_id', 'full_name avatar_url')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/opportunities - Phase 12
router.get('/opportunities', auth, async (req, res) => {
  try {
    const alumniProfiles = await AlumniProfile.find({ verificationStatus: 'verified' }, 'userId');
    const alumniUserIds = alumniProfiles.map(p => p.userId);

    const jobs = await Job.find({
      postedBy: { $in: alumniUserIds },
      status: 'published'
    })
      .populate('postedBy', 'full_name avatar_url')
      .sort({ createdAt: -1 })
      .limit(50);

    // Map `postedBy` to include isAlumni
    const jobsWithAlumniFlag = jobs.map(j => ({
      ...j.toObject(),
      postedBy: { ...j.postedBy.toObject(), isAlumni: true }
    }));

    res.json(jobsWithAlumniFlag);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/alumni/connections/events - Phase 13
router.get('/events', auth, async (req, res) => {
  try {
    const alumniProfiles = await AlumniProfile.find({ verificationStatus: 'verified' }, 'userId');
    const alumniUserIds = alumniProfiles.map(p => p.userId);

    const events = await Event.find({
      hostedBy: { $in: alumniUserIds },
      status: 'approved'
    })
      .populate('hostedBy', 'full_name avatar_url')
      .sort({ startDate: 1 })
      .limit(50);

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
