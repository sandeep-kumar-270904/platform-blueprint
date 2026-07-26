
const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

/**
 * Get all skills a user has verified by scoring above 80% on corresponding quizzes.
 */
async function getUserVerifiedSkills(userId) {
  const attempts = await QuizAttempt.find({ user: userId, status: 'completed', percentageScore: { $gte: 80 } }).populate('quiz', 'category tags');
  const skills = new Set();
  
  attempts.forEach(a => {
    if (a.quiz) {
       skills.add(a.quiz.category);
       if (a.quiz.tags) {
           a.quiz.tags.forEach(t => skills.add(t));
       }
    }
  });
  
  return Array.from(skills);
}

/**
 * Get the percentile ranking of a user across all users in the system based on average quiz score.
 */
async function getUserPercentile(userId) {
   const allScores = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$user', avgScore: { $avg: '$percentageScore' } } },
      { $sort: { avgScore: 1 } }
   ]);
   
   if (allScores.length === 0) return 0;
   
   const userIndex = allScores.findIndex(s => s._id.toString() === userId.toString());
   if (userIndex === -1) return 0;
   
   return ((userIndex) / allScores.length) * 100;
}

module.exports = {
  getUserVerifiedSkills,
  getUserPercentile
};
