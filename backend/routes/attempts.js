const express = require('express');
const router = express.Router();
const QuizAttempt = require('../models/QuizAttempt');
const { submitQuizAttempt } = require('../services/quizScoringService');
const authMiddleware = require('../middleware/auth');

// GET /api/attempts/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user.id })
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
router.post('/:attemptId/submit', authMiddleware, async (req, res) => {
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
    const completedAttempt = await submitQuizAttempt({ attemptId, submittedAnswers: answers || [], io: req.io });

    res.json(completedAttempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
