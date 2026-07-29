const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const GDLiveSession = require('../models/GDLiveSession');
const GDPeerFeedback = require('../models/GDPeerFeedback');
const StudyGroup = require('../models/StudyGroup');

// Helper function to verify user is active group member
const isGroupMember = (group, userId) => {
  return group.memberships.some(m => m.user.toString() === userId.toString() && m.status === 'active');
};

// @route   POST /api/gd-live/group/:groupId/session
// @desc    Create a Live GD Practice Session
// @access  Private
router.post('/group/:groupId/session', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Study Group not found' });
    
    if (!isGroupMember(group, req.user.id)) {
      return res.status(403).json({ message: 'Only active members can schedule GD sessions' });
    }
    
    const { topicTitle, scheduledTime, meetingLink, mode, quizId } = req.body;
    
    const session = new GDLiveSession({
      studyGroup: group._id,
      creator: req.user.id,
      mode: mode || 'discussion',
      quizId,
      topicTitle,
      scheduledTime,
      meetingLink,
      rsvps: [{ user: req.user.id, status: 'Attending' }] // Creator auto-attends
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gd-live/group/:groupId/sessions
// @desc    Get live sessions for a group (handles lazy auto-cancel)
// @access  Private
router.get('/group/:groupId/sessions', authMiddleware, async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: 'Study Group not found' });
    
    if (!isGroupMember(group, req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const sessions = await GDLiveSession.find({ studyGroup: group._id })
      .populate('creator', 'name avatar')
      .populate('rsvps.user', 'name avatar')
      .sort({ scheduledTime: -1 });
      
    // Lazy Evaluation: Auto-cancel sessions past grace period with < 2 attendees
    let stateChanged = false;
    const now = new Date();
    
    for (const session of sessions) {
      if (session.status === 'Scheduled') {
        const graceEnd = new Date(session.scheduledTime.getTime() + 30 * 60000); // +30 mins
        if (now > graceEnd) {
          const attendingCount = session.rsvps.filter(r => r.status === 'Attending').length;
          if (attendingCount < 2) {
            session.status = 'Cancelled';
          } else {
            session.status = 'Completed'; // Assumed completed if enough people attended and time passed
          }
          await session.save();
          stateChanged = true;
        }
      }
    }
    
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/gd-live/session/:id/rsvp
// @desc    RSVP to a session
// @access  Private
router.post('/session/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const session = await GDLiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    if (session.status !== 'Scheduled') {
      return res.status(400).json({ message: 'Session is no longer open for RSVP' });
    }
    
    const group = await StudyGroup.findById(session.studyGroup);
    if (!isGroupMember(group, req.user.id)) {
      return res.status(403).json({ message: 'You must be an active group member to RSVP' });
    }
    
    const { status } = req.body; // 'Attending' or 'Not Attending'
    
    const rsvpIndex = session.rsvps.findIndex(r => r.user.toString() === req.user.id);
    if (rsvpIndex > -1) {
      session.rsvps[rsvpIndex].status = status;
      session.rsvps[rsvpIndex].rsvpAt = new Date();
    } else {
      session.rsvps.push({ user: req.user.id, status });
    }
    
    await session.save();
    const notificationService = require('../services/notificationService');
    // Notify host or others that session is active
    if (session.host.toString() !== req.user.id) {
        await notificationService.sendNotification({
          userId: session.host,
          type: 'live_session_starting_soon',
          relatedContentId: session._id,
          actorId: req.user.id
        });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/gd-live/session/:id/feedback
// @desc    Submit peer feedback for a session
// @access  Private
router.post('/session/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const { revieweeId, strengths, improvements } = req.body;
    
    if (req.user.id === revieweeId) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }
    
    const session = await GDLiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    if (session.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot submit feedback for a cancelled session' });
    }
    
    if (session.status === 'Scheduled' && new Date() < session.scheduledTime) {
      return res.status(400).json({ message: 'Cannot submit feedback before the session occurs' });
    }
    
    // Ensure both users RSVP'd Attending
    const reviewerRsvp = session.rsvps.find(r => r.user.toString() === req.user.id && r.status === 'Attending');
    const revieweeRsvp = session.rsvps.find(r => r.user.toString() === revieweeId && r.status === 'Attending');
    
    if (!reviewerRsvp || !revieweeRsvp) {
      return res.status(403).json({ message: 'Both users must have attended the session to leave feedback' });
    }
    
    // Ensure both are still active group members
    const group = await StudyGroup.findById(session.studyGroup);
    if (!isGroupMember(group, req.user.id) || !isGroupMember(group, revieweeId)) {
      return res.status(403).json({ message: 'Feedback restricted to current active group members' });
    }
    
    // Check for duplicate feedback
    const existing = await GDPeerFeedback.findOne({
      session: session._id,
      reviewer: req.user.id,
      reviewee: revieweeId
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Feedback already submitted for this member in this session' });
    }
    
    const feedback = new GDPeerFeedback({
      session: session._id,
      reviewer: req.user.id,
      reviewee: revieweeId,
      strengths,
      improvements
    });
    
    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Feedback already submitted' });
    }
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/gd-live/session/:id/feedback
// @desc    Get feedback directed at the current user for a session
// @access  Private
router.get('/session/:id/feedback', authMiddleware, async (req, res) => {
  try {
    const feedback = await GDPeerFeedback.find({
      session: req.params.id,
      reviewee: req.user.id
    }).populate('reviewer', 'name avatar');
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
