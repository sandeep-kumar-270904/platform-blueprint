const axios = require('axios');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');
const College = require('./models/College');
const Review = require('./models/Review');
const CommunityPost = require('./models/CommunityPost');
const AuditLog = require('./models/AuditLog');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';
const secret = process.env.JWT_SECRET || 'supersecret_antigravity_jwt_key_2026';

async function generateEvidence() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_insights');
    
    // SETUP
    let student = await User.findOne({ email: 'student_test123@example.com' });
    let admin = await User.findOne({ email: 'admin_test123@example.com' });
    let collegeAdmin = await User.findOne({ email: 'college_admin@example.com' });
    let college = await College.findOne({});

    if (!collegeAdmin) {
      collegeAdmin = new User({ username: 'collegeadmin', email: 'college_admin@example.com', password: 'password', full_name: 'College Admin Test', role: 'student' });
      await collegeAdmin.save();
    }

    const studentToken = jwt.sign({ id: student._id, email: student.email, username: student.username, full_name: student.full_name }, secret, { expiresIn: '1h' });
    const adminToken = jwt.sign({ id: admin._id, email: admin.email, username: admin.username, full_name: admin.full_name, role: admin.role }, secret, { expiresIn: '1h' });
    const collegeAdminToken = jwt.sign({ id: collegeAdmin._id, email: collegeAdmin.email, username: collegeAdmin.username, full_name: collegeAdmin.full_name, role: collegeAdmin.role }, secret, { expiresIn: '1h' });

    console.log("=========================================");
    console.log("1. MULTI-DIMENSION REVIEWS");
    console.log("=========================================\n");

    // Clean up
    await Review.deleteMany({ userId: student._id, collegeId: college._id });

    const reviewPayload = {
      title: "Perfect score test",
      reviewText: "Testing server override.",
      rating: 1.0, // Bogus 1.0 sent by client
      overallRating: 1.0, // Also sending bogus 1.0 just in case
      wouldRecommend: true,
      categoryRatings: {
        academics: 5,
        placements: 5,
        faculty: 5,
        infrastructure: 5,
        hostel: 5,
        campusLife: 5,
        valueForMoney: 5 // Average = 35 / 7 = 5.0
      }
    };

    const reviewRes = await axios.post(`${BASE_URL}/colleges/${college._id}/reviews`, reviewPayload, {
      headers: { 
        Authorization: `Bearer ${studentToken}`,
        'X-Forwarded-For': '192.168.1.' + Math.floor(Math.random() * 255)
      }
    });
    console.log("--- ACTUAL API RESPONSE (SUBMIT REVIEW) ---");
    console.log(JSON.stringify(reviewRes.data, null, 2));

    const dbReview = await Review.findById(reviewRes.data._id).lean();
    console.log("\n--- ACTUAL DB DOCUMENT (REVIEW) ---");
    console.log(JSON.stringify(dbReview, null, 2));

    const migratedReview = await Review.findOne({ categoryRatings: { $exists: false } }).lean();
    if (migratedReview) {
      console.log("\n--- ACTUAL MIGRATED DB DOCUMENT (OLD REVIEW) ---");
      console.log(JSON.stringify(migratedReview, null, 2));
    } else {
      console.log("\n--- (No legacy reviews available in DB to show) ---");
    }

    // Removed sections 2 and 3

  } catch (err) {
    console.error("Script Error:", err.message);
    if(err.response) console.error(err.response.data);
  } finally {
    await mongoose.disconnect();
  }
}

generateEvidence();
