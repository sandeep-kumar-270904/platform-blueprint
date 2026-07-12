const express = require('express');
const router = express.Router();
const CollegeQuestion = require('../models/CollegeQuestion');
const CollegeAnswer = require('../models/CollegeAnswer');
const User = require('../models/User');
const Report = require('../models/Report');
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');
const { qaPostLimiter, voteLimiter } = require('../middleware/rateLimiter');

// GET /api/college-qa/questions/:id/answers
router.get('/questions/:id/answers', async (req, res) => {
  try {
    const answers = await CollegeAnswer.find({ questionId: req.params.id })
      .populate('answeredBy', 'full_name avatar_url university')
      .sort({ upvotes: -1, createdAt: -1 });
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching answers', error: error.message });
  }
});

// POST /api/college-qa/questions/:id/answers
router.post('/questions/:id/answers', auth, qaPostLimiter, async (req, res) => {
  try {
    const { answerText } = req.body;
    if (!answerText) return res.status(400).json({ message: 'Answer text is required' });

    const question = await CollegeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const user = await User.findById(req.user.id);
    
    // Simple check if user belongs to the college, or if university matches
    // In a full implementation, we'd check collegeId against user.university
    let isCurrentStudent = false;
    if (user.university && question.collegeId) {
      // Very naive check for demo purposes
      isCurrentStudent = true;
    }

    const answer = new CollegeAnswer({
      questionId: req.params.id,
      answeredBy: req.user.id,
      answerText,
      isCurrentStudent
    });

    await answer.save();

    // Populate for immediate return
    await answer.populate('answeredBy', 'full_name avatar_url university');

    if (question.status === 'open') {
      question.status = 'answered';
      await question.save();
    }

    // Trigger Notification for the question asker
    if (question.askedBy.toString() !== req.user.id) {
      await notificationService.createNotification({
        userId: question.askedBy,
        type: 'question_answered',
        relatedCollegeId: question.collegeId,
        relatedContentId: question._id,
        message: `${user.username || 'Someone'} answered your question.`
      });
    }

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: 'Error posting answer', error: error.message });
  }
});

// POST /api/college-qa/questions/:id/upvote
router.post('/questions/:id/upvote', auth, voteLimiter, async (req, res) => {
  try {
    const question = await CollegeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const userId = req.user.id;
    const isUpvoted = question.upvotedBy.includes(userId);

    if (isUpvoted) {
      question.upvotedBy = question.upvotedBy.filter(id => id.toString() !== userId);
      question.upvotes -= 1;
    } else {
      question.upvotedBy.push(userId);
      question.upvotes += 1;
      
      // Trigger Notification for the question asker
      if (question.askedBy.toString() !== userId) {
        const user = await User.findById(userId);
        await notificationService.createNotification({
          userId: question.askedBy,
          type: 'question_upvoted',
          relatedCollegeId: question.collegeId,
          relatedContentId: question._id,
          message: `${user?.username || 'Someone'} upvoted your question.`
        });
      }
    }

    await question.save();
    res.json({ upvotes: question.upvotes, isUpvoted: !isUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting question', error: error.message });
  }
});

// POST /api/college-qa/questions/:id/report
router.post('/questions/:id/report', auth, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const report = new Report({
      content_type: 'college_question',
      content_id: questionId,
      reported_by: req.user.id,
      reason
    });
    await report.save();
    res.json({ message: 'Question reported successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/college-qa/answers/:id/upvote
router.post('/answers/:id/upvote', auth, voteLimiter, async (req, res) => {
  try {
    const answer = await CollegeAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });

    const userId = req.user.id;
    const isUpvoted = answer.upvotedBy.includes(userId);

    if (isUpvoted) {
      answer.upvotedBy = answer.upvotedBy.filter(id => id.toString() !== userId);
      answer.upvotes -= 1;
    } else {
      answer.upvotedBy.push(userId);
      answer.upvotes += 1;
      
      // Trigger Notification for the answer author
      if (answer.answeredBy.toString() !== userId) {
        const user = await User.findById(userId);
        await notificationService.createNotification({
          userId: answer.answeredBy,
          type: 'answer_upvoted',
          relatedCollegeId: null,
          relatedContentId: answer._id,
          message: `${user?.username || 'Someone'} upvoted your answer.`
        });
      }
    }

    await answer.save();
    res.json({ upvotes: answer.upvotes, isUpvoted: !isUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting answer', error: error.message });
  }
});

// POST /api/college-qa/answers/:id/report
router.post('/answers/:id/report', auth, async (req, res) => {
  try {
    const answerId = req.params.id;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const report = new Report({
      content_type: 'college_answer',
      content_id: answerId,
      reported_by: req.user.id,
      reason
    });
    await report.save();
    res.json({ message: 'Answer reported successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/college-qa/questions/:id
router.put('/questions/:id', auth, async (req, res) => {
  try {
    const question = await CollegeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    if (question.askedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.questionText) {
      question.questionText = req.body.questionText;
    }
    
    await question.save();
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: 'Error updating question', error: error.message });
  }
});

// DELETE /api/college-qa/questions/:id
router.delete('/questions/:id', auth, async (req, res) => {
  try {
    const question = await CollegeQuestion.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    if (question.askedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await CollegeQuestion.findByIdAndDelete(req.params.id);
    // Cascade delete answers
    await CollegeAnswer.deleteMany({ questionId: req.params.id });

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

// PUT /api/college-qa/answers/:id
router.put('/answers/:id', auth, async (req, res) => {
  try {
    const answer = await CollegeAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    
    if (answer.answeredBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.body.answerText) {
      answer.answerText = req.body.answerText;
    }
    
    await answer.save();
    res.json(answer);
  } catch (error) {
    res.status(500).json({ message: 'Error updating answer', error: error.message });
  }
});

// DELETE /api/college-qa/answers/:id
router.delete('/answers/:id', auth, async (req, res) => {
  try {
    const answer = await CollegeAnswer.findById(req.params.id);
    if (!answer) return res.status(404).json({ message: 'Answer not found' });
    
    if (answer.answeredBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await CollegeAnswer.findByIdAndDelete(req.params.id);

    // Optionally update question status if it was the last answer
    const remainingAnswers = await CollegeAnswer.countDocuments({ questionId: answer.questionId });
    if (remainingAnswers === 0) {
      const question = await CollegeQuestion.findById(answer.questionId);
      if (question) {
        question.status = 'open';
        await question.save();
      }
    }

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting answer', error: error.message });
  }
});

module.exports = router;
