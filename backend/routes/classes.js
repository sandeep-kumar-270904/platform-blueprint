const express = require('express');
const router = express.Router();
const ClassRoster = require('../models/ClassRoster');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const auth = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const joinClassLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many join attempts, please try again later' }
});

// Create a class
router.post('/', auth, async (req, res) => {
  try {
    const roster = new ClassRoster({
      ...req.body,
      teacherId: req.user.id,
      joinCode: crypto.randomBytes(4).toString('hex').toUpperCase()
    });
    await roster.save();
    res.status(201).json(roster);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get teacher's classes
router.get('/', auth, async (req, res) => {
  try {
    const classes = await ClassRoster.find({ teacherId: req.user.id });
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Join a class
router.post('/join', auth, joinClassLimiter, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (user?.banned) return res.status(403).json({ error: 'Cannot join a class while banned' });
    const { joinCode } = req.body;
    const roster = await ClassRoster.findOne({ joinCode: joinCode.toUpperCase() });
    if (!roster) return res.status(404).json({ error: 'Invalid join code' });

    if (!roster.studentIds.includes(req.user.id)) {
      roster.studentIds.push(req.user.id);
      await roster.save();
    }
    res.json(roster);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get my enrolled classes (student)
router.get('/my-enrollments', auth, async (req, res) => {
  try {
    const classes = await ClassRoster.find({ studentIds: req.user.id }).populate('teacherId', 'full_name');
    res.json(classes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get class analytics (scoped)
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const roster = await ClassRoster.findById(req.params.id);
    if (!roster) return res.status(404).json({ error: 'Not found' });
    if (roster.teacherId.toString() !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    // Find all quizzes assigned to this class
    const quizzes = await Quiz.find({ classId: roster._id });
    const quizIds = quizzes.map(q => q._id);

    // Get ONLY attempts by students in this roster for these quizzes
    // This enforces the scope boundary: teacher only sees attempts for assigned quizzes by their students
    const attempts = await QuizAttempt.find({
      $or: [
        { classId: roster._id },
        { quiz: { $in: quizIds }, user: { $in: roster.studentIds } }
      ]
    }).populate('user', 'full_name email avatar_url')
      .populate('quiz', 'title dueDate');

    res.json({ roster, quizzes, attempts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Assign a quiz to a class
router.post('/:id/assign', auth, async (req, res) => {
  try {
    const roster = await ClassRoster.findOne({ _id: req.params.id, teacherId: req.user.id });
    if (!roster) return res.status(404).json({ error: 'Not found' });

    const quiz = await Quiz.findById(req.body.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    if (quiz.createdBy.toString() !== req.user.id) return res.status(403).json({ error: 'Must own quiz to assign' });
    if (quiz.status === 'under_review') return res.status(403).json({ error: 'Cannot assign a quiz that is under review' });

    quiz.classId = roster._id;
    quiz.dueDate = req.body.dueDate;
    await quiz.save();

    for (const studentId of roster.studentIds) {
      await notificationService.createNotification({
        userId: studentId,
        type: 'class_quiz_assigned',
        title: 'New Class Quiz Assigned',
        message: `A new quiz "${quiz.title}" has been assigned to your class.`,
        channel: 'both',
        emailData: { quizTitle: quiz.title, className: roster.name },
        actionUrl: `/quizzes/${quiz._id}`
      }, req.io);
    }

    res.json(quiz);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
