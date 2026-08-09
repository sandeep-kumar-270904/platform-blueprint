const express = require('express');
const router = express.Router();
const CollegeQuestion = require('../models/CollegeQuestion');
const CollegeAnswer = require('../models/CollegeAnswer');
const authMiddleware = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const User = require('../models/User');

// GET /api/college-qa/:collegeId/questions
router.get('/:collegeId/questions', async (req, res) => {
  try {
    const questions = await CollegeQuestion.find({ collegeId: req.params.collegeId, status: 'public' })
      .populate('userId', 'username full_name avatar_url')
      .sort({ upvotes: -1, createdAt: -1 });

    const questionsWithAnswers = await Promise.all(questions.map(async (q) => {
      const answers = await CollegeAnswer.find({ questionId: q._id, status: 'public' })
        .populate('userId', 'username full_name avatar_url')
        .sort({ upvotes: -1, createdAt: -1 });
      return { ...q.toObject(), answers };
    }));

    res.json(questionsWithAnswers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching questions', error: error.message });
  }
});

// POST /api/college-qa/:collegeId/questions
router.post('/:collegeId/questions', authMiddleware, async (req, res) => {
  try {
    const { questionText } = req.body;
    if (!questionText) return res.status(400).json({ message: 'Question text is required' });

    const question = new CollegeQuestion({
      collegeId: req.params.collegeId,
      userId: req.user.id,
      questionText
    });
    await question.save();

    await question.populate('userId', 'username full_name avatar_url');
    res.status(201).json({ ...question.toObject(), answers: [] });
  } catch (error) {
    res.status(500).json({ message: 'Error posting question', error: error.message });
  }
});

// GET /api/college-qa/questions/:questionId/answers
router.get('/questions/:questionId/answers', async (req, res) => {
  try {
    const question = await CollegeQuestion.findById(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answers = await CollegeAnswer.find({ questionId: req.params.questionId, status: 'public' })
      .populate('userId', 'username full_name avatar_url')
      .sort({ upvotes: -1, createdAt: -1 })
      .lean();

    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');

    const answersWithOfficialStatus = await Promise.all(answers.map(async (a) => {
      // We know a.userId is populated, so a.userId._id is the user ID.
      const officialStatus = await CollegeOfficialAccount.findOne({
        userId: a.userId?._id || a.userId,
        collegeId: question.collegeId,
        verificationStatus: 'approved'
      });

      return {
        ...a,
        answeredBy: a.userId, // Map userId to answeredBy to match frontend expectations
        isOfficial: !!officialStatus
      };
    }));

    res.json(answersWithOfficialStatus);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching answers', error: error.message });
  }
});

// POST /api/college-qa/questions/:questionId/answers
router.post('/questions/:questionId/answers', authMiddleware, async (req, res) => {
  try {
    const { answerText } = req.body;
    if (!answerText) return res.status(400).json({ message: 'Answer text is required' });

    const question = await CollegeQuestion.findById(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const answer = new CollegeAnswer({
      questionId: req.params.questionId,
      userId: req.user.id,
      answerText
    });
    await answer.save();

    await answer.populate('userId', 'username full_name avatar_url');

    if (question.userId.toString() !== req.user.id) {
      const replier = await User.findById(req.user.id);
      await notificationService.createNotification({
        userId: question.userId,
        type: 'question_answered',
        relatedContentId: question._id,
        message: `${replier?.username || 'Someone'} answered your question.`
      });
    }

    const CollegeOfficialAccount = require('../models/CollegeOfficialAccount');
    const officialStatus = await CollegeOfficialAccount.findOne({
      userId: req.user.id,
      collegeId: question.collegeId,
      verificationStatus: 'approved'
    });

    res.status(201).json({
      ...answer.toObject(),
      answeredBy: answer.userId,
      isOfficial: !!officialStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Error posting answer', error: error.message });
  }
});

// POST /api/college-qa/questions/:id/upvote
router.post('/questions/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const question = await CollegeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const index = question.upvotedBy.indexOf(req.user.id);
    if (index === -1) {
      question.upvotedBy.push(req.user.id);
      question.upvotes += 1;
    } else {
      question.upvotedBy.splice(index, 1);
      question.upvotes -= 1;
    }
    await question.save();
    res.json({ upvotes: question.upvotes, upvotedBy: question.upvotedBy });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting', error: error.message });
  }
});

// POST /api/college-qa/answers/:id/upvote
router.post('/answers/:id/upvote', authMiddleware, async (req, res) => {
  try {
    const answer = await CollegeAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const index = answer.upvotedBy.indexOf(req.user.id);
    if (index === -1) {
      answer.upvotedBy.push(req.user.id);
      answer.upvotes += 1;
      
      if (answer.userId.toString() !== req.user.id) {
        const upvoter = await User.findById(req.user.id);
        await notificationService.createNotification({
          userId: answer.userId,
          type: 'answer_upvoted',
          relatedContentId: answer._id,
          message: `${upvoter?.username || 'Someone'} upvoted your answer.`
        });
      }
    } else {
      answer.upvotedBy.splice(index, 1);
      answer.upvotes -= 1;
    }
    await answer.save();
    res.json({ upvotes: answer.upvotes, upvotedBy: answer.upvotedBy });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting', error: error.message });
  }
});

module.exports = router;
