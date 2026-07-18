const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const QuestionBank = require('../models/QuestionBank');
const mongoose = require('mongoose');

const THRESHOLD = 20;

async function calibrateDifficulty() {
  console.log('Starting Quiz Difficulty Calibration Job...');
  try {
    // 1. Find all completed attempts
    const correctRates = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: "$answers" },
      { $group: {
          _id: {
            quizId: "$quiz",
            questionIndex: "$answers.questionIndex",
            bankQuestionId: "$answers.questionSnapshot.bankQuestionId"
          },
          totalAnswers: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } }
      }}
    ]);

    const bankUpdates = new Map(); // bankQuestionId -> { total: 0, correct: 0 }

    for (const rate of correctRates) {
      if (rate.totalAnswers >= THRESHOLD) {
        const correctPercentage = rate.correctAnswers / rate.totalAnswers;
        let newDifficulty = 'medium';
        if (correctPercentage > 0.8) newDifficulty = 'easy';
        else if (correctPercentage < 0.4) newDifficulty = 'hard';

        // Update Quiz
        await Quiz.updateOne(
          { _id: rate._id.quizId },
          { $set: { [`questions.${rate._id.questionIndex}.calibratedDifficulty`]: newDifficulty } }
        );

        // Aggregate for Bank Question if applicable
        if (rate._id.bankQuestionId) {
          const bId = rate._id.bankQuestionId.toString();
          if (!bankUpdates.has(bId)) {
            bankUpdates.set(bId, { total: 0, correct: 0 });
          }
          const curr = bankUpdates.get(bId);
          curr.total += rate.totalAnswers;
          curr.correct += rate.correctAnswers;
        }
      }
    }

    // Update QuestionBank questions
    for (const [bankQuestionId, stats] of bankUpdates.entries()) {
      if (stats.total >= THRESHOLD) {
        const correctPercentage = stats.correct / stats.total;
        let newDifficulty = 'medium';
        if (correctPercentage > 0.8) newDifficulty = 'easy';
        else if (correctPercentage < 0.4) newDifficulty = 'hard';

        // Update QuestionBank
        await QuestionBank.updateOne(
          { "questions._id": new mongoose.Types.ObjectId(bankQuestionId) },
          { $set: { "questions.$.calibratedDifficulty": newDifficulty } }
        );
      }
    }

    console.log('Calibration Job Completed Successfully.');
  } catch (error) {
    console.error('Calibration Job Failed:', error);
  }
}

module.exports = calibrateDifficulty;
