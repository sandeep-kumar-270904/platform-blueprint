const mongoose = require('mongoose');
const logger = require('../utils/logger');
const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const AIGenerationLog = require('../models/AIGenerationLog');
const QuizAttempt = require('../models/QuizAttempt');
const QuizReport = require('../models/QuizReport');
const User = require('../models/User');
const QuestionBank = require('../models/QuestionBank');
const Syllabus = require('../models/Syllabus');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { GoogleGenerativeAI } = require('@google/generative-ai');


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB for CSV
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV allowed.'));
    }
  }
});


const rateLimit = require('express-rate-limit');

// Rate Limiters
const quizCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many quizzes created from this IP, please try again after an hour.' }
});

const attemptSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many submissions from this IP, please wait a minute.' }
});

const reportSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many reports submitted from this IP, please try again after an hour.' }
});

const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // 20 requests per day per IP
  message: { message: 'Daily limit for AI generation reached. Please try again tomorrow.' }
});

// Quiz serializer for "taking" (strips correctOptionIndex and explanation)
const serializeQuizForTaking = (quiz) => {
  const qObj = quiz.toObject();
  if (qObj.mode === 'adaptive_practice') {
    // For adaptive practice, we need correctOptionIndex on the frontend to evaluate and pick next question
    return qObj;
  }
  qObj.questions = qObj.questions.map(q => {
    delete q.correctOptionIndex;
    delete q.explanation;
    return q;
  });
  return qObj;
};

const serializeAttemptForTaking = (attempt) => {
  if (!attempt) return attempt;
  // If attempt is a mongoose document, convert to object
  const aObj = typeof attempt.toObject === 'function' ? attempt.toObject() : { ...attempt };
  if (aObj.answers) {
    aObj.answers = aObj.answers.map(ans => {
      if (ans.questionSnapshot) {
        delete ans.questionSnapshot.correctIndex;
        delete ans.questionSnapshot.explanation;
      }
      return ans;
    });
  }
  return aObj;
};

