const axios = require('axios');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
require('dotenv').config({ path: './backend/.env' });

const BASE_URL = 'http://localhost:5000/api';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/student-hub';

// Schemas needed for direct DB inspection/cleanup
const User = require('./models/User');
const College = require('./models/College');
const CollegeOfficialAccount = require('./models/CollegeOfficialAccount');
const CommunityPost = require('./models/CommunityPost');

async function runTests() {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Setup Data
    const college = await College.findOne();
    if (!college) throw new Error("No college found");
    
    // Register test admin and update role
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test_admin_phase456@example.com', password: 'Password123!', full_name: 'Admin Phase456', username: 'admin_phase456', role: 'student'
      });
    } catch (e) {
      if (e.response && e.response.status !== 400) console.error("Admin reg error:", e.response.data);
    } 
    
    await User.updateOne({ email: 'test_admin_phase456@example.com' }, { $set: { role: 'admin' } });
    const testAdmin = await User.findOne({ email: 'test_admin_phase456@example.com' });

    // Register test student
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test_student_phase456@example.com', password: 'Password123!', full_name: 'Student Phase456', username: 'student_phase456', role: 'student'
      });
    } catch (e) {
      if (e.response && e.response.status !== 400) console.error("Student reg error:", e.response.data);
    } 
    
    const testStudent = await User.findOne({ email: 'test_student_phase456@example.com' });
    
    if (!testAdmin || !testStudent) {
        throw new Error("Required test users not found. Did registration fail?");
    }

    // Login users to get tokens
    const studentLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testStudent.email,
      password: 'Password123!'
    });
    const studentToken = studentLogin.data.token;

    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testAdmin.email,
      password: 'Password123!'
    });
    const adminToken = adminLogin.data.token;

    console.log("\n=========================================");
    console.log("1. REALITY CHECK ENDPOINT");
    console.log("=========================================\n");

    const realityRes = await axios.get(`${BASE_URL}/colleges/${college._id}/reality-check`);
    console.log("--- ACTUAL API RESPONSE (REALITY CHECK) ---");
    console.log(JSON.stringify(realityRes.data, null, 2));


    console.log("\n=========================================");
    console.log("2. OFFICIAL COLLEGE ACCOUNTS & PERMISSIONS");
    console.log("=========================================\n");

    // Cleanup previous claim
    await CollegeOfficialAccount.deleteMany({ userId: testStudent._id });

    // Request Official Status
    const claimRes = await axios.post(`${BASE_URL}/colleges/${college._id}/claims`, {}, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log("--- REQUEST OFFICIAL STATUS ---");
    console.log("Status:", claimRes.status);
    console.log("Response:", JSON.stringify(claimRes.data, null, 2));

    // Admin Approves
    const approveRes = await axios.put(`${BASE_URL}/admin/colleges/claims/${claimRes.data._id}`, { status: 'verified' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("\n--- ADMIN VERIFIES STATUS ---");
    console.log("Status:", approveRes.status);
    console.log("DB Document (Notice verifiedAt and verifiedBy):", JSON.stringify(approveRes.data, null, 2));

    // Attempt to Submit Review (Should fail)
    console.log("\n--- OFFICIAL ACCOUNT ATTEMPTS REVIEW (SHOULD FAIL) ---");
    try {
      await axios.post(`${BASE_URL}/colleges/${college._id}/reviews`, {
        title: "Official test", reviewText: "I am official", rating: 5, wouldRecommend: true
      }, {
        headers: { 
          Authorization: `Bearer ${studentToken}`,
          'X-Forwarded-For': '192.168.1.100' // Bypassing IP limit
        }
      });
    } catch (error) {
      console.log("Status:", error.response.status);
      console.log("Response:", JSON.stringify(error.response.data, null, 2));
    }

    // Submit Official Campus Update Post (Should succeed and auto-set isOfficial)
    console.log("\n--- OFFICIAL ACCOUNT POSTS CAMPUS UPDATE ---");
    const postRes = await axios.post(`${BASE_URL}/community-feed`, {
      content: "Important updates from the dean.",
      category: "campus_update",
      collegeId: college._id
    }, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    console.log("Status:", postRes.status);
    console.log("Response (Notice isOfficial: true):", JSON.stringify({
      _id: postRes.data._id,
      content: postRes.data.content,
      category: postRes.data.category,
      isOfficial: postRes.data.isOfficial
    }, null, 2));

    // Cleanup
    await CollegeOfficialAccount.deleteMany({ userId: testStudent._id });
    await CommunityPost.deleteMany({ _id: postRes.data._id });

  } catch (err) {
    console.error("Script Error:", err.message);
    if(err.response) console.error(err.response.data);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
