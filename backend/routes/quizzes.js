const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const QuizReport = require('../models/QuizReport');
const User = require('../models/User');
const QuestionBankItem = require('../models/QuestionBankItem');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimit = require('express-rate-limit');

const upload = multer({ storage: multer.memoryStorage() });

const aiLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 20, // 20 requests per day per IP
  message: { message: 'Daily limit for AI generation reached. Please try again tomorrow.' }
});

// Quiz serializer for "taking" (strips correctOptionIndex and explanation)
const serializeQuizForTaking = (quiz) => {
  const qObj = quiz.toObject();
  qObj.questions = qObj.questions.map(q => {
    delete q.correctOptionIndex;
    delete q.explanation;
    return q;
  });
  return qObj;
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
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (mode) query.mode = mode;

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

    res.json({ quizzes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
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
    const quiz = await Quiz.findById(req.params.id).select('-questions.correctOptionIndex -questions.explanation');
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
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
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
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
    const distribution = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed' } },
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
      { $match: { quiz: quiz._id, status: 'completed' } },
      { $unwind: "$answers" },
      { $group: {
          _id: "$answers.questionIndex",
          totalAnswers: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
      }}
    ]);

    const questionDifficulty = correctAnswers.map(c => ({
      questionIndex: c._id,
      questionText: quiz.questions[c._id]?.questionText,
      correctRate: c.totalAnswers > 0 ? (c.correctAnswers / c.totalAnswers) * 100 : 0
    })).sort((a, b) => a.questionIndex - b.questionIndex);

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
router.post('/', authMiddleware, async (req, res) => {
  try {
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
      questions
    });

    await quiz.save();
    res.status(201).json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/quizzes/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
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

// POST /api/quizzes/:id/add-from-bank
router.post('/:id/add-from-bank', authMiddleware, async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({ message: 'itemIds array is required' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
    if (quiz.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const items = await QuestionBankItem.find({ _id: { $in: itemIds } });
    
    const newQuestions = items.map(item => ({
      questionText: item.questionText,
      options: item.options,
      correctOptionIndex: item.correctOptionIndex,
      explanation: item.explanation,
      points: item.points
    }));

    if (newQuestions.length > 0) {
      quiz.questions.push(...newQuestions);
      await quiz.save();
      
      // increment usageCount
      await QuestionBankItem.updateMany(
        { _id: { $in: items.map(i => i._id) } },
        { $inc: { usageCount: 1 } }
      );
    }

    res.json(quiz);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    
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
    const mongoose = require('mongoose');
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
          'userInfo.avatar': 1
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
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
    if (quiz.status === 'under_review') return res.status(403).json({ message: 'Quiz is currently under review and cannot be attempted' });

    // Check if user already has an in_progress attempt
    const existingAttempt = await QuizAttempt.findOne({
      quiz: quiz._id,
      user: req.user.id,
      status: 'in_progress'
    });

    if (existingAttempt) {
      return res.json({ attempt: existingAttempt, quiz: serializeQuizForTaking(quiz) });
    }

    const newAttempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user.id,
      startedAt: new Date(),
      status: 'in_progress',
      score: 0,
      totalPossibleScore: 0,
      percentageScore: 0
    });

    await newAttempt.save();

    res.status(201).json({ attempt: newAttempt, quiz: serializeQuizForTaking(quiz) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/quizzes/:id/report
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reason, details } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

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
    const { topic, difficulty, count } = req.body;
    
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

module.exports = router;
