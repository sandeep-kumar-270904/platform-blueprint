const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const AdminActionLog = require('../models/AdminActionLog');

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/quiz-review/pending
// Fetch AI generated quizzes sitting in under_review status
router.get('/pending', authMiddleware, isAdmin, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ 
      status: 'under_review',
      'questions.source': 'ai_generated' 
    }).populate('createdBy', 'full_name email').lean();
    
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending quiz reviews' });
  }
});

// POST /api/admin/quiz-review/:id/action
router.post('/:id/action', authMiddleware, isAdmin, async (req, res) => {
  const { action, note } = req.body; // action can be 'approve', 'reject'
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    if (action === 'approve') {
      quiz.status = 'published';
    } else if (action === 'reject') {
      quiz.status = 'draft';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await quiz.save();

    await AdminActionLog.create({
      adminId: req.adminUser._id,
      actionType: `quiz_ai_review_${action}`,
      targetId: quiz._id,
      reason: note || (action === 'approve' ? 'Approved AI generated quiz' : 'Rejected AI generated quiz')
    });

    res.json({ message: `Quiz ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
