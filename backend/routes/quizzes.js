const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/auth');

// Get all public quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ is_public: true }).sort({ created_at: -1 });
    // Exclude the nested questions array from the listing for performance
    const sanitized = quizzes.map(q => {
      const qObj = q.toObject();
      delete qObj.questions;
      return qObj;
    });
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new quiz
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, category, difficulty, duration_minutes, questions } = req.body;
    
    const quiz = new Quiz({
      user_id: req.user.id,
      title,
      description,
      category,
      difficulty: difficulty || 'intermediate',
      duration_minutes: duration_minutes || 10,
      questions: questions || []
    });
    
    const savedQuiz = await quiz.save();
    
    // Broadcast for live sync
    if (req.io) {
      req.io.emit('quizzes-public', { action: 'create', data: savedQuiz });
    }
    
    res.status(201).json(savedQuiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get quiz questions
router.get('/:id/questions', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
    // Sort questions by position
    const questions = quiz.questions.sort((a, b) => a.position - b.position);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Record a quiz attempt
router.post('/:id/attempts', authMiddleware, async (req, res) => {
  try {
    const { score, total, time_seconds, answers } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
    quiz.attempts.push({
      user_id: req.user.id,
      score,
      total,
      time_taken_seconds: time_seconds,
      answers: answers || []
    });
    
    quiz.attempts_count += 1;
    
    await quiz.save();
    
    res.status(201).json({ message: 'Attempt recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
