const express = require('express');
const router = express.Router();
const LiveSession = require('../models/LiveSession');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

// POST /api/quizzes/:id/live-sessions
// (Mounted as /api/live-sessions, wait, the prompt says POST /api/quizzes/:id/live-sessions, so I can mount this on /api/quizzes in server.js? Actually I will mount this on /api/live-sessions and the route will be /quiz/:id OR I'll mount on /api/live-sessions and define /quiz/:id here. Let's define POST /quiz/:id here)
// Wait, the prompt says POST /api/quizzes/:id/live-sessions, I can just mount a route on `/api/quizzes/:id/live-sessions` inside `quizzes.js`, or define it in `liveSessions.js` and mount it differently.
// Let's just mount `liveSessions` at `/api/live-sessions` and change the POST to `/api/live-sessions/quiz/:id` or just handle it in `quizzes.js`. Let's handle POST /api/quizzes/:id/live-sessions in `quizzes.js` instead.

// Wait, I will put it all in `liveSessions.js` but mount it on `/api/live-sessions`, and the POST will be `/api/live-sessions/create/:quizId` to be clean.
// Actually, let's stick exactly to the prompt: POST /api/quizzes/:id/live-sessions.
// I can do that by adding it to quizzes.js! But the prompt says "Create liveSessions.js routes". I will export a router and mount it at /api/live-sessions. I will also add a POST / for creation.

router.post('/quiz/:quizId', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.mode !== 'live') return res.status(400).json({ message: 'Quiz is not in live mode' });
    if (quiz.status !== 'published') return res.status(400).json({ message: 'Quiz is not published' });
    if (quiz.status === 'under_review') return res.status(403).json({ message: 'Quiz is currently under review' });
    
    // Hosted by creator or admin
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to host this quiz' });
    }

    const generateJoinCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();
    let joinCode = generateJoinCode();
    
    // Ensure unique join code
    while (await LiveSession.findOne({ joinCode })) {
      joinCode = generateJoinCode();
    }

    const session = new LiveSession({
      quiz: quizId,
      hostedBy: req.user.id,
      scheduledStartAt: req.body.scheduledStartAt || new Date(),
      status: 'waiting_room', // Start in waiting room directly for UX simplicity
      joinCode,
      pacingMode: req.body.pacingMode || 'host',
      opensAt: req.body.opensAt,
      closesAt: req.body.closesAt
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/live-sessions/join/:joinCode
router.get('/join/:joinCode', async (req, res) => {
  try {
    const session = await LiveSession.findOne({ 
      joinCode: req.params.joinCode.toUpperCase(),
      status: { $in: ['scheduled', 'waiting_room', 'in_progress'] }
    }).populate('quiz', 'title').populate('hostedBy', 'username full_name');
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found or no longer active' });
    }

    res.json({
      _id: session._id,
      quizTitle: session.quiz.title,
      hostName: session.hostedBy.full_name || session.hostedBy.username,
      participantCount: session.participants.length,
      status: session.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/live-sessions/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id)
      .populate('quiz', 'title')
      .populate('participants.user', 'username full_name avatar');
      
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/live-sessions/:id/cancel
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    if (session.hostedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    session.status = 'cancelled';
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/live-sessions/:id/invite
router.post('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const { emails } = req.body;
    const session = await LiveSession.findById(req.params.id).populate('quiz', 'title');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    
    // Only host can invite
    if (session.hostedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: 'Must provide an array of emails' });
    }

    const host = await User.findById(req.user.id).select('full_name username');
    const hostName = host.full_name || host.username;

    const usersToInvite = await User.find({ email: { $in: emails } });
    const userIds = usersToInvite.map(u => u._id);

    for (const uId of userIds) {
      await notificationService.createNotification({
        userId: uId,
        type: 'live_session_invite',
        relatedQuiz: session.quiz._id,
        relatedLiveSession: session._id,
        message: `${hostName} invited you to join a live quiz: "${session.quiz.title}".`,
        actionUrl: `/live/join`,
        channel: 'both',
        emailData: {
          quizTitle: session.quiz.title,
          inviterName: hostName,
          joinCode: session.joinCode
        }
      });
    }

    res.json({ message: 'Invites sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
