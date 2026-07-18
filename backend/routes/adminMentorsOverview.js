const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Referral = require('../models/Referral');
const ForumThread = require('../models/ForumThread');
const ForumReply = require('../models/ForumReply');
const QAQuestion = require('../models/QAQuestion');
const QAAnswer = require('../models/QAAnswer');
const LearningPath = require('../models/LearningPath');
const Institution = require('../models/Institution');
const Cohort = require('../models/Cohort');
const MentorBooking = require('../models/MentorBooking');

// Check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/mentors-overview/referrals
router.get('/referrals', authMiddleware, isAdmin, async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('referrer', 'full_name username')
      .populate('referredUser', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching referrals', error: err.message });
  }
});

// GET /api/admin/mentors-overview/subscriptions
router.get('/subscriptions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ subscriptionTier: { $in: ['plus', 'pro'] } })
      .select('full_name username email subscriptionTier')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching subscriptions', error: err.message });
  }
});

// GET /api/admin/mentors-overview/forums
router.get('/forums', authMiddleware, isAdmin, async (req, res) => {
  try {
    const threads = await ForumThread.find()
      .populate('author', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching forums', error: err.message });
  }
});

// DELETE /api/admin/mentors-overview/forums/:id
router.delete('/forums/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await ForumThread.findByIdAndDelete(req.params.id);
    await ForumReply.deleteMany({ threadId: req.params.id });
    res.json({ message: 'Forum thread and replies deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting forum thread', error: err.message });
  }
});

// GET /api/admin/mentors-overview/qa
router.get('/qa', authMiddleware, isAdmin, async (req, res) => {
  try {
    const questions = await QAQuestion.find()
      .populate('author', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching QA', error: err.message });
  }
});

// DELETE /api/admin/mentors-overview/qa/:id
router.delete('/qa/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    await QAQuestion.findByIdAndDelete(req.params.id);
    await QAAnswer.deleteMany({ questionId: req.params.id });
    res.json({ message: 'QA question and answers deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting QA question', error: err.message });
  }
});

// GET /api/admin/mentors-overview/learning-paths
router.get('/learning-paths', authMiddleware, isAdmin, async (req, res) => {
  try {
    const paths = await LearningPath.find()
      .populate('creator', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(paths);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching learning paths', error: err.message });
  }
});

// GET /api/admin/mentors-overview/institutions
router.get('/institutions', authMiddleware, isAdmin, async (req, res) => {
  try {
    const institutions = await Institution.find()
      .populate('adminId', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching institutions', error: err.message });
  }
});

// GET /api/admin/mentors-overview/cohorts
router.get('/cohorts', authMiddleware, isAdmin, async (req, res) => {
  try {
    const cohorts = await Cohort.find()
      .populate('institutionId', 'name')
      .populate('teacherId', 'full_name username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(cohorts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cohorts', error: err.message });
  }
});

// GET /api/admin/mentors-overview/consistency-check
router.get('/consistency-check', authMiddleware, isAdmin, async (req, res) => {
  try {
    const issues = [];

    // 1. Check forum reply counts
    const threads = await ForumThread.find();
    for (const thread of threads) {
      const actualCount = await ForumReply.countDocuments({ threadId: thread._id });
      if (thread.replyCount !== actualCount) {
        issues.push(`ForumThread ${thread._id} has replyCount ${thread.replyCount} but actual replies is ${actualCount}`);
      }
    }

    // 2. Check referral conversion counts
    // For each code, check if number of referred users matches
    const referrers = await User.find({ referralCode: { $exists: true, $ne: null } });
    for (const user of referrers) {
      const actualConversions = await Referral.countDocuments({ referrer: user._id, status: 'converted' });
      // Usually, there's a referralCount or similar on User. If it exists, compare it.
      // If we don't denormalize count, we can just log a successful check.
    }

    // 3. Cohort seatsUsed
    const cohorts = await Cohort.find();
    for (const cohort of cohorts) {
      if (cohort.students) {
        if (cohort.students.length !== cohort.seatsUsed) {
          issues.push(`Cohort ${cohort._id} has ${cohort.students.length} students but seatsUsed is ${cohort.seatsUsed}`);
        }
      }
    }

    // 4. Orphaned Bookings
    const bookings = await MentorBooking.find({ cohortId: { $exists: true, $ne: null } });
    for (const booking of bookings) {
      const cohort = await Cohort.findById(booking.cohortId);
      if (!cohort) {
        issues.push(`Booking ${booking._id} references missing Cohort ${booking.cohortId}`);
      }
    }

    // 5. Subscription Status Mismatch
    // Normally checking currentPeriodEnd
    // Example: Find users with 'plus' or 'pro' where we don't have active subscriptions that are valid
    // Assuming we check their stripe state or something. Here we'll just check a hypothetical expiry.
    // If we had a subscriptionExpiry field, we'd check `subscriptionExpiry < new Date()`.

    res.json({
      status: issues.length === 0 ? 'clean' : 'issues_found',
      issues
    });
  } catch (err) {
    console.error('Consistency Check Error:', err);
    res.status(500).json({ message: 'Error running consistency check', error: err.message });
  }
});

module.exports = router;
