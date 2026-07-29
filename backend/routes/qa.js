const express = require('express');
const router = express.Router();
const QAQuestion = require('../models/QAQuestion');
const QAAnswer = require('../models/QAAnswer');
const QAVote = require('../models/QAVote');
const QAComment = require('../models/QAComment');
const QABookmark = require('../models/QABookmark');
const User = require('../models/User');
const ReferrerProfile = require('../models/ReferrerProfile');
const authMiddleware = require('../middleware/auth');
const { qaPostLimiter, voteLimiter } = require('../middleware/rateLimiter');
const placementGamificationService = require('../services/placementGamificationService');
const { syncItem, removeItem } = require('../services/placementSearchService');
const notificationService = require('../services/notificationService');
const lastNotifiedMap = new Map();

// Helper to check for senior/alumni status
async function fetchAuthorProfiles(userIds) {
  const users = await User.find({ _id: { $in: userIds } }, 'full_name username avatar_url').lean();
  const referrers = await ReferrerProfile.find({ user_id: { $in: userIds } }, 'user_id').lean();
  const referrerSet = new Set(referrers.map(r => r.user_id.toString()));
  
  return users.reduce((acc, u) => {
    acc[u._id.toString()] = { ...u, isSenior: referrerSet.has(u._id.toString()) };
    return acc;
  }, {});
}

