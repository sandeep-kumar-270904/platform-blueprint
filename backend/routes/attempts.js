const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const { submitQuizAttempt } = require('../services/quizScoringService');
const authMiddleware = require('../middleware/auth');
const { notifyDashboardUpdate } = require('../services/dashboardCache');

const rateLimit = require('express-rate-limit');
const attemptSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many submissions from this IP, please wait a minute.' }
});


// GET /api/attempts/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.quizId) {
      filter.quiz = req.query.quizId;
    }

    const attempts = await QuizAttempt.find(filter)
      .populate('quiz', 'title category difficulty mode status')
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/attempts/:attemptId
router.get('/:attemptId', authMiddleware, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate('quiz', '-attempts'); // populate quiz, keep answers if completed
    
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    
    if (attempt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow fetching answers and explanation if completed
    if (attempt.status !== 'completed') {
      return res.status(403).json({ message: 'Attempt is not completed yet' });
    }

    res.json(attempt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/attempts/:attemptId/submit
router.post('/:attemptId/submit', authMiddleware, attemptSubmissionLimiter, async (req, res) => {
  try {
    const { answers } = req.body;
    const attemptId = req.params.attemptId;

    // Verify ownership
    const attemptCheck = await QuizAttempt.findById(attemptId);
    if (!attemptCheck) return res.status(404).json({ message: 'Attempt not found' });
    
    if (attemptCheck.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Call service to score
    const timezone = req.headers['x-timezone'] || 'UTC';
    const result = await submitQuizAttempt({ attemptId, submittedAnswers: answers || [], io: req.io, timezone });

    // result now contains { attempt, gamificationResult }
    notifyDashboardUpdate(req, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


const auth = require('../middleware/auth');
router.get('/analytics/topics', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user.id, status: 'completed' }).populate('quiz');
    const topics = {};

    attempts.forEach(attempt => {
      const cat = attempt.quiz?.category || 'Uncategorized';
      if (!topics[cat]) topics[cat] = { correct: 0, total: 0 };
      
      topics[cat].total += attempt.totalPossibleScore;
      topics[cat].correct += attempt.score;
    });

    const result = Object.keys(topics).map(cat => ({
      category: cat,
      accuracy: topics[cat].total > 0 ? (topics[cat].correct / topics[cat].total) * 100 : 0,
      totalAttempts: attempts.filter(a => a.quiz?.category === cat).length
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Appeal a flagged attempt
router.post('/:id/appeal', auth, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findOne({ _id: req.params.id, user: req.user.id });
    if (!attempt) return res.status(404).json({ error: 'Not found' });
    if (attempt.moderationStatus !== 'flagged') return res.status(400).json({ error: 'Attempt is not flagged' });
    
    attempt.moderationStatus = 'appealed';
    await attempt.save();
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
