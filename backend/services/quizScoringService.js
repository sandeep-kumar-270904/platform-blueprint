const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const gamificationService = require('./gamificationService');

async function submitQuizAttempt({ attemptId, submittedAnswers, io, timezone }) {
  // 1. Load the QuizAttempt
  const attempt = await QuizAttempt.findById(attemptId);
  if (!attempt) throw new Error('Attempt not found');
  
  // Idempotency: if already completed, just return the attempt
  if (attempt.status === 'completed') return { attempt };

  // We rely on attempt.answers for grading to protect against mid-attempt edits/deletions.
  // We still try to fetch the quiz to get the duration.
  const quiz = await Quiz.findById(attempt.quiz);
  const durationMinutes = quiz ? quiz.durationMinutes : 60;

  // Check if time expired (with 10s grace period)
  const now = new Date();
  const allowedTimeMs = durationMinutes * 60 * 1000 + 10000;
  if (now.getTime() - attempt.startedAt.getTime() > allowedTimeMs) {
    attempt.status = 'abandoned';
    attempt.completedAt = now;
    await attempt.save();
    return attempt; // Return gracefully so frontend can show "Time Expired" state
  }

  // 2. Score the answers based on SNAPSHOT
  let score = 0;
  let totalPossibleScore = 0;
  const processedAnswers = [];

  attempt.answers.forEach((ansSnapshot, index) => {
    const qSnapshot = ansSnapshot.questionSnapshot;
    const points = qSnapshot.points || 1;
    totalPossibleScore += points;

    const submitted = submittedAnswers.find(a => a.questionIndex === index);
    const selectedOptionIndex = submitted ? submitted.selectedOptionIndex : -1;
    
    // Bounds validation for selectedOptionIndex
    const isValidOption = selectedOptionIndex >= 0 && selectedOptionIndex < qSnapshot.options.length;
    const finalSelectedOption = isValidOption ? selectedOptionIndex : -1;
    const isCorrect = finalSelectedOption === qSnapshot.correctIndex;

    if (isCorrect) {
      score += points;
    }

    processedAnswers.push({
      questionIndex: index,
      selectedOptionIndex: finalSelectedOption,
      isCorrect,
      timeTakenSeconds: submitted ? submitted.timeTakenSeconds : 0,
      questionSnapshot: qSnapshot // Keep the snapshot!
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
  let oldTopAttempts = [];
  if (quiz) {
    oldTopAttempts = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed' } },
      { $sort: { percentageScore: -1, completedAt: 1 } },
      { $group: { _id: "$user", bestScore: { $first: "$percentageScore" }, attemptId: { $first: "$_id" } } },
      { $sort: { bestScore: -1 } },
      { $limit: 10 }
    ]);
  }
  const oldRanks = oldTopAttempts.map((t, idx) => ({ userId: t._id.toString(), rank: idx + 1, score: t.bestScore }));

  // 6. Save attempt
  await attempt.save();

  // 7. Query Top 10 AFTER saving
  let newTopAttempts = [];
  if (quiz) {
    newTopAttempts = await QuizAttempt.aggregate([
      { $match: { quiz: quiz._id, status: 'completed' } },
      { $sort: { percentageScore: -1, completedAt: 1 } },
      { $group: { _id: "$user", bestScore: { $first: "$percentageScore" }, attemptId: { $first: "$_id" } } },
      { $sort: { bestScore: -1 } },
      { $limit: 10 }
    ]);
  }
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
  const gamificationResult = await gamificationService.processQuizCompletion(attempt.user, attempt._id, io, timezone || 'UTC');

  if (io) {
    io.to(`user:${attempt.user}`).emit('quiz_dashboard_updated', { reason: 'quiz_completed' });
  }

  // 11. Syllabus Progress Tracking
  if (quiz.syllabusId) {
    const SyllabusProgress = require('../models/SyllabusProgress');
    let progress = await SyllabusProgress.findOne({ userId: attempt.user, subjectId: quiz.syllabusId });
    if (!progress) {
      progress = new SyllabusProgress({ userId: attempt.user, subjectId: quiz.syllabusId, topicCoverage: [] });
    }
    
    // We need to count correct answers per topic in this attempt
    const topicStats = {};
    processedAnswers.forEach(ans => {
      // Find the question to get its topic
      let topic = null;
      if (quiz.sections && quiz.sections.length > 0) {
        // Sections mode not fully supported in this flat answers array without section lookup, 
        // assuming standard mode for topic tracking in this MVP or flat questions.
        // For standard questions:
        if (quiz.questions[ans.questionIndex]) {
          topic = quiz.questions[ans.questionIndex].topicName;
        }
      } else {
        if (quiz.questions[ans.questionIndex]) {
          topic = quiz.questions[ans.questionIndex].topicName;
        }
      }
      
      if (topic) {
        if (!topicStats[topic]) topicStats[topic] = { attempts: 0, correct: 0 };
        topicStats[topic].attempts += 1;
        if (ans.isCorrect) topicStats[topic].correct += 1;
      }
    });

    Object.keys(topicStats).forEach(topic => {
      let tc = progress.topicCoverage.find((t) => t.topicName === topic);
      if (!tc) {
        tc = { topicName: topic, questionsAttempted: 0, correctCount: 0 };
        progress.topicCoverage.push(tc);
      }
      tc.questionsAttempted += topicStats[topic].attempts;
      tc.correctCount += topicStats[topic].correct;
    });

    await progress.save();
  }

  // 12. Return attempt
  return { attempt, gamificationResult };
}

module.exports = {
  submitQuizAttempt
};