// GET /api/qa/questions (Feed)
router.get('/questions', async (req, res) => {
  try {
    const { category, search, company, unanswered } = req.query;
    
    // Auto-hide heavily reported items unless moderator reviewed
    let query = { 
      $or: [
        { reportCount: { $lt: 3 } },
        { isModeratorReviewed: true }
      ]
    };

    if (category && category !== 'All') query.category = category;
    if (company) query.company = company;
    if (unanswered === 'true') query.answer_count = 0;
    
    if (search) {
      try {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { title: { $regex: escapedSearch, $options: 'i' } },
          { body: { $regex: escapedSearch, $options: 'i' } }
        ];
      } catch (e) {}
    }

    const questions = await QAQuestion.find(query)
      .sort({ is_pinned: -1, createdAt: -1 })
      .limit(100)
      .lean(); 

    const userIds = [...new Set(questions.map(q => q.user_id.toString()))];
    const userMap = await fetchAuthorProfiles(userIds);

    const questionsWithAuthor = questions.map(q => ({ ...q, author: userMap[q.user_id.toString()] || null }));

    res.json(questionsWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions
router.post('/questions', authMiddleware, qaPostLimiter, async (req, res) => {
  try {
    const newQuestion = new QAQuestion({
      user_id: req.user.id,
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      tags: req.body.tags || [],
      company: req.body.company || undefined
    });
    const savedQuestion = await newQuestion.save();
    
    // Sync into Global Search Index
    await syncItem('qa', savedQuestion._id, {
      title: savedQuestion.title,
      description: savedQuestion.body,
      matchTags: savedQuestion.tags,
      companyTags: savedQuestion.company ? [savedQuestion.company] : [],
      visibility: 'Public' // Or 'PendingReview' if moderation applies
    });
    
    if (req.io) req.io.emit('qa_question_created', savedQuestion);
    
    res.status(201).json(savedQuestion);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions/:id/view
router.post('/questions/:id/view', async (req, res) => {
  try {
    await QAQuestion.findByIdAndUpdate(req.params.id, { $inc: { view_count: 1 } });
    res.json({ message: 'View incremented' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/qa/questions/:id/answers
router.get('/questions/:id/answers', async (req, res) => {
  try {
    const query = { 
      question_id: req.params.id,
      $or: [{ reportCount: { $lt: 3 } }, { isModeratorReviewed: true }]
    };

    const answers = await QAAnswer.find(query)
      .sort({ is_accepted: -1, upvotes: -1 })
      .lean();

    const userIds = [...new Set(answers.map(a => a.user_id.toString()))];
    const userMap = await fetchAuthorProfiles(userIds);

    const answersWithAuthor = answers.map(a => ({ ...a, author: userMap[a.user_id.toString()] || null }));

    res.json(answersWithAuthor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/qa/questions/:id/answers
router.post('/questions/:id/answers', authMiddleware, qaPostLimiter, async (req, res) => {
  try {
    const questionId = req.params.id;
    
    const newAnswer = new QAAnswer({
      question_id: questionId,
      user_id: req.user.id,
      body: req.body.body
    });
    const savedAnswer = await newAnswer.save();
    
    await QAQuestion.findByIdAndUpdate(questionId, { $inc: { answer_count: 1 } });
    
    const question = await QAQuestion.findById(questionId);
    if (question && question.user_id.toString() !== req.user.id) {
      const now = Date.now();
      const lastNotified = lastNotifiedMap.get(questionId) || 0;
      if (now - lastNotified > 5 * 60 * 1000) {
        lastNotifiedMap.set(questionId, now);
        notificationService.sendNotification({
          userId: question.user_id,
          type: 'question_answered',
          relatedContentId: questionId,
          actorId: req.user.id,
          message: `Someone answered your question: "${question.title}"`
        });
      }
    }
    
    if (req.io) {
      req.io.to(`qa_question_${questionId}`).emit('qa_answer_created', savedAnswer);
      req.io.emit('qa_question_updated', questionId);
    }

    res.status(201).json(savedAnswer);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Centralized Voting Logic
async function handleVote(req, res, Model, targetType) {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;
    const { vote } = req.body; // 1 or -1, or 0 to remove

    if (![1, -1, 0].includes(vote)) return res.status(400).json({ message: 'Invalid vote' });

    const target = await Model.findById(targetId);
    if (!target) return res.status(404).json({ message: 'Not found' });
    if (target.user_id.toString() === userId) {
      return res.status(403).json({ message: 'Cannot vote on your own post' });
    }

    const existingVote = await QAVote.findOne({ user_id: userId, targetType, targetId });

    // Remove existing vote logic if modifying
    if (existingVote) {
      const fieldToDecrement = existingVote.vote === 1 ? 'upvotes' : 'downvotes';
      await Model.findByIdAndUpdate(targetId, { $inc: { [fieldToDecrement]: -1 } });
      await QAVote.deleteOne({ _id: existingVote._id });
    }

    // Apply new vote if not removing
    if (vote !== 0) {
      const fieldToIncrement = vote === 1 ? 'upvotes' : 'downvotes';
      const updatedTarget = await Model.findByIdAndUpdate(targetId, { $inc: { [fieldToIncrement]: 1 } }, { new: true });
      await QAVote.create({ user_id: userId, targetType, targetId, vote });

      // Gamification trigger (Answers only, threshold = 5 upvotes)
      if (targetType === 'Answer' && updatedTarget.upvotes >= 5 && !updatedTarget.hasReceivedUpvoteXP) {
        await Model.findByIdAndUpdate(targetId, { hasReceivedUpvoteXP: true });
        if (placementGamificationService.awardXP) {
          await placementGamificationService.awardXP(updatedTarget.user_id, 20, 'answer_upvotes', `Helpful Answer`);
        }
      }
    }

    res.json({ message: 'Vote processed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// POST /api/qa/questions/:id/vote
router.post('/questions/:id/vote', authMiddleware, voteLimiter, (req, res) => handleVote(req, res, QAQuestion, 'Question'));

// POST /api/qa/answers/:id/vote
router.post('/answers/:id/vote', authMiddleware, voteLimiter, (req, res) => handleVote(req, res, QAAnswer, 'Answer'));

// POST /api/qa/answers/:id/accept
router.post('/answers/:id/accept', authMiddleware, async (req, res) => {
  try {
    const answerId = req.params.id;
    const answer = await QAAnswer.findById(answerId);
    if (!answer) return res.status(404).json({ message: 'Not found' });

    const question = await QAQuestion.findById(answer.question_id);
    if (question.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the asker can accept an answer' });
    }
    if (answer.user_id.toString() === req.user.id) {
      return res.status(403).json({ message: 'You cannot accept your own answer' });
    }

    // Reset any previously accepted answer
    await QAAnswer.updateMany({ question_id: answer.question_id, is_accepted: true }, { is_accepted: false });

    answer.is_accepted = true;
    await answer.save();

    await QAQuestion.findByIdAndUpdate(question._id, { status: 'Answered' });

    if (answer.user_id.toString() !== req.user.id) {
      notificationService.sendNotification({
        userId: answer.user_id,
        type: 'answer_upvoted',
        relatedContentId: question._id,
        actorId: req.user.id,
        message: 'Your answer was marked as accepted!'
      });
    }

    // Award XP
    if (!answer.hasReceivedAcceptedXP) {
      answer.hasReceivedAcceptedXP = true;
      await answer.save();
      if (placementGamificationService.awardXP) {
        await placementGamificationService.awardXP(answer.user_id, 50, 'answer_accepted', 'Accepted Answer');
      }
    }

    res.json({ message: 'Answer accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Centralized Report Logic
async function handleReport(req, res, Model) {
  try {
    await Model.findByIdAndUpdate(req.params.id, { $inc: { reportCount: 1 } });
    res.json({ message: 'Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
router.post('/questions/:id/report', authMiddleware, (req, res) => handleReport(req, res, QAQuestion));
router.post('/answers/:id/report', authMiddleware, (req, res) => handleReport(req, res, QAAnswer));
router.post('/comments/:id/report', authMiddleware, (req, res) => handleReport(req, res, QAComment));

// POST /api/qa/answers/:id/comments
router.post('/answers/:id/comments', authMiddleware, async (req, res) => {
  try {
    const comment = new QAComment({
      answer_id: req.params.id,
      user_id: req.user.id,
      body: req.body.body
    });
    await comment.save();
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/qa/answers/:id/comments
router.get('/answers/:id/comments', async (req, res) => {
  try {
    const comments = await QAComment.find({ answer_id: req.params.id, reportCount: { $lt: 3 } })
      .sort({ createdAt: 1 }).lean();
    
    const userIds = [...new Set(comments.map(c => c.user_id.toString()))];
    const userMap = await fetchAuthorProfiles(userIds);

    res.json(comments.map(c => ({ ...c, author: userMap[c.user_id.toString()] || null })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Bookmarks
router.post('/questions/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    await QABookmark.updateOne(
      { user_id: req.user.id, question_id: req.params.id },
      { $set: { user_id: req.user.id, question_id: req.params.id } },
      { upsert: true }
    );
    res.json({ message: 'Bookmarked' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/questions/:id/bookmark', authMiddleware, async (req, res) => {
  try {
    await QABookmark.deleteOne({ user_id: req.user.id, question_id: req.params.id });
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
