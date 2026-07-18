require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const ClassRoster = require('../models/ClassRoster');
const QuizTournament = require('../models/QuizTournament');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB for Phase 8 Verification.');

  try {
    // 1. Verify indexes
    const quizIndexes = await Quiz.collection.getIndexes();
    console.log('Quiz Indexes:', Object.keys(quizIndexes));
    if (!quizIndexes['classId_1']) throw new Error('classId index missing on Quiz');

    const qaIndexes = await QuizAttempt.collection.getIndexes();
    console.log('QuizAttempt Indexes:', Object.keys(qaIndexes));
    if (!qaIndexes['quiz_1_status_1_percentageScore_-1_completedAt_1']) throw new Error('Leaderboard optimization index missing on QuizAttempt');

    // 2. Check Teacher boundary data structures exist
    console.log('Checking Teacher Boundary data structure (classId on QuizAttempt)');
    const schemaPaths = Object.keys(QuizAttempt.schema.paths);
    if (!schemaPaths.includes('classId')) throw new Error('classId missing from QuizAttempt schema');

    console.log('All tests passed! Quiz Phase 8 is ready for closure.');
  } catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

run();
