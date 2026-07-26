
require('dotenv').config();
const mongoose = require('mongoose');
const QuizAttempt = require('../models/QuizAttempt');
const UserQuizArchive = require('../models/UserQuizArchive');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub');
  console.log('Connected to DB');

  // Archive attempts older than 12 months
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 12);

  const oldAttempts = await QuizAttempt.find({ completedAt: { $lt: cutoffDate }, status: 'completed' });
  console.log(`Found ${oldAttempts.length} old attempts to archive.`);

  for (let attempt of oldAttempts) {
     let archive = await UserQuizArchive.findOne({ user: attempt.user });
     if (!archive) {
        archive = new UserQuizArchive({ user: attempt.user, totalArchivedScore: 0, totalArchivedAttempts: 0 });
     }
     archive.totalArchivedScore += (attempt.percentageScore || 0);
     archive.totalArchivedAttempts += 1;
     await archive.save();
     
     // Delete raw attempt to save space
     await attempt.deleteOne();
  }

  console.log('Archival complete.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
