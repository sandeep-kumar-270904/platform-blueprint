const express = require('express');
const router = express.Router();
const CollegeQuestion = require('../models/CollegeQuestion');
const CollegeAnswer = require('../models/CollegeAnswer');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
router.post('/questions/:id/answers', auth, async (req, res) => {
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

    res.status(201).json(answer);
  } catch (error) {
    res.status(500).json({ message: 'Error posting answer', error: error.message });
  }
});

// POST /api/college-qa/questions/:id/upvote
router.post('/questions/:id/upvote', auth, async (req, res) => {
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
    }

    await question.save();
    res.json({ upvotes: question.upvotes, isUpvoted: !isUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting question', error: error.message });
  }
});

// POST /api/college-qa/answers/:id/upvote
router.post('/answers/:id/upvote', auth, async (req, res) => {
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
    }

    await answer.save();
    res.json({ upvotes: answer.upvotes, isUpvoted: !isUpvoted });
  } catch (error) {
    res.status(500).json({ message: 'Error upvoting answer', error: error.message });
  }
});

module.exports = router;
