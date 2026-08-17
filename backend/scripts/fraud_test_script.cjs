const mongoose = require('mongoose');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function safeFetch(url, options = {}, description = '') {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    
    if (!response.ok) {
      console.log(`API Error (${description}):`, response.status, data);
      return null;
    }
    return data;
  } catch (error) {
    console.log(`Fetch Exception (${description}):`, error.message);
    return null;
  }
}

async function run() {
  console.log("Connecting to MongoDB...");
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.");

  const TEST_COLLEGE_ID = "6a76ad50aae0dc13badab564"; // reusing from earlier

  // 1. Setup multiple users
  async function registerAndLogin(username) {
    await safeFetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${username}@test.com`, username, password: 'Password123!', role: 'student', captchaToken: 'test', consent: true })
    }, `Register ${username}`);
    
    const loginRes = await safeFetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${username}@test.com`, password: 'Password123!' })
    }, `Login ${username}`);
    return loginRes?.token;
  }

  console.log("\n====================================");
  console.log("Creating Test Accounts...");
  const t_now = Date.now();
  const tokenA = await registerAndLogin(`userA_${t_now}`);
  const tokenB = await registerAndLogin(`userB_${t_now}`);
  const tokenC = await registerAndLogin(`userC_${t_now}`);
  const tokenD = await registerAndLogin(`userD_${t_now}`);
  const tokenE = await registerAndLogin(`userE_${t_now}`);
  const tokenF = await registerAndLogin(`userF_${t_now}`);
  
  if (!tokenA || !tokenB || !tokenC || !tokenD || !tokenE || !tokenF) {
    console.log("Failed to create all accounts");
    process.exit(1);
  }

  // A. Duplicate Device (Submit 3 reviews for same college from same session/IP)
  console.log("\n====================================");
  console.log("TEST A: duplicate_device (3 reviews from same account/IP)");
  // Since the system might block multiple reviews from the same account for the same college entirely 
  // (the route checks `existing = Review.findOne({ collegeId, userId })`), we actually CANNOT submit 3 
  // reviews for the SAME college from the SAME account. The route outright blocks it.
  // Wait, "duplicate_device" might imply multiple accounts using the same device. Let's use 3 different accounts from same IP/session.
  
  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
    body: JSON.stringify({ title: "Dup Device Rev 1", reviewText: "This is review 1", rating: 4, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Dup Device Rev 1 (User A)');
  
  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
    body: JSON.stringify({ title: "Dup Device Rev 2", reviewText: "This is review 2", rating: 4, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Dup Device Rev 2 (User B)');

  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenC}` },
    body: JSON.stringify({ title: "Dup Device Rev 3", reviewText: "This is review 3", rating: 4, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Dup Device Rev 3 (User C)');

  
  // B. Similar Text
  console.log("\n====================================");
  console.log("TEST B: similar_text (2 reviews for same college with >80% similar text)");
  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenD}` },
    body: JSON.stringify({ title: "Similar Rev 1", reviewText: "This college is absolutely amazing, the faculty is great, and the infrastructure is very beautiful. I highly recommend it.", rating: 5, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Similar Text Rev 1 (User D)');
  
  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenE}` },
    body: JSON.stringify({ title: "Similar Rev 2", reviewText: "This college is absolutely amazing, the faculty is great, and the infrastructure is very beautiful. I highly recommend it.", rating: 5, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Similar Text Rev 2 (User E)');


  // C. Rating Spike (5+ reviews, same college, 6h, similar ratings)
  console.log("\n====================================");
  console.log("TEST C: rating_spike (5+ reviews with similar ratings across different accounts)");
  // We already created 5 reviews (Users A,B,C,D,E) for TEST_COLLEGE_ID in this script. They all gave 4 or 5 stars.
  // Let's add one more just to ensure it hits a threshold.
  await safeFetch(`${BASE_URL}/api/colleges/${TEST_COLLEGE_ID}/reviews`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenF}` },
    body: JSON.stringify({ title: "Spike Rev 6", reviewText: "This is a great place to study.", rating: 5, pros: ["Good"], cons: ["Bad"], wouldRecommend: true, yearAttended: 2020 })
  }, 'Spike Rev 6 (User F)');


  // D. New Account (Review within 24h of creation)
  console.log("\n====================================");
  console.log("TEST D: new_account (Review from newly created account)");
  // Since User F was just created, their review above should ALSO trigger `new_account`.

  // Run Fraud Detection Job Manually to process reviews
  console.log("\n====================================");
  console.log("Running fraud detection job manually...");
  const fraudJob = require('../jobs/fraudDetectionJob');
  await fraudJob.detectFraudulentReviews();

  // Evaluate results in DB
  console.log("\n====================================");
  console.log("Evaluating DB ReviewFlags...");
  const recentFlags = await mongoose.connection.collection('reviewflags').find({ collegeId: new mongoose.Types.ObjectId(TEST_COLLEGE_ID) }).toArray();
  
  console.log("Total Flags created for this college:", recentFlags.length);
  const dupDevice = recentFlags.find(f => f.reason === 'duplicate_device');
  const simText = recentFlags.find(f => f.reason === 'similar_text');
  const spike = recentFlags.find(f => f.reason === 'rating_spike');
  const newAcc = recentFlags.find(f => f.reason === 'new_account');

  console.log("\n--- duplicate_device ---");
  console.log(dupDevice ? JSON.stringify(dupDevice, null, 2) : "FAILED TO CREATE (NOT FOUND)");
  
  console.log("\n--- similar_text ---");
  console.log(simText ? JSON.stringify(simText, null, 2) : "FAILED TO CREATE (NOT FOUND)");
  
  console.log("\n--- rating_spike ---");
  console.log(spike ? JSON.stringify(spike, null, 2) : "FAILED TO CREATE (NOT FOUND)");
  
  console.log("\n--- new_account ---");
  console.log(newAcc ? JSON.stringify(newAcc, null, 2) : "FAILED TO CREATE (NOT FOUND)");

  // Check if flagged reviews are still public
  if (recentFlags.length > 0) {
    const flag = recentFlags[0];
    const review = await mongoose.connection.collection('reviews').findOne({ _id: flag.reviewId });
    console.log("\nFlagged Review Status (Auto-hide check):", review?.status === 'public' ? 'PASS (still public)' : 'FAIL (hidden/deleted)');
  } else {
    // Check one of the reviews we created anyway
    const review = await mongoose.connection.collection('reviews').findOne({ collegeId: new mongoose.Types.ObjectId(TEST_COLLEGE_ID) });
    console.log("\nReview Status (Auto-hide check):", review?.status === 'public' ? 'PASS (still public)' : 'FAIL (hidden/deleted)');
  }

  mongoose.connection.close();
}

run().catch(console.error);
