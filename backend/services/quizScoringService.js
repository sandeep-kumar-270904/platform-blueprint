const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const gamificationService = require('./gamificationService');

async function submitQuizAttempt({ attemptId, submittedAnswers, io }) {
  // 1. Load the QuizAttempt and its parent Quiz (with correctOptionIndex)
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status === 'completed') throw new Error('Attempt already completed');

  const quiz = await Quiz.findById(attempt.quiz);
  if (!quiz) throw new Error('Quiz not found');

  // Check if time expired (with 10s grace period)
  const now = new Date();
  const allowedTimeMs = quiz.durationMinutes * 60 * 1000 + 10000;
  if (now.getTime() - attempt.startedAt.getTime() > allowedTimeMs) {
    attempt.status = 'abandoned';
    attempt.completedAt = now;
    await attempt.save();
    throw new Error('Time expired. Attempt marked as abandoned.');
  }

  // 2. Score the answers
  let score = 0;
  let totalPossibleScore = 0;
  const processedAnswers = [];

  quiz.questions.forEach((question, index) => {
    const points = question.points || 1;
    totalPossibleScore += points;

    const submitted = submittedAnswers.find(a => a.questionIndex === index);
    const selectedOptionIndex = submitted ? submitted.selectedOptionIndex : -1;
    const isCorrect = selectedOptionIndex === question.correctOptionIndex;

    if (isCorrect) {
      score += points;
    }

    processedAnswers.push({
      questionIndex: index,
      selectedOptionIndex,
      isCorrect,
      timeTakenSeconds: submitted ? submitted.timeTakenSeconds : 0
    });
  });

  // 3 & 4. Update attempt
  attempt.answers = processedAnswers;
  attempt.score = score;
  attempt.totalPossibleScore = totalPossibleScore;
  attempt.percentageScore = totalPossibleScore > 0 ? (score / totalPossibleScore) * 100 : 0;
  attempt.status = 'completed';
  attempt.completedAt = now;

  // 5. Query Top 10 BEFORE saving new attempt to compare later
  const oldTopAttempts = await QuizAttempt.aggregate([
    { $match: { quiz: quiz._id, status: 'completed' } },
    { $sort: { percentageScore: -1, completedAt: 1 } },
    { $group: { _id: "$user", bestScore: { $first: "$percentageScore" }, attemptId: { $first: "$_id" } } },
    { $sort: { bestScore: -1 } },
    { $limit: 10 }
  ]);
  const oldRanks = oldTopAttempts.map((t, idx) => ({ userId: t._id.toString(), rank: idx + 1, score: t.bestScore }));

  // 6. Save attempt
  await attempt.save();

  // 7. Query Top 10 AFTER saving
  const newTopAttempts = await QuizAttempt.aggregate([
    { $match: { quiz: quiz._id, status: 'completed' } },
    { $sort: { percentageScore: -1, completedAt: 1 } },
    { $group: { _id: "$user", bestScore: { $first: "$percentageScore" }, attemptId: { $first: "$_id" } } },
    { $sort: { bestScore: -1 } },
    { $limit: 10 }
  ]);
  const newRanks = newTopAttempts.map((t, idx) => ({ userId: t._id.toString(), rank: idx + 1, score: t.bestScore }));

  // 8. Find overtaken users
  const notificationService = require('./notificationService');
  for (const oldRank of oldRanks) {
    if (oldRank.userId === attempt.user.toString()) continue; // don't notify the person who just played
    const newRank = newRanks.find(r => r.userId === oldRank.userId);
    // If they dropped out of top 10, or their rank increased numerically (dropped in placement)
    if (!newRank || newRank.rank > oldRank.rank) {
      // Trigger notification
      await notificationService.createNotification({
        userId: oldRank.userId,
        type: 'leaderboard_overtaken',
        relatedQuiz: quiz._id,
        message: `Someone just beat your high score on "${quiz.title}"! You were bumped down the leaderboard.`,
        actionUrl: `/quizzes/${quiz._id}`,
        channel: 'both',
        emailData: {
          quizTitle: quiz.title
        }
      });
    }
  }

  // 9. Update parent Quiz stats
  const oldCount = quiz.attemptCount || 0;
  const oldAvg = quiz.averageScore || 0;
  
  quiz.averageScore = ((oldAvg * oldCount) + attempt.percentageScore) / (oldCount + 1);
  quiz.attemptCount = oldCount + 1;
  await quiz.save();

  // 10. Process Gamification (Streaks, Points, Badges)
  // Note: io is not available here unless passed, but we can rely on standard notification for now, or just let Gamification handle db logic.
  // We don't have direct access to 'req.io' in the service without passing it, but we can pass null for io and badges will still be saved to the DB and emit standard notifications.
  await gamificationService.processQuizCompletion(attempt.user, attempt._id, io);

  if (io) {
    io.to(`user:${attempt.user}`).emit('quiz_dashboard_updated', { reason: 'quiz_completed' });
  }

  // 11. Return attempt
  return attempt;
}

module.exports = {
  submitQuizAttempt
};
