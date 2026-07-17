const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../backend/models/User');
const Quiz = require('../backend/models/Quiz');
const QuizAttempt = require('../backend/models/QuizAttempt');
const gamificationService = require('../backend/services/gamificationService');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  // Find or create test users
  let host = await User.findOne({ email: 'host@example.com' });
  if (!host) {
    host = await User.create({ username: 'host', email: 'host@example.com', full_name: 'Host User' });
  }

  let student = await User.findOne({ email: 'student@example.com' });
  if (!student) {
    student = await User.create({ username: 'student', email: 'student@example.com', full_name: 'Student User' });
  }

  // Ensure they have basic stats
  console.log('Student stats:', { streak: student.quizStreak, badges: student.badges, points: student.totalQuizPoints });

  // Create a quiz
  let quiz = await Quiz.findOne({ title: 'Test Analytics Quiz' });
  if (!quiz) {
    quiz = await Quiz.create({
      creator: host._id,
      title: 'Test Analytics Quiz',
      category: 'Programming',
      difficulty: 'Intermediate',
      questions: [
        { questionText: 'What is 1+1?', options: ['1', '2', '3', '4'], correctOptionIndex: 1, type: 'multiple-choice', points: 10 },
        { questionText: 'Is JS strongly typed?', options: ['Yes', 'No'], correctOptionIndex: 1, type: 'true-false', points: 10 }
      ]
    });
    console.log('Created quiz:', quiz._id);
  }

  // Process a solo attempt for gamification
  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    user: student._id,
    sessionType: 'solo',
    status: 'completed',
    score: 20,
    answers: [
      { questionId: quiz.questions[0]._id, selectedOptionIndex: 1, isCorrect: true, timeTaken: 5 },
      { questionId: quiz.questions[1]._id, selectedOptionIndex: 1, isCorrect: true, timeTaken: 5 }
    ]
  });

  console.log('Created attempt:', attempt._id);

  // Call gamification service manually
  const mockIo = {
    to: (room) => ({
      emit: (event, data) => console.log(`[Socket emit] to ${room}: ${event}`, data)
    })
  };

  await gamificationService.processQuizCompletion(student._id.toString(), quiz._id.toString(), 20, mockIo);

  // Fetch updated student
  const updatedStudent = await User.findById(student._id);
  console.log('Updated Student stats:', { 
    streak: updatedStudent.quizStreak, 
    badges: updatedStudent.badges, 
    points: updatedStudent.totalQuizPoints 
  });

  // Verify Leaderboard Logic (Aggregation)
  const leadersAgg = await QuizAttempt.aggregate([
    { $match: { status: 'completed' } },
    { $lookup: { from: 'quizzes', localField: 'quiz', foreignField: '_id', as: 'quizData' } },
    { $unwind: '$quizData' },
    { $match: { 'quizData.category': 'Programming' } },
    { $group: { _id: '$user', categoryPoints: { $sum: '$score' } } },
    { $sort: { categoryPoints: -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
    { $unwind: '$userInfo' },
    { $project: { _id: 1, points: '$categoryPoints', username: '$userInfo.username' } }
  ]);
  console.log('Leaderboard for Programming:', leadersAgg);

  // Verify Analytics Logic (Aggregation)
  const analyticsAgg = await QuizAttempt.aggregate([
    { $match: { quiz: quiz._id, status: 'completed' } },
    { $group: { _id: null, attemptCount: { $sum: 1 }, avgScore: { $avg: '$score' } } }
  ]);
  console.log('Analytics for Quiz:', analyticsAgg);

  mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
