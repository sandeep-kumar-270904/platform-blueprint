const express = require('express');
const router = express.Router();
const QuizReport = require('../models/QuizReport');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const notificationService = require('../services/notificationService');

// All routes here should be protected by adminMiddleware
router.use(authMiddleware);
router.use(adminMiddleware);

// GET /api/admin/quiz-reports
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const reports = await QuizReport.find(query)
      .populate('targetId', 'title createdBy status')
      .populate('reportedBy', 'username full_name')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH /api/admin/quiz-reports/:id
router.patch('/:id', async (req, res) => {
  try {
    const { action, adminNote } = req.body;
    const report = await QuizReport.findById(req.params.id).populate('targetId');
    
    if (!report) return res.status(404).json({ message: 'Report not found' });
    
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    report.adminNote = adminNote;

    const quiz = report.targetId; // The populated quiz document

    if (action === 'dismiss') {
      report.status = 'reviewed_dismissed';
      await report.save();

      if (quiz) {
        // If no more pending reports, restore to published
        const pendingCount = await QuizReport.countDocuments({ targetId: quiz._id, status: 'pending' });
        if (pendingCount === 0 && quiz.status === 'under_review') {
          quiz.status = 'published';
          await quiz.save();
        }
      }
    } else if (action === 'delete_quiz') {
      report.status = 'reviewed_actioned';
      await report.save();
      
      if (quiz) {
        // Trigger quiz_deleted notification before deleting
        await notificationService.createNotification({
          userId: quiz.createdBy,
          type: 'quiz_deleted',
          message: `Your quiz "${quiz.title}" has been deleted by an administrator.`,
          channel: 'both',
          emailData: { quizTitle: quiz.title, adminNote }
        });
        await quiz.deleteOne();
      }
    } else if (action === 'warn_creator') {
      report.status = 'reviewed_actioned';
      await report.save();
      
      // Ideally trigger a notification to quiz.createdBy here
      // For now, it's just recorded in the report logic
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    if (req.io) {
      req.io.emit('admin:quizOverviewChanged');
    }

    res.json({ message: `Action ${action} completed successfully`, report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