// GET /api/quizzes
router.get('/', async (req, res) => {
  try {
    const { search, category, difficulty, mode, sort, page = 1, limit = 20 } = req.query;
    
    const query = {};
    
    // Only return published quizzes to non-owners unless auth logic is added per-user later
    // For now, public listing is 'published'
    query.status = 'published';

    if (search) {
      query.$text = { $search: search };
    }
    // Sanitize to prevent NoSQL injection (e.g. {"$ne": null})
    if (category) query.category = String(category);
    if (difficulty) query.difficulty = String(difficulty);
    if (mode) query.mode = String(mode);

    let sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { attemptCount: -1 };
    if (sort === 'highestRated') sortObj = { averageScore: -1 };
    if (search) sortObj = { score: { $meta: 'textScore' } };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quizzes = await Quiz.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-questions'); // Do not send questions in list

    const total = await Quiz.countDocuments(query);
    const totalUnfiltered = await Quiz.countDocuments({ status: 'published' });

    res.json({ quizzes, total, totalUnfiltered, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/quizzes/categories-summary
router.get('/categories-summary', async (req, res) => {
  try {
    const summary = await Quiz.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(summary.map(item => ({ category: item._id, count: item.count })));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/quizzes/trending
router.get('/trending', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 'published' })
      .sort({ attemptCount: -1 })
      .limit(5)
      .select('title category difficulty attemptCount');
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// GET /api/quizzes/import-template
router.get('/import-template', (req, res) => {
  const template = 'questionText,option1,option2,option3,option4,option5,option6,correctOptionNumber,explanation,points\n' +
    '"What is the capital of France?",Paris,London,Berlin,Madrid,,,1,"Paris is the capital of France.",1\n' +
    '"Which planet is known as the Red Planet?",Earth,Mars,Jupiter,Saturn,,,2,"Mars has an iron oxide surface making it red.",2\n';
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="quiz_import_template.csv"');
  res.send(template);
});

// GET /api/quizzes/:id
router.get('/:id', async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quiz = await Quiz.findById(req.params.id).select('-questions.correctOptionIndex -questions.explanation');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    
    // For detail page, we usually don't need questions array, but keeping it sanitized just in case
    // Wait, the prompt says: "NOT the actual questions/options yet; those are only fetched when starting an attempt"
    const qObj = quiz.toObject();
    delete qObj.questions;
    
    res.json(qObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/quizzes/:id/analytics
router.get('/:id/analytics', authMiddleware, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const totalAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id });
    const completedAttempts = await QuizAttempt.countDocuments({ quiz: quiz._id, status: 'completed' });
    
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    
    // Live vs Solo breakdown
    const liveCount = await QuizAttempt.countDocuments({ quiz: quiz._id, sourceLiveSession: { $exists: true, $ne: null } });
    const soloCount = totalAttempts - liveCount;

    // Score Distribution (Histogram buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
    // Limit analytics aggregations to the last 30 days to prevent unbounded scanning
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const distribution = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed', completedAt: { $gte: thirtyDaysAgo } } },
      { 
        $bucket: {
          groupBy: "$percentageScore",
          boundaries: [0, 20.0001, 40.0001, 60.0001, 80.0001, 100.0001],
          default: "other",
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    
    const scoreDistribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 }
    ];
    
    distribution.forEach(d => {
      if (d._id === 0) scoreDistribution[0].count = d.count;
      else if (d._id === 20.0001) scoreDistribution[1].count = d.count;
      else if (d._id === 40.0001) scoreDistribution[2].count = d.count;
      else if (d._id === 60.0001) scoreDistribution[3].count = d.count;
      else if (d._id === 80.0001) scoreDistribution[4].count = d.count;
    });

    // Question Difficulty Breakdown
    const correctAnswers = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed', completedAt: { $gte: thirtyDaysAgo } } },
      { $unwind: "$answers" },
      { $group: {
          _id: "$answers.questionIndex",
          totalAnswers: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
      }}
    ]);

    const questionDifficulty = correctAnswers.map(c => {
      const q = quiz.questions[c._id];
      return {
        questionIndex: c._id,
        questionText: q?.questionText,
        correctRate: c.totalAnswers > 0 ? (c.correctAnswers / c.totalAnswers) * 100 : 0,
        authorDifficulty: q?.authorDifficulty,
        calibratedDifficulty: q?.calibratedDifficulty
      };
    }).sort((a, b) => a.questionIndex - b.questionIndex);

    res.json({
      attemptCount: quiz.attemptCount,
      averageScore: quiz.averageScore,
      completionRate,
      breakdown: {
        liveCount,
        soloCount
      },
      scoreDistribution,
      questionDifficulty
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes
router.post('/', authMiddleware, quizCreationLimiter, async (req, res) => {
  try {
    if (req.user.banned || req.user.quizBanned) {
      return res.status(403).json({ message: 'You have been restricted from creating quizzes' });
    }

    const { title, description, category, mode, difficulty, durationMinutes, questions } = req.body;
    
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'Quiz must have at least 1 question' });
    }

    for (const q of questions) {
      if (!q.options || q.options.length < 2 || q.options.length > 6) {
        return res.status(400).json({ message: 'Each question must have 2-6 options' });
      }
      if (typeof q.correctOptionIndex !== 'number' || q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        return res.status(400).json({ message: 'Invalid correctOptionIndex' });
      }
    }

    const quiz = new Quiz({
      title,
      description,
      category,
      createdBy: req.user.id,
      mode: mode || 'solo',
      difficulty: difficulty || 'medium',
      durationMinutes,
      questions,
      syllabusId: req.body.syllabusId,
        isAIGenerated: req.body.isAIGenerated || questions.some(q => q.isAIGenerated),
      sections: req.body.sections
    });

    await quiz.save();
    
    let warning = null;
    if (req.body.syllabusId) {
      const syllabus = await Syllabus.findById(req.body.syllabusId);
      if (syllabus) {
        const counts = {};
        let qCount = 0;
        if (req.body.sections) {
          req.body.sections.forEach((s) => s.questions.forEach((q) => {
            if (q.topicName) counts[q.topicName] = (counts[q.topicName] || 0) + 1;
            qCount++;
          }));
        } else {
          questions.forEach((q) => {
            if (q.topicName) counts[q.topicName] = (counts[q.topicName] || 0) + 1;
            qCount++;
          });
        }
        
        syllabus.topics.forEach((t) => {
          const actual = qCount > 0 ? ((counts[t.name] || 0) / qCount) * 100 : 0;
          if (Math.abs(actual - t.weightPercentage) > 20) {
            warning = "Warning: Topic weights are significantly skewed compared to the syllabus.";
          }
        });
      }
    }

    res.status(201).json({ quiz, warning });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/quizzes/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(quiz, req.body);
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/quizzes/import-questions
router.post('/import-questions', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });
    } catch (err) {
      return res.status(400).json({ message: 'Invalid CSV format', error: err.message });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    const newQuestions = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 1-based, +1 for header
      
      try {
        const questionText = row.questionText;
        if (!questionText) throw new Error('questionText is required');

        const options = [];
        for (let i = 1; i <= 6; i++) {
          const opt = row[`option${i}`];
          if (opt && opt.trim() !== '') {
            options.push(opt.trim());
          }
        }

        if (options.length < 2 || options.length > 6) {
          throw new Error('Question must have between 2 and 6 options');
        }

        const correctNum = parseInt(row.correctOptionNumber);
        if (isNaN(correctNum) || correctNum < 1 || correctNum > options.length) {
          throw new Error(`correctOptionNumber must be between 1 and ${options.length}`);
        }

        const points = row.points ? parseInt(row.points) : 1;
        if (isNaN(points) || points < 1) {
          throw new Error('points must be a valid positive number');
        }

        newQuestions.push({
          questionText,
          options,
          correctOptionIndex: correctNum - 1,
          explanation: row.explanation || '',
          points
        });
        
        results.successful++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, error: err.message });
      }
    });

    res.json({
      message: `Import complete. ${results.successful} imported, ${results.failed} failed.`,
      results,
      questions: newQuestions
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/quizzes/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await quiz.deleteOne();
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/quizzes/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    quiz.status = status;
    await quiz.save();
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/quizzes/:id/leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

        // Top scores for this quiz, solo mode best percentageScore per user
    const attempts = await QuizAttempt.aggregate([
      { $match: { quiz: new mongoose.Types.ObjectId(req.params.id), status: 'completed' } },
      { $sort: { percentageScore: -1, completedAt: 1 } },
      { $group: {
          _id: '$user',
          bestScore: { $first: '$percentageScore' },
          startedAt: { $first: '$startedAt' },
          completedAt: { $first: '$completedAt' }
      }},
      { $sort: { bestScore: -1, completedAt: 1 } },
      { $limit: 100 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
      }},
      { $unwind: '$userInfo' },
      { $project: {
          _id: 1,
          bestScore: 1,
          durationMs: { $subtract: ['$completedAt', '$startedAt'] },
          'userInfo.full_name': 1,
          'userInfo.username': 1,
          'userInfo.avatar_url': 1
      }},
      { $sort: { bestScore: -1, durationMs: 1 } },
      { $limit: 10 }
    ]);
    
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes/:id/start
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    if (quiz.status === 'under_review') return res.status(403).json({ message: 'Quiz is currently under review and cannot be attempted' });

    // Check if user already has an in_progress attempt
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      user: req.user.id,
      status: 'in_progress'
    });

    if (existingAttempt) {
      const now = new Date();
      const allowedTimeMs = quiz.durationMinutes * 60 * 1000 + 10000;
      if (now.getTime() - existingAttempt.startedAt.getTime() > allowedTimeMs) {
        existingAttempt.status = 'abandoned';
        existingAttempt.completedAt = now;
        await existingAttempt.save();
        return res.status(403).json({ message: 'Previous attempt expired and was abandoned. Start a new attempt.' });
      }
      return res.json({ attempt: serializeAttemptForTaking(existingAttempt), quiz: serializeQuizForTaking(quiz) });
    }

    // Versioning snapshot
    const allQuestions = [];
    if (quiz.mode === 'sectioned_exam' && quiz.sections && quiz.sections.length > 0) {
      quiz.sections.forEach(s => {
        if (s.questions) allQuestions.push(...s.questions);
      });
    } else {
      if (quiz.questions) allQuestions.push(...quiz.questions);
    }

    const answers = allQuestions.map((q, idx) => ({
      questionIndex: idx,
      questionSnapshot: {
        text: q.questionText,
        options: q.options,
        correctIndex: q.correctOptionIndex,
        explanation: q.explanation,
        authorDifficulty: q.authorDifficulty,
        calibratedDifficulty: q.calibratedDifficulty,
        bankQuestionId: q.bankQuestionId,
        points: q.points || 1
      },
      selectedOptionIndex: -1,
      isCorrect: false,
      timeTakenSeconds: 0
    }));

    const newAttempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user.id,
      classId: quiz.classId,
      startedAt: new Date(),
      status: 'in_progress',
      score: 0,
      totalPossibleScore: 0,
      percentageScore: 0,
      answers,
      mode: 'standard'
    });

    await newAttempt.save();

    res.status(201).json({ attempt: serializeAttemptForTaking(newAttempt), quiz: serializeQuizForTaking(quiz) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes/adaptive/start
router.post('/adaptive/start', authMiddleware, async (req, res) => {
  try {
    const { bankId } = req.body;
    if (!bankId) return res.status(400).json({ message: 'bankId is required' });

    const bank = await QuestionBank.findById(bankId);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    if (bank.questions.length === 0) return res.status(400).json({ message: 'Bank has no questions' });

    // Create an ephemeral Quiz for this session
    const quiz = new Quiz({
      title: `Adaptive Practice: ${bank.title}`,
      description: 'System-generated adaptive practice session',
      category: bank.category,
      createdBy: req.user.id,
      mode: 'adaptive_practice',
      difficulty: 'medium',
      durationMinutes: 60, // Arbitrary large number
      questions: bank.questions.map(q => ({
        bankQuestionId: q._id,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        points: 1,
        authorDifficulty: q.authorDifficulty,
        calibratedDifficulty: q.calibratedDifficulty,
        source: q.source
      })),
      status: 'draft' // Hide from public listings
    });
    await quiz.save();

    const answers = quiz.questions.map((q, idx) => ({
      questionIndex: idx,
      questionSnapshot: {
        text: q.questionText,
        options: q.options,
        correctIndex: q.correctOptionIndex,
        explanation: q.explanation,
        authorDifficulty: q.authorDifficulty,
        calibratedDifficulty: q.calibratedDifficulty,
        bankQuestionId: q.bankQuestionId,
        points: q.points || 1
      },
      selectedOptionIndex: -1,
      isCorrect: false,
      timeTakenSeconds: 0
    }));

    const newAttempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user.id,
      startedAt: new Date(),
      status: 'in_progress',
      score: 0,
      totalPossibleScore: 0,
      percentageScore: 0,
      answers,
      mode: 'adaptive_practice'
    });
    await newAttempt.save();

    // Include calibratedDifficulty/authorDifficulty in the taking payload so frontend can sort
    const takingQuiz = serializeQuizForTaking(quiz);
    // serialize strips correctOptionIndex and explanation, which is correct.
    // It keeps calibratedDifficulty and authorDifficulty.

    res.status(201).json({ attempt: serializeAttemptForTaking(newAttempt), quiz: takingQuiz });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


// POST /api/quizzes/:id/report
router.post('/:id/report', authMiddleware, reportSubmissionLimiter, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const { reason, details } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }


    // Prevent duplicate report
    const existingReport = await QuizReport.findOne({ targetId: quizId, reportedBy: req.user.id });
    if (existingReport) {
      return res.status(400).json({ message: 'You have already reported this quiz' });
    }

    const report = new QuizReport({
      targetId: quizId,
      reportedBy: req.user.id,
      reason,
      details
    });

    await report.save();

    // Check if report count reaches threshold (3)
    const pendingCount = await QuizReport.countDocuments({ targetId: quizId, status: 'pending' });
    if (pendingCount >= 3 && quiz.status === 'published') {
      quiz.status = 'under_review';
      await quiz.save();

      // Trigger quiz_reported notification
      await notificationService.createNotification({
        userId: quiz.createdBy,
        type: 'quiz_reported',
        relatedQuiz: quiz._id,
        message: `Your quiz "${quiz.title}" is under review due to community reports.`,
        actionUrl: `/my-quizzes`,
        channel: 'both',
        emailData: { quizTitle: quiz.title }
      });
    }

    res.status(201).json({ message: 'Report submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes/:id/subscribe
router.post('/:id/subscribe', authMiddleware, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quizId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.subscribedQuizzes) user.subscribedQuizzes = [];
    if (!user.subscribedQuizzes.includes(quizId)) {
      user.subscribedQuizzes.push(quizId);
      await user.save();
    }

    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/quizzes/:id/subscribe
router.delete('/:id/subscribe', authMiddleware, async (req, res) => {
  try {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid Quiz ID format' });
  }

    const quizId = req.params.id;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.subscribedQuizzes) {
      user.subscribedQuizzes = user.subscribedQuizzes.filter(id => id.toString() !== quizId);
      await user.save();
    }

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes/ai-draft-questions
router.post('/ai-draft-questions', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user?.banned) return res.status(403).json({ error: 'Cannot generate AI questions while banned' });

    // Phase 17: Premium check
    if (!user.isPremium) {
       const today = new Date();
       today.setHours(0,0,0,0);
       const genCount = await AIGenerationLog.countDocuments({ user: user._id, createdAt: { $gte: today } });
       if (genCount >= 5) {
          return res.status(403).json({ error: 'Free daily limit reached. Upgrade to Premium for unlimited AI generation.' });
       }
    }

    const { topic, difficulty, count, language } = req.body;
    
    if (!topic) return res.status(400).json({ message: 'Topic is required' });
    const numQuestions = Math.min(Math.max(parseInt(count) || 5, 1), 20); // 1 to 20
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a quiz generation assistant. Create a multiple choice quiz about "${topic}" at a "${difficulty || 'medium'}" difficulty level.
Generate exactly ${numQuestions} questions.
For each question, provide 4 options. Exactly 1 option must be correct.
Provide an explanation for the correct answer.

Output ONLY valid JSON matching this schema:
[
  {
    "questionText": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctOptionIndex": 0,
    "explanation": "Explanation here",
    "points": 1
  }
]
Do not include markdown blocks like \`\`\`json or any other text.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Strip markdown code blocks if the model included them despite instructions
    if (text.startsWith('\`\`\`json')) text = text.replace('\`\`\`json', '');
    if (text.startsWith('\`\`\`')) text = text.replace('\`\`\`', '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`$/, '');
    text = text.trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (e) {
      console.error("AI response not JSON:", text);
      return res.status(500).json({ message: 'Failed to parse AI response' });
    }

    if (!Array.isArray(questions)) {
      return res.status(500).json({ message: 'AI returned invalid format' });
    }

    // Validate structure
    const validQuestions = questions.filter(q => {
      return q.questionText && 
             Array.isArray(q.options) && 
             q.options.length >= 2 && 
             q.options.length <= 6 &&
             typeof q.correctOptionIndex === 'number' &&
             q.correctOptionIndex >= 0 &&
             q.correctOptionIndex < q.options.length;
    });

    res.json({ questions: validQuestions });
  } catch (error) {
    console.error('AI Draft Error:', error);
    res.status(500).json({ message: 'AI generation failed', error: error.message });
  }
});

// POST /api/quizzes/ai-check
router.post('/ai-check', authMiddleware, aiLimiter, async (req, res) => {
  try {
    const { questionText, options, correctOptionIndex } = req.body;
    
    if (!questionText || !options || correctOptionIndex === undefined) {
      return res.status(400).json({ message: 'Question details required' });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are a quiz quality reviewer. Evaluate the following multiple choice question:
Question: "${questionText}"
Options: ${JSON.stringify(options)}
Correct Option Index (0-based): ${correctOptionIndex}

Check for:
1. Ambiguity in the question.
2. Factual errors.
3. Multiple plausible answers.

Return ONLY a valid JSON object matching this schema (do not include markdown blocks):
{
  "issuesFound": true/false,
  "feedback": "string explaining the issue and suggesting an improvement, or 'Looks good!' if no issues."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('\`\`\`json')) text = text.replace('\`\`\`json', '');
    if (text.startsWith('\`\`\`')) text = text.replace('\`\`\`', '');
    if (text.endsWith('\`\`\`')) text = text.replace(/\`\`\`$/, '');
    text = text.trim();

    const analysis = JSON.parse(text);
    res.json(analysis);
  } catch (error) {
    console.error('AI Check Error:', error);
    res.status(500).json({ message: 'AI check failed', error: error.message });
  }
});



// GET /api/quizzes/check-skill?skill=X
router.get('/check-skill', authMiddleware, async (req, res) => {
  try {
    const { skill } = req.query;
    if (!skill) return res.status(400).json({ message: 'Skill required' });
    
    // Check if any quiz category exactly matches (case-insensitive) the skill
    const quiz = await Quiz.findOne({ category: { $regex: new RegExp(`^${skill}$`, 'i') }, status: 'published' });
    if (quiz) {
      return res.json({ exists: true, quizId: quiz._id });
    }
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Global Leaderboard
router.get('/leaderboards', async (req, res) => {
  try {
    const { scope, institutionId } = req.query; // 'global' or 'institution'
    
    let matchStage = { status: 'completed' };
    
    // If we want institution scoped, we must join Quiz to check its institutionId
    // Alternatively, filter by users who belong to the same institution
    // The requirement says: "Institution-scoped leaderboards: 'top scorers at [Institution]' in addition to global"
    // So we filter QuizAttempts by users who have the same institutionId.
    
    if (scope === 'institution' && institutionId) {
      // Find all users in this institution
      const User = require('../models/User');
      const usersInInst = await User.find({ institutionId }).select('_id');
      const userIds = usersInInst.map(u => u._id);
      matchStage.user = { $in: userIds };
    }

    const leaders = await QuizAttempt.aggregate([
      { $match: matchStage },
      { $group: {
        _id: "$user",
        totalScore: { $sum: "$score" },
        quizzesTaken: { $sum: 1 }
      }},
      { $sort: { totalScore: -1 } },
      { $limit: 10 }
    ]);
    
    const User = require('../models/User');
    const populated = await User.populate(leaders, { path: '_id', select: 'username full_name avatar_url' });
    
    res.json(populated.map(p => ({
      user: p._id,
      score: p.totalScore,
      quizzesTaken: p.quizzesTaken
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const QuizAttempt = require('../models/QuizAttempt');
    // Simple recommendation: quizzes in categories where user scored < 70% recently
    const recent = await QuizAttempt.find({ user: req.user.id, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('quiz');
      
    const weakCategories = new Set();
    recent.forEach(att => {
      if (att.percentageScore < 70 && att.quiz?.category) {
        weakCategories.add(att.quiz.category);
      }
    });

    // Find new quizzes in these categories
    const recs = await Quiz.find({ 
      status: 'published',
      category: { $in: Array.from(weakCategories) }
    }).limit(5);

    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/:id/dispute', authMiddleware, async (req, res) => {
  try {
    const QuizDispute = require('../models/QuizDispute');
    const { questionIndex, reason, proposedCorrectIndex } = req.body;
    
    const dispute = new QuizDispute({
      quiz: req.params.id,
      questionIndex,
      reportedBy: req.user.id,
      reason,
      proposedCorrectIndex
    });
    
    await dispute.save();
    res.status(201).json(dispute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/quizzes/:id/export
router.get('/:id/export', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Paid quiz protection
    if (quiz.price > 0) {
       const QuizPurchase = require('../models/QuizPurchase');
       const hasPurchased = await QuizPurchase.exists({ user: req.user.id, quiz: quiz._id });
       if (!hasPurchased && quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
          // Omit questions
          quiz.questions = [];
          quiz.isPaidAndLocked = true;
       }
    }

    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attempts = await QuizAttempt.find({ quiz: quiz._id }).populate('user', 'username email');
    
    // Generate CSV
    let csv = 'Attempt ID,User,Email,Status,Score,Completed At\n';
    attempts.forEach(a => {
      csv += `${a._id},${a.user?.username || 'Unknown'},${a.user?.email || 'Unknown'},${a.status},${a.percentageScore || 0},${a.completedAt || ''}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`${quiz.title.replace(/\s+/g, '_')}_attempts.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET /api/quizzes/engine/recommendations
router.get('/engine/recommendations', authMiddleware, async (req, res) => {
  try {
     const recentAttempts = await QuizAttempt.find({ user: req.user.id, status: 'completed' })
        .sort({ completedAt: -1 }).limit(3).populate('quiz');
        
     const categories = new Set();
     recentAttempts.forEach(a => {
        if (a.quiz && a.quiz.category) categories.add(a.quiz.category);
     });
     
     if (categories.size === 0) {
        // Fallback generic
        const fallback = await Quiz.find({ status: 'published', isArchived: false }).limit(5);
        return res.json(fallback);
     }
     
     const recs = await Quiz.find({
        category: { $in: Array.from(categories) },
        status: 'published',
        isArchived: false
     }).limit(5);
     
     res.json(recs);
  } catch (err) {
     res.status(500).json({ error: err.message });
  }
});

module.exports = router;
