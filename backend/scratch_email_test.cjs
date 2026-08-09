const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

process.env.MOCK_EMAIL = 'true';

const User = require('./models/User');
const AlumniProfile = require('./models/AlumniProfile');
const ConnectionRequest = require('./models/ConnectionRequest');
const Event = require('./models/Event');
const NotificationPreference = require('./models/NotificationPreference');
const Notification = require('./models/Notification');
const notificationService = require('./services/notificationService');
const cronService = require('./services/cronService');
const emailService = require('./services/emailService');

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/notesHub');
  console.log('✅ Connected to DB');
  
  emailService.mockEmailOutbox = [];

  const student = await User.create({
    email: `student_test_${Date.now()}@example.com`,
    username: `student_${Date.now()}`,
    password: 'password123',
    full_name: 'Test Student'
  });

  const alumUser = await User.create({
    email: `alum_test_${Date.now()}@example.com`,
    username: `alum_${Date.now()}`,
    password: 'password123',
    full_name: 'Test Alumni'
  });

  const alumProfile = await AlumniProfile.create({
    userId: alumUser._id,
    collegeId: new mongoose.Types.ObjectId(),
    currentRole: 'Engineer',
    currentCompany: 'Tech Corp',
    graduationYear: 2020,
    branch: 'Computer Science',
    willingness: { openToMentoring: true, openToQa: true },
    verificationStatus: 'verified'
  });

  await NotificationPreference.create({
    user_id: alumUser._id,
    toggles: { alumniConnections: { connection_requests: true, connection_responses: true, session_reminders: true, qa_responses: false, mentorship_updates: true } }
  });

  await NotificationPreference.create({
    user_id: student._id,
    toggles: { alumniConnections: { connection_requests: true, connection_responses: true, session_reminders: true, qa_responses: false, mentorship_updates: true } }
  });

  console.log('--- TEST 1: Request Received Email ---');
  await notificationService.createNotification({
    userId: alumUser._id,
    type: 'alumni_connection_request',
    relatedContentId: new mongoose.Types.ObjectId(),
    message: `You have a new session 1on1 request from a student.`,
    actionUrl: `/alumni/connections/inbox`,
    actors: [{ userId: student._id, name: student.full_name }],
    metadata: { purpose: 'Career Advice', message: 'Hello' }
  });

  await cronService.processPendingEmails();
  
  if (emailService.mockEmailOutbox.length === 1) {
    console.log('✅ TEST 1 PASSED: Alumni received email request');
  } else {
    console.error('❌ TEST 1 FAILED: Expected 1 email, got', emailService.mockEmailOutbox.length);
  }
  
  emailService.mockEmailOutbox = [];

  console.log('--- TEST 2: Request Accepted Email ---');
  await notificationService.createNotification({
    userId: student._id,
    type: 'alumni_connection_response',
    relatedContentId: new mongoose.Types.ObjectId(),
    message: `Your session 1on1 request was accepted.`,
    actionUrl: `/alumni/connections`,
    actors: [{ userId: alumUser._id, name: alumUser.full_name }]
  });

  await cronService.processPendingEmails();

  if (emailService.mockEmailOutbox.length === 1) {
    console.log('✅ TEST 2 PASSED: Student received acceptance email');
  } else {
    console.error('❌ TEST 2 FAILED');
  }

  emailService.mockEmailOutbox = [];

  console.log('--- TEST 3: QA Disabled Preference ---');
  await notificationService.createNotification({
    userId: student._id,
    type: 'question_answered', // mapped to qa_responses
    relatedContentId: new mongoose.Types.ObjectId(),
    message: `Your Q&A question was answered.`,
    actionUrl: `/alumni/connections`
  });

  await cronService.processPendingEmails();
  
  if (emailService.mockEmailOutbox.length === 0) {
    console.log('✅ TEST 3 PASSED: QA Responses preference safely suppressed email');
  } else {
    console.error('❌ TEST 3 FAILED: Email was sent despite disabled preference');
  }

  // Cleanup
  await User.deleteMany({ _id: { $in: [student._id, alumUser._id] } });
  await AlumniProfile.deleteMany({ userId: alumUser._id });
  await NotificationPreference.deleteMany({ user_id: { $in: [student._id, alumUser._id] } });
  await Notification.deleteMany({ userId: { $in: [student._id, alumUser._id] } });

  console.log('✅ Cleanup complete');
  process.exit(0);
}

runTests().catch(console.error);
