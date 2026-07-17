const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const notificationService = require('./notificationService');

const BADGE_DEFINITIONS = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first quiz attempt.', icon: '🎯' },
  { id: 'on_fire', name: 'On Fire', description: 'Reach a 3-day quiz streak.', icon: '🔥' },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Reach a 7-day quiz streak.', icon: '⚡' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Score 100% on any quiz with 5+ questions.', icon: '👑' },
  { id: 'quiz_master', name: 'Quiz Master', description: 'Create a quiz that reaches 50+ attempts.', icon: '🎓' },
  { id: 'live_wire', name: 'Live Wire', description: 'Participate in 5 live sessions.', icon: '📻' },
];

class GamificationService {
  /**
   * Process a completed quiz attempt for a user to update streaks, points, and unlock badges.
   */
  async processQuizCompletion(userId, attemptId, io) {
    try {
      const user = await User.findById(userId);
      const attempt = await QuizAttempt.findById(attemptId).populate('quiz');
      
      if (!user || !attempt || attempt.status !== 'completed') return;

      const now = new Date(attempt.completedAt || Date.now());
      let newBadgesUnlocked = [];
      let isStreakUpdated = false;

      // --- 1. Streak Logic ---
      const lastActive = user.quizStreak?.lastActivityDate;
      const todayString = now.toISOString().split('T')[0];
      const lastActiveString = lastActive ? new Date(lastActive).toISOString().split('T')[0] : null;

      if (!lastActiveString) {
        // First ever activity
        user.quizStreak = { current: 1, longest: 1, lastActivityDate: now };
        isStreakUpdated = true;
      } else if (lastActiveString !== todayString) {
        // Check if last active was yesterday
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (lastActiveString === yesterdayString) {
          // Continuous streak
          user.quizStreak.current += 1;
        } else {
          // Streak broken
          user.quizStreak.current = 1;
        }
        
        if (user.quizStreak.current > user.quizStreak.longest) {
          user.quizStreak.longest = user.quizStreak.current;
        }
        user.quizStreak.lastActivityDate = now;
        isStreakUpdated = true;
      }

      // --- 2. Points Logic ---
      // We use raw score. If score is 0, they still get 0 points but streak increments.
      user.totalQuizPoints = (user.totalQuizPoints || 0) + attempt.score;

      // --- 3. Badge Evaluation ---
      const hasBadge = (badgeId) => user.badges && user.badges.some(b => b.badgeId === badgeId);

      const unlockBadge = async (badgeDef) => {
        user.badges.push({ badgeId: badgeDef.id, earnedAt: new Date() });
        newBadgesUnlocked.push(badgeDef);
        
        // Push notification
        await notificationService.createNotification({
          userId: user._id,
          type: 'badge_earned',
          relatedContentId: user._id,
          message: `You earned a new badge: ${badgeDef.name}! ${badgeDef.icon}`,
          channel: 'both' // Or whatever matches preferences
        });

        // Socket emission for real-time toast
        if (io) {
          io.to(`user:${user._id}`).emit('badgeEarned', badgeDef);
        }
      };

      // Badge: First Steps
      if (!hasBadge('first_steps')) {
        const totalAttempts = await QuizAttempt.countDocuments({ user: user._id, status: 'completed' });
        if (totalAttempts >= 1) {
          await unlockBadge(BADGE_DEFINITIONS.find(b => b.id === 'first_steps'));
        }
      }

      // Badge: On Fire
      if (!hasBadge('on_fire') && user.quizStreak.current >= 3) {
        await unlockBadge(BADGE_DEFINITIONS.find(b => b.id === 'on_fire'));
      }

      // Badge: Unstoppable
      if (!hasBadge('unstoppable') && user.quizStreak.current >= 7) {
        await unlockBadge(BADGE_DEFINITIONS.find(b => b.id === 'unstoppable'));
      }

      // Badge: Perfectionist
      if (!hasBadge('perfectionist')) {
        const qCount = attempt.quiz.questions ? attempt.quiz.questions.length : 0;
        if (qCount >= 5 && attempt.percentageScore === 100) {
          await unlockBadge(BADGE_DEFINITIONS.find(b => b.id === 'perfectionist'));
        }
      }

      // Badge: Live Wire
      if (!hasBadge('live_wire')) {
        const liveCount = await QuizAttempt.countDocuments({ 
          user: user._id, 
          status: 'completed',
          sourceLiveSession: { $exists: true, $ne: null }
        });
        if (liveCount >= 5) {
          await unlockBadge(BADGE_DEFINITIONS.find(b => b.id === 'live_wire'));
        }
      }

      await user.save();

      // --- 4. Evaluate Quiz Master for the QUIZ CREATOR ---
      // This attempt might push the creator's quiz over 50 attempts
      const creatorId = attempt.quiz.createdBy;
      if (creatorId.toString() !== user._id.toString()) {
        const creator = await User.findById(creatorId);
        if (creator && (!creator.badges || !creator.badges.some(b => b.badgeId === 'quiz_master'))) {
          // Check if ANY of their quizzes has >= 50 attempts (excluding their own attempts maybe? 
          // The quiz's attemptCount includes all attempts. We can just check attemptCount >= 50 for simplicity, 
          // or run an aggregation to count distinct users). Let's use `attemptCount` >= 50.
          const topQuiz = await Quiz.findOne({ createdBy: creator._id, attemptCount: { $gte: 50 } });
          if (topQuiz) {
            creator.badges.push({ badgeId: 'quiz_master', earnedAt: new Date() });
            await creator.save();
            await notificationService.createNotification({
              userId: creator._id,
              type: 'badge_earned',
              relatedContentId: creator._id,
              message: `You earned a new badge: Quiz Master! 🎓 Your quiz reached 50 attempts.`,
              channel: 'both'
            });
            if (io) {
              io.to(`user:${creator._id}`).emit('badgeEarned', BADGE_DEFINITIONS.find(b => b.id === 'quiz_master'));
            }
          }
        }
      }

      if (io) {
        io.to(`user:${user._id}`).emit('quizStatsUpdated', {
          totalPoints: user.totalQuizPoints,
          currentStreak: user.quizStreak.current,
          longestStreak: user.quizStreak.longest
        });
      }

      return {
        pointsEarned: attempt.score,
        newStreak: user.quizStreak.current,
        isStreakUpdated,
        newBadges: newBadgesUnlocked
      };

    } catch (err) {
      console.error('Error in GamificationService.processQuizCompletion:', err);
    }
  }
}

module.exports = new GamificationService();
