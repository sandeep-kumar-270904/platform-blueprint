const express = require('express');
const router = express.Router();
const DSAProblem = require('../models/DSAProblem');
const DSAProgress = require('../models/DSAProgress');
const UserActivity = require('../models/UserActivity');
const notificationService = require('../services/notificationService');
const auth = require('../middleware/auth');

// @route   GET /api/dsa/problems
// @desc    Get all DSA problems with pagination, search, and filters
// @access  Private
router.get('/problems', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', difficulty, topic, company } = req.query;
    const query = {};

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (topic) {
      query.topic = topic;
    }
    if (company) {
      query.companies = { $in: [new RegExp(`^${company}$`, 'i')] };
    }

    const total = await DSAProblem.countDocuments(query);
    const problems = await DSAProblem.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dsa/progress
// @desc    Get user's DSA progress
// @access  Private
router.get('/progress', auth, async (req, res) => {
  try {
    let progress = await DSAProgress.findOne({ user_id: req.user.id });
    if (!progress) {
      progress = new DSAProgress({ user_id: req.user.id, solved_problems: [] });
      await progress.save();
    }
    const totalProblems = await DSAProblem.countDocuments();
    res.json({
      solved_problems: progress.solved_problems,
      totalProblems,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dsa/problems/:id/solve
// @desc    Toggle solve status for a problem
// @access  Private
router.post('/problems/:id/solve', auth, async (req, res) => {
  try {
    const { solved } = req.body; // boolean
    let progress = await DSAProgress.findOne({ user_id: req.user.id });
    
    if (!progress) {
      progress = new DSAProgress({ user_id: req.user.id, solved_problems: [] });
    }

    const problemId = req.params.id;

    if (solved) {
      if (!progress.solved_problems.includes(problemId)) {
        progress.solved_problems.push(problemId);
        
        await UserActivity.create({
          user_id: req.user.id,
          action_type: 'dsa_solve',
          target_id: problemId
        });
        
        // Scalable Milestone trigger (every 10 problems)
        // This inherently prevents flooding on backfills (e.g. going from 0 to 45 would only trigger on 10, 20, 30, 40 at the time they hit exactly that number)
        if (progress.solved_problems.length > 0 && progress.solved_problems.length % 10 === 0) {
          await notificationService.createNotification({
            userId: req.user.id,
            type: 'placement_milestone',
            message: `Incredible! You solved ${progress.solved_problems.length} DSA problems!`
          });
        }
      }
    } else {
      progress.solved_problems = progress.solved_problems.filter(
        id => id.toString() !== problemId
      );
    }

    await progress.save();
    res.json(progress.solved_problems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/dsa/progress/reset
// @desc    Reset user's DSA progress
// @access  Private
router.post('/progress/reset', auth, async (req, res) => {
  try {
    let progress = await DSAProgress.findOne({ user_id: req.user.id });
    if (progress) {
      progress.solved_problems = [];
      await progress.save();
    }
    res.json([]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/dsa/metadata
// @desc    Get unique topics and companies for filters
// @access  Private
router.get('/metadata', auth, async (req, res) => {
  try {
    const topics = await DSAProblem.distinct('topic');
    const companies = await DSAProblem.distinct('companies');
    res.json({ topics, companies });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
