const express = require('express');
const router = express.Router();
const QAQuestion = require('../models/QAQuestion');
const QAAnswer = require('../models/QAAnswer');
const User = require('../models/User'); // Required to populate user details
const authMiddleware = require('../middleware/auth');

// GET /api/qa/questions
router.get('/questions', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'All') query.category = category;

    const questions = await QAQuestion.find(query)
      .sort({ is_pinned: -1, createdAt: -1 })
      .limit(100)
      .lean(); 

    const userIds = [...new Set(questions.map(q => q.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const questionsWithAuthor = questions.map(q => ({ ...q, author: userMap[q.user_id.toString()] || null }));

    res.json(questionsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions
router.post('/questions', authMiddleware, async (req, res) => {
  try {
    const newQuestion = new QAQuestion({
      user_id: req.user.id,
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      tags: req.body.tags || []
    });
    const savedQuestion = await newQuestion.save();
    
    // Broadcast via socket.io
    req.io.emit('qa_question_created', savedQuestion);
    
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions/:id/vote
router.post('/questions/:id/vote', authMiddleware, async (req, res) => {
  try {
    const questionId = req.params.id;
    const userId = req.user.id;

    const question = await QAQuestion.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Not found' });

    const isUpvoted = question.upvoted_by.includes(userId);
    
    if (isUpvoted) {
      await QAQuestion.findByIdAndUpdate(questionId, {
        $inc: { upvotes: -1 },
        $pull: { upvoted_by: userId }
      });
    } else {
      await QAQuestion.findByIdAndUpdate(questionId, {
        $inc: { upvotes: 1 },
        $push: { upvoted_by: userId }
      });
    }

    req.io.emit('qa_question_updated', questionId);

    res.json({ message: isUpvoted ? 'Downvoted' : 'Upvoted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions/:id/view
router.post('/questions/:id/view', async (req, res) => {
  try {
    await QAQuestion.findByIdAndUpdate(req.params.id, {
      $inc: { view_count: 1 }
    });
    res.json({ message: 'View incremented' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/qa/questions/:id/answers
router.get('/questions/:id/answers', async (req, res) => {
  try {
    const answers = await QAAnswer.find({ question_id: req.params.id })
      .sort({ is_accepted: -1, upvotes: -1 })
      .lean();

    const userIds = [...new Set(answers.map(a => a.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
    const userMap = users.reduce((acc, u) => ({ ...acc, [u._id.toString()]: u }), {});

    const answersWithAuthor = answers.map(a => ({ ...a, author: userMap[a.user_id.toString()] || null }));

    res.json(answersWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions/:id/answers
router.post('/questions/:id/answers', authMiddleware, async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const newAnswer = new QAAnswer({
      question_id: questionId,
      user_id: req.user.id,
      body: req.body.body
    });
    const savedAnswer = await newAnswer.save();
    
    await QAQuestion.findByIdAndUpdate(questionId, {
      $inc: { answer_count: 1 }
    });
    
    req.io.to(`qa_question_${questionId}`).emit('qa_answer_created', savedAnswer);
    req.io.emit('qa_question_updated', questionId);

    res.status(201).json(savedAnswer);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/answers/:id/vote
router.post('/answers/:id/vote', authMiddleware, async (req, res) => {
  try {
    const answerId = req.params.id;
    const userId = req.user.id;

    const answer = await QAAnswer.findById(answerId);
    if (!answer) return res.status(404).json({ message: 'Not found' });

    const isUpvoted = answer.upvoted_by.includes(userId);
    
    if (isUpvoted) {
      await QAAnswer.findByIdAndUpdate(answerId, {
        $inc: { upvotes: -1 },
        $pull: { upvoted_by: userId }
      });
    } else {
      await QAAnswer.findByIdAndUpdate(answerId, {
        $inc: { upvotes: 1 },
        $push: { upvoted_by: userId }
      });
    }

    req.io.to(`qa_question_${answer.question_id}`).emit('qa_answer_updated', answerId);

    res.json({ message: isUpvoted ? 'Downvoted' : 'Upvoted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
