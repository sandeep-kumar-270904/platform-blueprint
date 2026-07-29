
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizComment = require('../models/QuizComment');
const Quiz = require('../models/Quiz');

// Get comments for a quiz
router.get('/quiz/:quizId', authMiddleware, async (req, res) => {
  try {
    const comments = await QuizComment.find({ quiz: req.params.quizId })
        .populate('user', 'username avatar_url')
        .sort({ isPinned: -1, createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment
router.post('/quiz/:quizId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = new QuizComment({
       quiz: req.params.quizId,
       user: req.user.id,
       text
    });
    await comment.save();
    await comment.populate('user', 'username avatar_url');
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pin comment (creator only)
router.put('/:id/pin', authMiddleware, async (req, res) => {
  try {
    const comment = await QuizComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Not found' });
    
    const quiz = await Quiz.findById(comment.quiz);
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
       return res.status(403).json({ error: 'Not authorized' });
    }
    
    comment.isPinned = !comment.isPinned;
    await comment.save();
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
