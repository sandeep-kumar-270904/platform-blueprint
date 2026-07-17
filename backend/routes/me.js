const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const LiveSession = require('../models/LiveSession');
const QuestionBankItem = require('../models/QuestionBankItem');

// GET /api/me/quiz-dashboard
router.get('/quiz-dashboard', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // We will do Promise.all for performance
    const [
      attempts,
      userDoc,
      upcomingSessions,
      createdQuizzes,
      bankItemsCount,
      mostUsedBankItem
    ] = await Promise.all([
      // 1. All attempts
      QuizAttempt.find({ user: userId })
        .populate('quiz', 'title category')
        .sort({ startedAt: -1 })
        .lean(),
      
      // 2. User doc (for stats, badges, subscriptions)
      User.findById(userId).populate({
        path: 'subscribedQuizzes',
        match: { status: 'published' },
        select: 'title category attemptCount averageScore thumbnail'
      }).lean(),

      // 3. Upcoming live sessions
      LiveSession.find({
        $or: [
          { 'participants.user': userId },
          // We also need sessions for subscribed quizzes. That will be checked after fetching user.
        ],
        status: 'scheduled',
        scheduledStartAt: { $gt: new Date() }
      }).populate('quiz', 'title category').sort({ scheduledStartAt: 1 }).lean(),

      // 4. Created quizzes stats
      Quiz.find({ createdBy: userId }).select('_id attemptCount completionRate').lean(),

      // 5. Question bank count
      QuestionBankItem.countDocuments({ user: userId }),

      // 6. Most used question bank item
      QuestionBankItem.findOne({ user: userId }).sort({ usageCount: -1 }).lean()
    ]);

    // We need to fetch upcoming sessions for subscribed quizzes if not already included
    // A live session is for a quiz. If a user is subscribed to a quiz, they should see its upcoming sessions.
    const subscribedQuizIds = userDoc.subscribedQuizzes ? userDoc.subscribedQuizzes.map(q => q._id) : [];
    const extraUpcomingSessions = await LiveSession.find({
      quiz: { $in: subscribedQuizIds },
      status: 'scheduled',
      scheduledStartAt: { $gt: new Date() },
      'participants.user': { $ne: userId } // avoid duplicates
    }).populate('quiz', 'title').sort({ scheduledStartAt: 1 }).lean();

    const allUpcomingSessions = [...upcomingSessions, ...extraUpcomingSessions]
      .sort((a, b) => new Date(a.scheduledStartAt) - new Date(b.scheduledStartAt));

    // Summary counts
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.status === 'completed').length;
    const abandonedAttempts = attempts.filter(a => a.status === 'abandoned').length;

    // Badges & Stats

    // Created content summary
    const createdQuizzesCount = createdQuizzes.length;
    const totalCreatedAttempts = createdQuizzes.reduce((sum, q) => sum + (q.attemptCount || 0), 0);
    const bestQuiz = createdQuizzes.sort((a, b) => (b.completionRate || 0) - (a.completionRate || 0))[0];

    // Leaderboard Rank
    // Find rank by counting how many users have strictly more totalPoints, plus 1.
    const higherRankCount = await User.countDocuments({ 'totalQuizPoints': { $gt: userDoc.totalQuizPoints || 0 } });
    const globalRank = higherRankCount + 1;

    // Recent 10 attempts
    const recentActivity = attempts.slice(0, 10).map(a => ({
      _id: a._id,
      quizTitle: a.quiz ? a.quiz.title : 'Unknown Quiz',
      quizId: a.quiz ? a.quiz._id : null,
      score: a.percentageScore,
      date: a.startedAt,
      status: a.status,
      isLive: !!a.sourceLiveSession
    }));

    res.json({
      summary: {
        totalAttempts,
        completedAttempts,
        abandonedAttempts,
        currentStreak: userDoc.quizStreak?.current || 0,
        longestStreak: userDoc.quizStreak?.longest || 0,
        totalPoints: userDoc.totalQuizPoints || 0,
        globalRank: globalRank
      },
      recentActivity,
      badges: userDoc.badges || [],
      upcomingSessions: allUpcomingSessions,
      createdContent: {
        count: createdQuizzesCount,
        totalAttempts: totalCreatedAttempts,
        bestQuizId: bestQuiz ? bestQuiz._id : null
      },
      questionBank: {
        count: bankItemsCount,
        mostUsed: mostUsedBankItem ? {
          questionText: mostUsedBankItem.questionText,
          usageCount: mostUsedBankItem.usageCount
        } : null
      },
      subscriptions: userDoc.subscribedQuizzes || []
    });

  } catch (error) {
    console.error('Error fetching quiz dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
