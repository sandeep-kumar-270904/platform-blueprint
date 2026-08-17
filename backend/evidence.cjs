const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });

const User = require('./models/User');
const College = require('./models/College');

async function runTest() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studenthub');
  
  let student = await User.findOne({ email: 'student_test123@example.com' });
  const studentToken = jwt.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

  const client = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${studentToken}` },
    validateStatus: () => true
  });

  const c2 = await College.findOne({ name: 'Leaderboard College B' });

  console.log('\n--- 1. LEADERBOARD EXCLUSION EVIDENCE ---');
  console.log(`Expected Excluded College: ${c2.name} (ID: ${c2._id}), due to sampleSize=3`);
  let res = await client.get(`/leaderboards?category=academics`);
  console.log('GET /api/leaderboards?category=academics');
  console.log('Response:', JSON.stringify(res.data, null, 2));

  console.log('\n--- 2. DATA EXPORT RAW PAYLOAD EVIDENCE ---');
  let exportRes = await client.get('/users/me/export');
  console.log('GET /api/users/me/export Response:');
  console.log(JSON.stringify(exportRes.data, null, 2));

  process.exit(0);
}

runTest().catch(console.error);
