const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const College = require('./models/College');
  const Review = require('./models/Review');
  const User = require('./models/User');
  const CollegeOfficialAccount = require('./models/CollegeOfficialAccount');
  const CommunityPost = require('./models/CommunityPost');

  const college = await College.findOne();
  if (!college) return console.log("No college found");

  // 1. Reality Check
  console.log("\n--- 1. REALITY CHECK ---");
  const realityRes = await axios.get(`${BASE_URL}/colleges/${college._id}/reality-check`);
  console.log("Response Body:\n" + JSON.stringify(realityRes.data, null, 2));

  // Manually calculate academics average
  const reviews = await Review.find({ collegeId: college._id, status: 'public' });
  let academicsSum = 0;
  let academicsCount = 0;
  reviews.forEach(r => {
    if (r.categoryRatings && r.categoryRatings.academics) {
      academicsSum += r.categoryRatings.academics;
      academicsCount++;
    }
  });
  const manualAvg = academicsCount > 0 ? Math.round((academicsSum / academicsCount) * 10) / 10 : null;
  console.log(`\nManual Academics Calculation: Sum=${academicsSum}, Count=${academicsCount}, Avg=${manualAvg}`);
  
  // 2. Official Accounts
  console.log("\n--- 2. OFFICIAL ACCOUNTS ---");
  
  const jwt = require('jsonwebtoken');

  // Setup users
  let admin = await User.findOne({ role: 'admin' });
  let student = await User.findOne({ role: 'student' });
  
  if (!admin) {
    admin = await User.create({ email: `admin_${Date.now()}@test.com`, password: 'Password123!', full_name: 'Admin', username: `admin_${Date.now()}`, role: 'admin' });
  }
  if (!student) {
    student = await User.create({ email: `student_${Date.now()}@test.com`, password: 'Password123!', full_name: 'Student', username: `student_${Date.now()}`, role: 'student' });
  }

  const adminToken = jwt.sign({ id: admin._id, email: admin.email, role: admin.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
  const studentToken = jwt.sign({ id: student._id, email: student.email, role: student.role }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

  await CollegeOfficialAccount.deleteMany({ userId: student._id });

  // 2a. Request Status
  console.log("\n--- 2a. POST official account request ---");
  const claimRes = await axios.post(`${BASE_URL}/colleges/${college._id}/claims`, {}, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log("Response:\n" + JSON.stringify(claimRes.data, null, 2));
  let claimDoc = await CollegeOfficialAccount.findById(claimRes.data._id).lean();
  console.log("DB Document:\n" + JSON.stringify(claimDoc, null, 2));

  // 2b. Admin Approve
  console.log("\n--- 2b. Admin Approve ---");
  const approveRes = await axios.put(`${BASE_URL}/admin/colleges/claims/${claimRes.data._id}`, { status: 'verified' }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log("Response:\n" + JSON.stringify(approveRes.data, null, 2));
  claimDoc = await CollegeOfficialAccount.findById(claimRes.data._id).lean();
  console.log("DB Document:\n" + JSON.stringify(claimDoc, null, 2));

  // 2c. Submit CommunityPost (campus_update)
  console.log("\n--- 2c. Submit CommunityPost (campus_update) ---");
  const postRes = await axios.post(`${BASE_URL}/community-feed`, {
    content: "Official notice",
    category: "campus_update",
    collegeId: college._id,
    isOfficial: false // Client tries to bypass
  }, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log("Response:\n" + JSON.stringify(postRes.data, null, 2));
  const postDoc = await CommunityPost.findById(postRes.data._id).lean();
  console.log("DB Document:\n" + JSON.stringify(postDoc, null, 2));

  // 2d. Attempt to Submit Review
  console.log("\n--- 2d. Attempt to Submit Review (ANY college) ---");
  try {
    await axios.post(`${BASE_URL}/colleges/${college._id}/reviews`, {
      title: "Test", reviewText: "Test", rating: 5, wouldRecommend: true
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log("SUCCESS? This should have failed.");
  } catch (err) {
    console.log("Rejection Response:\n" + JSON.stringify(err.response.data, null, 2));
  }

  // 2e. Attempt to Vote on Poll
  console.log("\n--- 2e. Attempt to Vote on Poll ---");
  // Create a poll first
  const pollRes = await axios.post(`${BASE_URL}/community-feed`, {
    content: "Poll", pollOptions: [{ text: "A" }, { text: "B" }]
  }, {
    headers: { Authorization: `Bearer ${adminToken}` } // Admin creates poll
  });
  try {
    await axios.post(`${BASE_URL}/community-feed/post/${pollRes.data._id}/vote`, {
      optionIndex: 0
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
  } catch (err) {
    console.log("Rejection Response:\n" + JSON.stringify(err.response.data, null, 2));
  }

  process.exit(0);
}

run();
