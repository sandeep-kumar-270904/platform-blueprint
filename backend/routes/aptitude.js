const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AptitudeQuestion = require('../models/AptitudeQuestion');
const UserQuestionAttempt = require('../models/UserQuestionAttempt');
const AptitudeTestDefinition = require('../models/AptitudeTestDefinition');
const AptitudeTestAttempt = require('../models/AptitudeTestAttempt');

// GET /api/aptitude/topics
// Aggregate topics and calculate accuracy from UserQuestionAttempts
router.get('/topics', authMiddleware, async (req, res) => {
  try {
    const questions = await AptitudeQuestion.aggregate([
      {
        $group: {
          _id: { category: '$category', topic: '$topic' },
          totalQuestions: { $sum: 1 }
        }
      }
    ]);

    // Fetch user attempts to calculate accuracy
    const attempts = await UserQuestionAttempt.aggregate([
      { $match: { user: req.user._id || req.user.id } },
      {
        $lookup: {
          from: 'aptitudequestions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionDetails'
        }
      },
      { $unwind: '$questionDetails' },
      {
        $group: {
          _id: { category: '$questionDetails.category', topic: '$questionDetails.topic' },
          totalAttempted: { $sum: 1 },
          correctCount: { $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] } }
        }
      }
    ]);

    const attemptsMap = {};
    attempts.forEach(a => {
      attemptsMap[`${a._id.category}-${a._id.topic}`] = a;
    });

    const topicsByCategory = {
      Quantitative: [],
      Logical: [],
      Verbal: []
    };

    questions.forEach(q => {
      const category = q._id.category;
      const topic = q._id.topic;
      
      const stats = attemptsMap[`${category}-${topic}`] || { totalAttempted: 0, correctCount: 0 };
      
      topicsByCategory[category].push({
        topic,
        totalQuestions: q.totalQuestions,
        attempted: stats.totalAttempted, // note: this is total attempts, could be > totalQuestions if re-attempted
        correct: stats.correctCount,
        accuracy: stats.totalAttempted > 0 ? Math.round((stats.correctCount / stats.totalAttempted) * 100) : 0
      });
    });

    res.json(topicsByCategory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/aptitude/practice
router.get('/practice', authMiddleware, async (req, res) => {
  try {
    const { category, topic, difficulty, unattempted } = req.query;
    
    let query = {};
    if (category) query.category = category;
    if (topic) query.topic = topic;
    if (difficulty) query.difficulty = difficulty;

    if (unattempted === 'true') {
      const attempts = await UserQuestionAttempt.find({ user: req.user.id }).select('question');
      if (attempts.length > 0) {
        const attemptedIds = attempts.map(a => a.question);
        query._id = { $nin: attemptedIds };
      }
    }

    const questions = await AptitudeQuestion.find(query).limit(20);
    
    const sanitizedQuestions = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty
    }));

    res.json(sanitizedQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/aptitude/practice/submit
router.post('/practice/submit', authMiddleware, async (req, res) => {
  try {
    const { questionId, selectedAnswer } = req.body;
    
    const question = await AptitudeQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const isCorrect = question.correctAnswer === selectedAnswer;

    // Record attempt independently
    const attempt = new UserQuestionAttempt({
      user: req.user.id,
      question: questionId,
      selectedAnswer,
      isCorrect
    });
    await attempt.save();

    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/aptitude/test/definitions
router.get('/test/definitions', authMiddleware, async (req, res) => {
  try {
    const definitions = await AptitudeTestDefinition.find();
    res.json(definitions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/aptitude/test/start
router.post('/test/start', authMiddleware, async (req, res) => {
  try {
    const { definitionId } = req.body;
    const def = await AptitudeTestDefinition.findById(definitionId);
    if (!def) return res.status(404).json({ message: 'Test Definition not found' });

    // Check for In Progress test
    let attempt = await AptitudeTestAttempt.findOne({ 
      user: req.user.id, 
      testDefinition: definitionId,
      status: 'In Progress'
    }).populate('responses.question');

    if (attempt) {
      if (new Date() > attempt.expiresAt) {
        attempt.status = 'Abandoned';
        await attempt.save();
        attempt = null; // Create a new one
      } else {
        // Resume test, sanitize questions before sending
        const sanitizedResponses = attempt.responses.map(r => ({
          _id: r.question._id,
          question: r.question.question,
          options: r.question.options,
          category: r.question.category,
          topic: r.question.topic,
          selectedAnswer: r.selectedAnswer
        }));
        
        return res.json({
          attemptId: attempt._id,
          expiresAt: attempt.expiresAt,
          allowBackwardNavigation: def.allowBackwardNavigation,
          responses: sanitizedResponses
        });
      }
    }

    // Generate new test based on rules
    let selectedQuestions = [];
    for (const rule of def.rules) {
      const match = { category: rule.category };
      if (rule.topic) match.topic = rule.topic;
      
      const q = await AptitudeQuestion.aggregate([
        { $match: match },
        { $sample: { size: rule.count } }
      ]);
      selectedQuestions.push(...q);
    }
    
    // Shuffle
    selectedQuestions = selectedQuestions.sort(() => Math.random() - 0.5);

    const responses = selectedQuestions.map(q => ({
      question: q._id,
      selectedAnswer: null,
      isCorrect: false,
      snapshotCorrectAnswer: q.correctAnswer
    }));

    const expiresAt = new Date(Date.now() + def.timeLimitMinutes * 60000);

    const newAttempt = new AptitudeTestAttempt({
      user: req.user.id,
      testDefinition: definitionId,
      expiresAt,
      responses
    });

    await newAttempt.save();

    await newAttempt.populate('responses.question');
    
    const sanitizedResponses = newAttempt.responses.map(r => ({
      _id: r.question._id,
      question: r.question.question,
      options: r.question.options,
      category: r.question.category,
      topic: r.question.topic,
      selectedAnswer: null
    }));

    res.json({
      attemptId: newAttempt._id,
      expiresAt: newAttempt.expiresAt,
      allowBackwardNavigation: def.allowBackwardNavigation,
      responses: sanitizedResponses
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/aptitude/test/answer
router.post('/test/answer', authMiddleware, async (req, res) => {
  try {
    const { attemptId, questionId, selectedAnswer } = req.body;
    
    const attempt = await AptitudeTestAttempt.findById(attemptId).populate('testDefinition');
    if (!attempt || attempt.user.toString() !== (req.user.id || req.user._id).toString()) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (attempt.status !== 'In Progress') {
      return res.status(400).json({ message: 'Test is no longer in progress' });
    }

    if (new Date() > attempt.expiresAt) {
      // Should auto submit but we'll reject this answer
      return res.status(400).json({ message: 'Time expired' });
    }

    const responseIndex = attempt.responses.findIndex(r => r.question.toString() === questionId);
    if (responseIndex === -1) {
      return res.status(404).json({ message: 'Question not found in test' });
    }

    // Enforce strict navigation
    if (!attempt.testDefinition.allowBackwardNavigation) {
      if (attempt.responses[responseIndex].selectedAnswer !== null) {
        return res.status(400).json({ message: 'Backward navigation / changing answers is disabled for this test' });
      }
    }

    // Save answer
    const q = await AptitudeQuestion.findById(questionId);
    attempt.responses[responseIndex].selectedAnswer = selectedAnswer;
    attempt.responses[responseIndex].isCorrect = (q.correctAnswer === selectedAnswer);
    attempt.responses[responseIndex].snapshotCorrectAnswer = q.correctAnswer;
    
    await attempt.save();
    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST /api/aptitude/test/submit
router.post('/test/submit', authMiddleware, async (req, res) => {
  try {
    const { attemptId } = req.body;
    
    const attempt = await AptitudeTestAttempt.findById(attemptId).populate('responses.question');
    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    
    if (attempt.status === 'Completed') return res.json({ resultId: attempt._id }); // Idempotent

    attempt.endTime = new Date();
    attempt.status = 'Completed';

    let qScore = 0, lScore = 0, vScore = 0;
    let qMax = 0, lMax = 0, vMax = 0;
    
    for (const r of attempt.responses) {
      const q = r.question; // Populated
      if (q.category === 'Quantitative') { qMax++; if(r.isCorrect) qScore++; }
      if (q.category === 'Logical') { lMax++; if(r.isCorrect) lScore++; }
      if (q.category === 'Verbal') { vMax++; if(r.isCorrect) vScore++; }
      
      // Also log these attempts independently for global stats
      if (r.selectedAnswer !== null) {
        const ua = new UserQuestionAttempt({
          user: attempt.user,
          question: q._id,
          selectedAnswer: r.selectedAnswer,
          isCorrect: r.isCorrect,
          testAttempt: attempt._id
        });
        await ua.save();
      }
    }
    
    attempt.overallScore = qScore + lScore + vScore;
    attempt.maxScore = qMax + lMax + vMax;
    attempt.sectionScores = {
      quantitative: { score: qScore, max: qMax },
      logical: { score: lScore, max: lMax },
      verbal: { score: vScore, max: vMax }
    };

    // Calculate Percentile
    const allCompleted = await AptitudeTestAttempt.find({ 
      testDefinition: attempt.testDefinition, 
      status: 'Completed' 
    }).select('overallScore');

    if (allCompleted.length > 5) { // Need at least 5 to show percentile
      const belowOrEqual = allCompleted.filter(a => a.overallScore <= attempt.overallScore).length;
      attempt.percentile = Math.round((belowOrEqual / allCompleted.length) * 100);
    }

    await attempt.save();
    res.json({ resultId: attempt._id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/aptitude/test/results/:id
router.get('/test/results/:id', authMiddleware, async (req, res) => {
  try {
    const result = await AptitudeTestAttempt.findOne({ _id: req.params.id, user: req.user.id })
      .populate('responses.question')
      .populate('testDefinition');
      
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.status !== 'Completed') return res.status(400).json({ message: 'Test not completed yet' });
    
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
