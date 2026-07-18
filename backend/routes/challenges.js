const express = require('express');
const router = express.Router();
const QuizChallenge = require('../models/QuizChallenge');
const Connection = require('../models/Connection');
const notificationService = require('../services/notificationService');
const QuizAttempt = require('../models/QuizAttempt');
const User = require('../models/User');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const challengeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { error: 'Too many challenges created, please try again later' }
});

// Create a connection (friend request)
router.post('/connections', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.banned) return res.status(403).json({ error: 'Cannot connect with a banned user' });

    // Check existing
    const existing = await Connection.findOne({
      $or: [
        { userA: req.user.id, userB: targetUserId },
        { userA: targetUserId, userB: req.user.id }
      ]
    });
    
    if (existing) return res.status(400).json({ error: 'Connection exists' });

    const conn = new Connection({ userA: req.user.id, userB: targetUserId });
    await conn.save();
    
    await notificationService.createNotification({
      userId: targetUserId,
      type: 'new_connection_request',
      title: 'New Connection Request',
      message: 'You have a new connection request.',
      channel: 'both'
    }, req.io);
    
    res.json(conn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get my connections
router.get('/connections', auth, async (req, res) => {
  try {
    const conns = await Connection.find({
      $or: [{ userA: req.user.id }, { userB: req.user.id }]
    }).populate('userA userB', 'full_name avatar_url headline');
    res.json(conns);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accept connection
router.put('/connections/:id/accept', auth, async (req, res) => {
  try {
    const conn = await Connection.findOne({ _id: req.params.id, userB: req.user.id });
    if (!conn) return res.status(404).json({ error: 'Not found' });
    conn.status = 'accepted';
    await conn.save();
    res.json(conn);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Issue a challenge
router.post('/', auth, challengeLimiter, async (req, res) => {
  try {
    const { challengedId, quizId } = req.body;
    
    const targetUser = await User.findById(challengedId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.banned) return res.status(403).json({ error: 'Cannot challenge a banned user' });

    // Must be connections
    const conn = await Connection.findOne({
      status: 'accepted',
      $or: [
        { userA: req.user.id, userB: challengedId },
        { userA: challengedId, userB: req.user.id }
      ]
    });
    
    if (!conn) return res.status(400).json({ error: 'Must be friends to challenge' });

    const challenge = new QuizChallenge({
      challengerId: req.user.id,
      challengedId,
      quizId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await challenge.save();

    await notificationService.createNotification({
      userId: challengedId,
      type: 'quiz_challenge_received',
      title: 'New Quiz Challenge!',
      message: 'You have been challenged to a quiz.',
      channel: 'both',
      emailData: { challengerName: req.user.username },
      actionUrl: `/quiz-challenges/${challenge._id}`
    }, req.io);

    res.json(challenge);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get my challenges
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await QuizChallenge.find({
      $or: [{ challengerId: req.user.id }, { challengedId: req.user.id }]
    }).populate('challengerId challengedId', 'full_name avatar_url')
      .populate('quizId', 'title category')
      .populate('challengerAttemptId challengedAttemptId');
    res.json(challenges);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accept/Decline challenge
router.put('/:id/status', auth, async (req, res) => {
  try {
    const challenge = await QuizChallenge.findOne({ _id: req.params.id, challengedId: req.user.id });
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    challenge.status = req.body.status;
    await challenge.save();
    res.json(challenge);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Compare results (Head to Head)
router.get('/:id/results', auth, async (req, res) => {
  try {
    const challenge = await QuizChallenge.findById(req.params.id)
      .populate('challengerAttemptId challengedAttemptId');
      
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    
    // Check if both completed
    let winner = 'pending';
    if (challenge.challengerAttemptId?.status === 'completed' && challenge.challengedAttemptId?.status === 'completed') {
      const p1 = challenge.challengerAttemptId.score;
      const p2 = challenge.challengedAttemptId.score;
      if (p1 > p2) winner = 'challenger';
      else if (p2 > p1) winner = 'challenged';
      else winner = 'tie';
      
      if (challenge.status !== 'completed') {
        challenge.status = 'completed';
        await challenge.save();
      }
    }
    
    res.json({ challenge, winner });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
