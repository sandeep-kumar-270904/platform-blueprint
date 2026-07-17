const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Quiz = require('./models/Quiz');
const QuizReport = require('./models/QuizReport');
const LiveSession = require('./models/LiveSession');
const QuizAttempt = require('./models/QuizAttempt');
const Notification = require('./models/Notification');
const notificationService = require('./services/notificationService');
const cronService = require('./services/cronService');
const quizScoringService = require('./services/quizScoringService');

async function runVerification() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const creator = await User.findOneAndUpdate(
    { email: 'creator@test.com' },
    { username: 'creator', password: 'pw', full_name: 'Creator Test' },
    { upsert: true, new: true }
  );
  const player1 = await User.findOneAndUpdate(
    { email: 'player1@test.com' },
    { username: 'player1', password: 'pw', full_name: 'Player One' },
    { upsert: true, new: true }
  );
  const player2 = await User.findOneAndUpdate(
    { email: 'player2@test.com' },
    { username: 'player2', password: 'pw', full_name: 'Player Two' },
    { upsert: true, new: true }
  );

  await Notification.deleteMany({ userId: { $in: [creator._id, player1._id, player2._id] } });

  const quiz = await Quiz.create({
    title: 'Phase 3 Verification Quiz',
    description: 'Testing notifications',
    category: 'Testing',
    createdBy: creator._id,
    mode: 'live',
    difficulty: 'easy',
    durationMinutes: 10,
    status: 'published',
    questions: [
      { questionText: 'Q1?', options: ['A', 'B'], points: 10, correctOptionIndex: 0 }
    ]
  });
  console.log('Quiz created:', quiz._id);

  player1.subscribedQuizzes = [quiz._id];
  await player1.save();
  console.log('Player1 subscribed');

  console.log('Testing quiz_reported...');
  await notificationService.createNotification({
    userId: creator._id,
    type: 'quiz_reported',
    relatedQuiz: quiz._id,
    message: "Your quiz is under review.",
    channel: 'both',
    emailData: { quizTitle: quiz.title }
  });

  console.log('Testing LiveSession Reminder via CRON...');
  const in5Mins = new Date(Date.now() + 5 * 60 * 1000);
  const session = await LiveSession.create({
    quiz: quiz._id,
    hostedBy: creator._id,
    scheduledStartAt: in5Mins,
    status: 'scheduled',
    joinCode: 'P3TST',
    participants: [
      { user: player2._id, status: 'waiting' }
    ]
  });
  await cronService.checkLiveSessionReminders();
  
  const reminders = await Notification.find({ type: 'live_session_reminder' });
  console.log(`Found ${reminders.length} live_session_reminder notifications (expected 2)`);

  console.log('Testing LiveSession Invite...');
  await notificationService.createNotification({
    userId: player1._id,
    type: 'live_session_invite',
    relatedQuiz: quiz._id,
    relatedLiveSession: session._id,
    message: "You are invited to quiz",
    channel: 'both',
    emailData: { quizTitle: quiz.title, inviterName: creator.username, joinCode: session.joinCode }
  });
  
  console.log('Testing Leaderboard Overtaken...');
  await QuizAttempt.create({
    quiz: quiz._id,
    user: player1._id,
    status: 'completed',
    score: 5,
    percentageScore: 50,
    startedAt: new Date(),
    completedAt: new Date()
  });
  
  const attempt = new QuizAttempt({
    quiz: quiz._id,
    user: player2._id,
    status: 'in_progress',
    score: 10,
    percentageScore: 100,
    startedAt: new Date()
  });
  await quizScoringService.submitQuizAttempt(quiz._id, attempt);

  const overtaken = await Notification.find({ type: 'leaderboard_overtaken' });
  console.log(`Found ${overtaken.length} leaderboard_overtaken notifications (expected 1 for player1)`);

  console.log('\n--- VERIFICATION COMPLETE ---');
  await mongoose.disconnect();
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
