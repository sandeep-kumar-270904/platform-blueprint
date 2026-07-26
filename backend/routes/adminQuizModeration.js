const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizAttempt = require('../models/QuizAttempt');
const QuizDispute = require('../models/QuizDispute');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// GET flagged attempts
router.get('/flagged', authMiddleware, isAdmin, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ moderationStatus: 'flagged' })
      .populate('user', 'username email')
      .populate('quiz', 'title');
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear flag
router.post('/attempts/:id/clear', authMiddleware, isAdmin, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByIdAndUpdate(req.params.id, {
      moderationStatus: 'cleared',
      isSuspicious: false
    }, { new: true });
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban user
router.post('/attempts/:id/ban-user', authMiddleware, isAdmin, async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Not found' });
    
    await User.findByIdAndUpdate(attempt.user, { banned: true, banReason: 'Cheating detected in Quiz' });
    attempt.moderationStatus = 'cleared';
    await attempt.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET disputes
router.get('/disputes', authMiddleware, isAdmin, async (req, res) => {
  try {
    const disputes = await QuizDispute.find({ status: 'pending' })
      .populate('quiz', 'title')
      .populate('reportedBy', 'username');
    res.json(disputes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve dispute
router.post('/disputes/:id/resolve', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { action, newCorrectIndex } = req.body; // action: 'accept' or 'reject'
    const dispute = await QuizDispute.findById(req.params.id);
    
    if (!dispute) return res.status(404).json({ error: 'Not found' });

    dispute.status = 'resolved';
    dispute.adminResolution = action;
    await dispute.save();

    if (action === 'accept' && newCorrectIndex !== undefined) {
      // Update Quiz
      const quiz = await Quiz.findById(dispute.quiz);
      if (quiz && quiz.questions[dispute.questionIndex]) {
        quiz.questions[dispute.questionIndex].correctOptionIndex = newCorrectIndex;
        await quiz.save();
        
        // Recalculate all past attempts for this quiz
        const attempts = await QuizAttempt.find({ quiz: quiz._id, status: 'completed' });
        for (let att of attempts) {
           let newScore = 0;
           for (let i = 0; i < att.answers.length; i++) {
              if (att.answers[i].questionIndex === dispute.questionIndex) {
                 att.answers[i].isCorrect = (att.answers[i].selectedOptionIndex === newCorrectIndex);
              }
              if (att.answers[i].isCorrect) newScore += 1;
           }
           att.score = newScore;
           att.percentageScore = (newScore / att.totalPossibleScore) * 100;
           await att.save();
        }
      }
    }

    res.json(dispute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
