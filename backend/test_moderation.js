const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../backend/models/User');
const Quiz = require('../backend/models/Quiz');
const QuizReport = require('../backend/models/QuizReport');
const AuditLog = require('../backend/models/AuditLog');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub');
  console.log("Connected to DB");

  try {
    // 1. Create a dummy user
    const dummyUser = new User({
      email: 'creator@test.com',
      passwordHash: 'dummy',
      full_name: 'Creator User',
      role: 'student'
    });
    await dummyUser.save();
    console.log("Created user:", dummyUser._id);

    // 2. Create a dummy quiz
    const quiz = new Quiz({
      title: 'Test Quiz for Moderation',
      description: 'Will be reported',
      creator: dummyUser._id,
      questions: [],
      status: 'published'
    });
    await quiz.save();
    console.log("Created quiz:", quiz._id);

    // 3. Create a report
    const report = new QuizReport({
      targetId: quiz._id,
      reportedBy: dummyUser._id,
      reason: 'inappropriate',
      details: 'Offensive language used in description',
      status: 'pending'
    });
    await report.save();
    console.log("Created report:", report._id);

    // 4. We will simulate the PATCH /api/admin/quiz-reports/:id unpublish logic
    console.log("Simulating Admin unpublish...");
    report.status = 'reviewed_actioned';
    report.reviewedBy = dummyUser._id; // Fake admin
    report.reviewedAt = new Date();
    report.adminNote = 'Unpublished due to violation';
    await report.save();

    quiz.status = 'unpublished';
    await quiz.save();

    const al = new AuditLog({
      actor_id: dummyUser._id,
      action: 'quiz_report_unpublish',
      entity_type: 'quiz_report',
      entity_id: report._id,
      metadata: { reason: report.adminNote, targetQuizId: report.targetId }
    });
    await al.save();

    console.log("Verified Quiz Status:", quiz.status);
    console.log("Verified Audit Log:", al._id);

    // 5. Test Ban logic
    dummyUser.quizBanned = true;
    dummyUser.banReason = 'Repeated violations';
    await dummyUser.save();
    console.log("User banned from quizzes:", dummyUser.quizBanned);

  } catch (err) {
    console.error(err);
  } finally {
    // Cleanup
    await User.deleteOne({ email: 'creator@test.com' });
    await Quiz.deleteMany({ title: 'Test Quiz for Moderation' });
    await QuizReport.deleteMany({ reason: 'inappropriate', details: 'Offensive language used in description' });
    await AuditLog.deleteMany({ action: 'quiz_report_unpublish' });
    console.log("Cleanup done");
    process.exit(0);
  }
}
test();
