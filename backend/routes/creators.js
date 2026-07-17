const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const authMiddleware = require('../middleware/auth');

// GET /api/creators/quiz-analytics-overview
router.get('/quiz-analytics-overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const quizzes = await Quiz.find({ createdBy: userId });
    
    let totalQuizzes = quizzes.length;
    let totalAttempts = 0;
    let sumAverageScore = 0;
    
    let bestQuiz = null;
    let bestCompletionRate = -1;

    const quizList = [];

    for (const quiz of quizzes) {
      totalAttempts += (quiz.attemptCount || 0);
      sumAverageScore += (quiz.averageScore || 0);
      
      const completed = await QuizAttempt.countDocuments({ quiz: quiz._id, status: 'completed' });
      const total = await QuizAttempt.countDocuments({ quiz: quiz._id });
      const completionRate = total > 0 ? (completed / total) * 100 : 0;
      
      if (completionRate > bestCompletionRate && total > 0) {
        bestCompletionRate = completionRate;
        bestQuiz = {
          _id: quiz._id,
          title: quiz.title,
          completionRate
        };
      }
      
      quizList.push({
        _id: quiz._id,
        title: quiz.title,
        attemptCount: quiz.attemptCount,
        averageScore: quiz.averageScore,
        completionRate
      });
    }
    
    const overallAverageScore = totalQuizzes > 0 ? sumAverageScore / totalQuizzes : 0;

    res.json({
      totalQuizzes,
      totalAttempts,
      overallAverageScore,
      bestPerformingQuiz: bestQuiz,
      quizzes: quizList
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
