const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

const User = require('./models/User');
const College = require('./models/College');
const Review = require('./models/Review');
const ComparisonSet = require('./models/ComparisonSet');
const ApplicationStatus = require('./models/ApplicationStatus');

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub');
  console.log('Connected to DB');

  let admin = await User.findOne({ email: 'admin_test123@example.com' });
  if (!admin) {
    admin = await User.create({ email: `admin_test123@example.com`, password: 'Password123!', full_name: 'Admin Test', username: `admin123_${Date.now()}`, role: 'admin' });
  }

  let student = await User.findOne({ email: 'student_test123@example.com' });
  if (!student) {
    student = await User.create({ email: `student_test123@example.com`, password: 'Password123!', full_name: 'Student Test', username: `student123_${Date.now()}`, role: 'student' });
  }

  const studentToken = jwt.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

  const client = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${studentToken}` },
    validateStatus: () => true
  });

  const unauthClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    validateStatus: () => true
  });

  await College.deleteMany({ name: { $in: ['Leaderboard College A', 'Leaderboard College B'] } });
  
  let c1 = await College.create({ name: 'Leaderboard College A', location: { city: 'CityA', state: 'StateA' }, type: 'Private', fees: { tuition: 1, hostel: 1 } });
  // Create 6 reviews for c1 to make sampleSize = 6
  for(let i=0; i<6; i++) {
     await Review.create({
       userId: admin._id,
       collegeId: c1._id,
       status: 'public',
       title: 'Test Review A',
       reviewText: 'This is a test review.',
       rating: 4,
       categoryRatings: { academics: 4 }
     });
  }

  let c2 = await College.create({ name: 'Leaderboard College B', location: { city: 'CityB', state: 'StateB' }, type: 'Private', fees: { tuition: 1, hostel: 1 } });
  // Create 3 reviews for c2 to make sampleSize = 3 (<5)
  for(let i=0; i<3; i++) {
     await Review.create({
       userId: admin._id,
       collegeId: c2._id,
       status: 'public',
       title: 'Test Review B',
       reviewText: 'This is another test review.',
       rating: 5,
       categoryRatings: { academics: 5 }
     });
  }

  console.log('\n--- 7. CROSS-COLLEGE LEADERBOARDS ---');
  let res = await client.get(`/leaderboards?category=academics`);
  console.log('GET /api/leaderboards?category=academics');
  console.log('Response:', JSON.stringify(res.data, null, 2));

  console.log('\n--- 8. SAVED COMPARISON HISTORY ---');
  let compareRes = await client.post('/comparisons', {
    name: 'My Top Choices',
    collegeIds: [c1._id, c2._id]
  });
  console.log('POST /api/comparisons Response:', JSON.stringify(compareRes.data, null, 2));
  
  const shareToken = compareRes.data.shareToken;
  console.log('Share token generated:', shareToken);
  
  let sharedRes = await unauthClient.get(`/comparisons/shared/${shareToken}`);
  console.log(`GET /api/comparisons/shared/${shareToken} (UNAUTH) Response:`, JSON.stringify(sharedRes.data, null, 2));

  console.log('\n--- 9. APPLICATION / DECISION TRACKER ---');
  let appRes1 = await client.put(`/users/me/applications/${c1._id}`, { status: 'interested', notes: 'Top choice!' });
  console.log('PUT (interested) Response:', JSON.stringify(appRes1.data, null, 2));

  let appRes2 = await client.put(`/users/me/applications/${c1._id}`, { status: 'applied', notes: 'Submitted today.' });
  console.log('PUT (applied) Response:', JSON.stringify(appRes2.data, null, 2));
  
  const finalDoc = await ApplicationStatus.findOne({ userId: student._id, collegeId: c1._id }).lean();
  console.log('Final DB Document:', JSON.stringify(finalDoc, null, 2));
  
  const allDocs = await ApplicationStatus.find({ userId: student._id, collegeId: c1._id }).lean();
  console.log('Count of documents in DB for this user/college:', allDocs.length);

  // Attempt to GET as a DIFFERENT user to ensure it does not return this data
  const otherToken = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
  const otherClient = axios.create({ baseURL: 'http://localhost:5000/api', headers: { Authorization: `Bearer ${otherToken}` }, validateStatus: () => true });
  let otherAppRes = await otherClient.get('/users/me/applications');
  console.log('GET /users/me/applications (as different user) Response:', JSON.stringify(otherAppRes.data, null, 2));

  console.log('\n--- 10. DATA EXPORT ---');
  let exportRes = await client.get('/users/me/export');
  console.log('GET /api/users/me/export Response:');
  const exportData = exportRes.data;
  console.log({
    reviews_count: exportData.reviews ? exportData.reviews.length : 0,
    posts_count: exportData.posts ? exportData.posts.length : 0,
    applicationStatuses_count: exportData.applicationStatuses ? exportData.applicationStatuses.length : 0,
    sample_application_status: exportData.applicationStatuses && exportData.applicationStatuses[0] ? exportData.applicationStatuses[0].status : null
  });

  process.exit(0);
}

runTest().catch(console.error);
