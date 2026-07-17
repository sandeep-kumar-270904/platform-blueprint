const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LiveSession = require('../models/LiveSession');
const QuizReport = require('../models/QuizReport');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Middleware to enforce admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.use(authMiddleware, requireAdmin);

// GET /api/admin/quizzes-overview
router.get('/', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Quizzes
    const [
      publishedQuizzes, draftQuizzes, closedQuizzes, underReviewQuizzes,
      recentQuizzes, soloQuizzes, liveQuizzes
    ] = await Promise.all([
      Quiz.countDocuments({ status: 'published' }),
      Quiz.countDocuments({ status: 'draft' }),
      Quiz.countDocuments({ status: 'closed' }),
      Quiz.countDocuments({ status: 'under_review' }),
      Quiz.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Quiz.countDocuments({ mode: 'solo' }),
      Quiz.countDocuments({ mode: 'live' })
    ]);

    // 2. Attempts
    const [totalAttempts, completedAttempts, abandonedAttempts, recentAttempts] = await Promise.all([
      QuizAttempt.countDocuments(),
      QuizAttempt.countDocuments({ status: 'completed' }),
      QuizAttempt.countDocuments({ status: 'abandoned' }),
      QuizAttempt.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    ]);

    // 3. Live Sessions
    const [scheduledSessions, inProgressSessions, recentCompletedSessions] = await Promise.all([
      LiveSession.countDocuments({ status: 'scheduled' }),
      LiveSession.countDocuments({ status: 'in_progress' }),
      LiveSession.countDocuments({ status: 'completed', completedAt: { $gte: sevenDaysAgo } })
    ]);

    const liveSessionsAvgParticipantsAgg = await LiveSession.aggregate([
      { $match: { status: 'completed' } },
      { $project: { numParticipants: { $size: "$participants" } } },
      { $group: { _id: null, avgParticipants: { $avg: "$numParticipants" } } }
    ]);
    const avgParticipantsPerSession = liveSessionsAvgParticipantsAgg.length > 0 ? liveSessionsAvgParticipantsAgg[0].avgParticipants : 0;

    // 4. Moderation
    const [pendingReports, activeUnderReview] = await Promise.all([
      QuizReport.countDocuments({ status: 'pending' }),
      Quiz.countDocuments({ status: 'under_review' }) // Duplicate but good for logical grouping
    ]);

    // 5. Notifications
    const [recentQuizNotifications, emailFailures] = await Promise.all([
      Notification.countDocuments({ 
        createdAt: { $gte: sevenDaysAgo },
        type: { $in: ['live_session_reminder', 'live_session_invite', 'live_session_results', 'leaderboard_overtaken', 'quiz_reported', 'quiz_deleted', 'badge_earned'] }
      }),
      Notification.countDocuments({
        channel: { $in: ['email', 'both'] },
        emailSent: false,
        emailFailureReason: { $exists: true, $ne: null }
      })
    ]);

    // 6. Engagement
    const activeStreaksCount = await User.countDocuments({ 'quizStreak.current': { $gt: 0 } });
    
    const engagementAgg = await User.aggregate([
      { $project: {
          numBadges: { $size: { $ifNull: ["$badges", []] } },
          numSubscriptions: { $size: { $ifNull: ["$subscribedQuizzes", []] } }
      }},
      { $group: {
          _id: null,
          totalBadges: { $sum: "$numBadges" },
          totalSubscriptions: { $sum: "$numSubscriptions" }
      }}
    ]);
    const totalBadgesAwarded = engagementAgg.length > 0 ? engagementAgg[0].totalBadges : 0;
    const totalActiveSubscriptions = engagementAgg.length > 0 ? engagementAgg[0].totalSubscriptions : 0;

    // 7. Top Content
    const topAttemptedQuizzes = await Quiz.find({ status: { $ne: 'under_review' } })
      .sort({ attemptCount: -1 })
      .limit(5)
      .select('title attemptCount mode');

    const highestRatedQuizzes = await Quiz.find({ status: { $ne: 'under_review' }, attemptCount: { $gte: 5 } })
      .sort({ averageScore: -1 })
      .limit(5)
      .select('title averageScore attemptCount mode');

    res.json({
      quizzes: {
        published: publishedQuizzes,
        draft: draftQuizzes,
        closed: closedQuizzes,
        underReview: underReviewQuizzes,
        recent: recentQuizzes,
        solo: soloQuizzes,
        live: liveQuizzes
      },
      attempts: {
        total: totalAttempts,
        completed: completedAttempts,
        abandoned: abandonedAttempts,
        recent: recentAttempts
      },
      liveSessions: {
        scheduled: scheduledSessions,
        inProgress: inProgressSessions,
        recentCompleted: recentCompletedSessions,
        avgParticipants: Math.round(avgParticipantsPerSession * 10) / 10
      },
      moderation: {
        pendingReports,
        underReview: activeUnderReview
      },
      notifications: {
        recentActivity: recentQuizNotifications,
        emailFailures
      },
      engagement: {
        activeStreaks: activeStreaksCount,
        totalBadges: totalBadgesAwarded,
        totalSubscriptions: totalActiveSubscriptions
      },
      topContent: {
        mostAttempted: topAttemptedQuizzes,
        highestRated: highestRatedQuizzes
      }
    });

  } catch (error) {
    console.error('Error fetching admin quizzes overview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/admin/quizzes-overview/consistency-check
router.get('/consistency-check', async (req, res) => {
  try {
    const issues = [];

    // 1. Attempt Sync Drift
    // Aggregate completed attempts per quiz and compare with Quiz.attemptCount
    const actualAttemptsAgg = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$quiz", actualCount: { $sum: 1 } } }
    ]);
    
    // We can fetch quizzes that are in the aggregation to check their attemptCount
    const actualAttemptsMap = new Map(actualAttemptsAgg.map(a => [a._id.toString(), a.actualCount]));
    const allQuizzes = await Quiz.find().select('title attemptCount');
    
    for (const quiz of allQuizzes) {
      const actual = actualAttemptsMap.get(quiz._id.toString()) || 0;
      if (quiz.attemptCount !== actual) {
        issues.push({
          type: 'attempt_sync_drift',
          message: `Quiz "${quiz.title}" attemptCount is ${quiz.attemptCount}, but actual completed attempts count is ${actual}.`,
          quizId: quiz._id
        });
      }
    }

    // 2. Stuck Live Sessions
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stuckSessions = await LiveSession.find({
      status: 'in_progress',
      questionStartedAt: { $lt: sixHoursAgo }
    }).select('joinCode questionStartedAt');

    for (const session of stuckSessions) {
      issues.push({
        type: 'stuck_live_session',
        message: `Live session ${session.joinCode} has been in_progress for over 6 hours.`,
        sessionId: session._id
      });
    }

    // 3. Ghost Badges (Quiz Master without 50 attempts)
    const usersWithQuizMaster = await User.find({ 'badges.badgeId': 'quiz_master' }).select('username');
    for (const user of usersWithQuizMaster) {
      const topQuiz = await Quiz.findOne({ createdBy: user._id, attemptCount: { $gte: 50 } });
      if (!topQuiz) {
        issues.push({
          type: 'ghost_badge',
          message: `User ${user.username} has quiz_master badge but no quiz with 50+ attempts.`,
          userId: user._id
        });
      }
    }

    // 4. Silent Email Failures
    const silentEmailFailures = await Notification.find({
      channel: { $in: ['email', 'both'] },
      emailSent: false,
      emailFailureReason: { $exists: false } // or null
    }).select('type createdAt');

    for (const failure of silentEmailFailures) {
      if (!failure.emailFailureReason) {
        issues.push({
          type: 'silent_email_failure',
          message: `Notification ${failure._id} (type: ${failure.type}) is marked for email but failed silently without a reason.`,
          notificationId: failure._id
        });
      }
    }

    res.json({ issues, totalIssues: issues.length });
  } catch (error) {
    console.error('Error running consistency check:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
