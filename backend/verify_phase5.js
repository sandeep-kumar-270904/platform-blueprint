require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const LiveSession = require('./models/LiveSession');
const Notification = require('./models/Notification');
const db = require('./db');

async function runVerification() {
  try {
    await db();
    console.log('--- Phase 5 Verification ---');

    // 1. Consistency check verification (drift)
    // Create a mismatch intentionally
    console.log('Forcing drift on a Quiz...');
    let hostUser = await User.findOne();
    if (!hostUser) {
      hostUser = await User.create({ username: 'testuser', email: 'test@example.com', password: 'password', full_name: 'Test User' });
    }
    
    let someQuiz = await Quiz.findOne();
    if (!someQuiz) {
      someQuiz = await Quiz.create({ 
        title: 'Test Quiz', 
        description: 'Test', 
        createdBy: hostUser._id, 
        mode: 'live',
        category: 'Technology',
        durationMinutes: 10,
        questions: [{ questionText: 'Test', options: ['A', 'B'], correctOptionIndex: 0 }] 
      });
    }
    if (someQuiz) {
      const originalCount = someQuiz.attemptCount;
      someQuiz.attemptCount = originalCount + 10;
      await someQuiz.save();
      console.log(`Shifted attempt count for Quiz ${someQuiz.title} from ${originalCount} to ${someQuiz.attemptCount}`);
    }

    // 2. Consistency check verification (stuck live session)
    console.log('Creating a stuck live session...');
    const stuckSession = await LiveSession.create({
      quiz: someQuiz._id,
      hostedBy: hostUser._id,
      status: 'in_progress',
      joinCode: 'STUCK1',
      scheduledStartAt: new Date(),
      startedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
      questionStartedAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
    });
    console.log('Stuck session created:', stuckSession._id);

    // 3. Consistency check verification (email failure)
    console.log('Creating silent email failure notification...');
    const failNotif = await Notification.create({
      userId: hostUser._id,
      type: 'badge_earned',
      message: 'Test message',
      channel: 'email',
      emailSent: false
      // No emailFailureReason set
    });
    console.log('Silent email failure created:', failNotif._id);

    // Now test the consistency check endpoint logic
    console.log('\n--- Running Consistency Check Logic ---');
    const actualAttemptsAgg = await QuizAttempt.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$quiz", actualCount: { $sum: 1 } } }
    ]);
    const actualAttemptsMap = new Map(actualAttemptsAgg.map(a => [a._id.toString(), a.actualCount]));
    const allQuizzes = await Quiz.find().select('title attemptCount');
    
    let driftFound = false;
    for (const quiz of allQuizzes) {
      const actual = actualAttemptsMap.get(quiz._id.toString()) || 0;
      if (quiz.attemptCount !== actual) {
        driftFound = true;
        console.log(`[PASS] Drift detected! Quiz "${quiz.title}" has ${quiz.attemptCount} listed, but ${actual} actual attempts.`);
      }
    }
    if (!driftFound) console.log('[FAIL] No drift detected!');

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const stuckSessions = await LiveSession.find({
      status: 'in_progress',
      questionStartedAt: { $lt: sixHoursAgo }
    }).select('joinCode questionStartedAt');

    if (stuckSessions.length > 0) {
      console.log(`[PASS] Detected ${stuckSessions.length} stuck session(s)!`);
    } else {
      console.log('[FAIL] Did not detect stuck session!');
    }

    const silentEmailFailures = await Notification.find({
      channel: { $in: ['email', 'both'] },
      emailSent: false,
      emailFailureReason: { $exists: false }
    }).select('type createdAt');

    if (silentEmailFailures.length > 0) {
      console.log(`[PASS] Detected ${silentEmailFailures.length} silent email failure(s)!`);
    } else {
      console.log('[FAIL] Did not detect silent email failure!');
    }

    // Cleanup
    if (someQuiz) {
      // Revert drift
      someQuiz.attemptCount = actualAttemptsMap.get(someQuiz._id.toString()) || 0;
      await someQuiz.save();
    }
    await LiveSession.findByIdAndDelete(stuckSession._id);
    await Notification.findByIdAndDelete(failNotif._id);

    console.log('\nVerification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

runVerification();
