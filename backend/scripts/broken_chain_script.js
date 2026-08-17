const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://avinash:anitha@cluster0.gznlyfi.mongodb.net/platform-blueprint?retryWrites=true&w=majority&appName=Cluster0";
const BASE_URL = 'http://localhost:5000';

let USER1_TOKEN = '';
let USER1_ID = '';
let USER2_TOKEN = '';
let USER2_ID = '';

async function registerTestUser(email, username) {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', username, full_name: `Test User`, consent: true, captchaToken: 'test' })
  });
  const data = await res.json();
  if (res.status === 201) return { token: data.token, id: data.user.id };
  
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!' })
  });
  const loginData = await loginRes.json();
  return { token: loginData.token, id: loginData.user.id };
}

async function safeFetch(url, options, name) {
  const res = await fetch(url, options);
  if (res.ok) {
    try {
      const data = await res.json();
      console.log(`API Response (${name}):`, JSON.stringify(data, null, 2));
      return data;
    } catch(e) {
      console.log(`API Response (${name}): OK but not JSON - Error parsing`);
    }
  } else {
    try {
      const text = await res.text();
      console.log(`API Error (${name}):`, res.status, text.substring(0, 200));
    } catch(e) {
      console.log(`API Error (${name}):`, res.status);
    }
  }
  return null;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");
  
  console.log("Creating Test College...");
  const College = require('../models/College');
  let testCollege = await College.findOne({ name: "Test University" });
  if (!testCollege) testCollege = await College.create({ name: "Test University", type: "Private", location: { city: "Test City", state: "Test State" }, fees: { tuition: 10000, hostel: 5000 } });
  const COLLEGE_ID = testCollege._id.toString();
  
  let testCollege2 = await College.findOne({ name: "Test University 2" });
  if (!testCollege2) testCollege2 = await College.create({ name: "Test University 2", type: "State", location: { city: "Test City 2", state: "Test State 2" }, fees: { tuition: 8000, hostel: 4000 } });
  const COLLEGE_ID_2 = testCollege2._id.toString();
  console.log("Using College IDs:", COLLEGE_ID, COLLEGE_ID_2);
  
  console.log("Registering test users...");
  const u1 = await registerTestUser(`flowtest1_${Date.now()}@test.com`, `flowtest1_${Date.now()}`);
  USER1_TOKEN = u1.token; USER1_ID = u1.id;
  const u2 = await registerTestUser(`flowtest2_${Date.now()}@test.com`, `flowtest2_${Date.now()}`);
  USER2_TOKEN = u2.token; USER2_ID = u2.id;
  console.log(`User1 ID: ${USER1_ID}, User2 ID: ${USER2_ID}`);

  // Flow 1
  console.log("\\n====================================");
  console.log("FLOW 1: Submit Tuition Fee Reminder");
  await safeFetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/save`, {
    method: 'POST', headers: { 'Authorization': `Bearer ${USER1_TOKEN}` }
  }, 'Save College');
  
  await safeFetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/fee-reminder`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ note: "Test reminder note" })
  }, 'Fee Reminder');
  const f1_db = await mongoose.connection.collection('users').findOne({ _id: new mongoose.Types.ObjectId(USER1_ID) });
  console.log("DB Document (feeReminders):", JSON.stringify(f1_db.feeReminders, null, 2));

  // Flow 2
  console.log("\\n====================================");
  console.log("FLOW 2: Reality Check");
  for(let i=0; i<5; i++) {
    const dummy = await registerTestUser(`dummy${i}_${Date.now()}@test.com`, `dummy${i}_${Date.now()}`);
    await fetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dummy.token}` },
      body: JSON.stringify({ title: `Test Review ${i}`, reviewText: "This is a great college " + i, rating: 4, categoryRatings: { academics: 4, faculty: 4, infrastructure: 5, placements: 3, campusLife: 4 } })
    });
  }
  await safeFetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/reality-check`, { headers: { 'Authorization': `Bearer ${USER1_TOKEN}` } }, 'Reality Check');
  const rawReviews = await mongoose.connection.collection('reviews').find({ collegeId: new mongoose.Types.ObjectId(COLLEGE_ID) }).toArray();
  let academicSum = 0; let count = 0;
  rawReviews.forEach(r => { if(r.categoryRatings && r.categoryRatings.academics) { academicSum += r.categoryRatings.academics; count++; } });
  console.log(`DB Manual Calc for Academic: Sum = ${academicSum}, Count = ${count}, Avg = ${count ? academicSum/count : 0}`);

  // Flow 3
  console.log("\\n====================================");
  console.log("FLOW 3: Fraud Detection");
  for(let i=0; i<6; i++) {
    await fetch(`${BASE_URL}/api/colleges/${COLLEGE_ID}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
      body: JSON.stringify({ title: "Spam Review", reviewText: "spam spam spam", rating: 5 })
    });
  }
  const userFlags = await mongoose.connection.collection('reviewflags').find({ "flaggedUser": new mongoose.Types.ObjectId(USER1_ID) }).toArray();
  console.log("DB Document (ReviewFlags):", JSON.stringify(userFlags, null, 2));

  // Flow 4
  console.log("\\n====================================");
  console.log("FLOW 4: Alumni Profile & Connection Request");
  const f4_alumni_res = await safeFetch(`${BASE_URL}/api/alumni/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ collegeId: COLLEGE_ID, graduationYear: 2020, currentCompany: "Google", role: "Software Engineer", skills: ["React", "Node"] })
  }, 'Alumni Profile');
  
  const f4_alumni_db = await mongoose.connection.collection('alumniprofiles').findOne({ userId: new mongoose.Types.ObjectId(USER1_ID) });
  console.log("DB AlumniProfile:", JSON.stringify(f4_alumni_db, null, 2));

  if (f4_alumni_db) {
    await safeFetch(`${BASE_URL}/api/alumni/connections/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER2_TOKEN}` },
      body: JSON.stringify({ alumniProfileId: f4_alumni_db._id.toString(), type: 'session_1on1', message: "Hi, I'd like to connect!", isAnonymous: false })
    }, 'Connection Request');
    
    const f4_conn_db = await mongoose.connection.collection('connectionrequests').findOne({ requesterId: new mongoose.Types.ObjectId(USER2_ID), alumniProfileId: f4_alumni_db._id });
    console.log("DB ConnectionRequest:", JSON.stringify(f4_conn_db, null, 2));
  }

  // Flow 5
  console.log("\\n====================================");
  console.log("FLOW 5: Submit Salary Entry & Aggregate Stats");
  await safeFetch(`${BASE_URL}/api/salary/submit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ collegeId: COLLEGE_ID, branch: "Computer Science", graduationYear: 2022, company: "Microsoft", role: "SDE", ctc: 4000000, baseSalary: 2500000, bonus: 500000, stocks: 1000000 })
  }, 'Submit Salary');
  
  await safeFetch(`${BASE_URL}/api/salary/colleges/${COLLEGE_ID}/stats`, { headers: { 'Authorization': `Bearer ${USER1_TOKEN}` } }, 'Salary Stats');
  
  const f5_db = await mongoose.connection.collection('salaryentries').findOne({ userId: new mongoose.Types.ObjectId(USER1_ID) });
  console.log("DB SalaryEntry:", JSON.stringify(f5_db, null, 2));

  // Flow 6
  console.log("\\n====================================");
  console.log("FLOW 6: AI Mentor Chat");
  await safeFetch(`${BASE_URL}/api/mentor/onboarding`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ branchOfInterest: "CS", budgetRange: "Medium", locationPreference: "City", priorities: [], currentAcademicStanding: "Good" })
  }, 'Mentor Onboarding');

  await safeFetch(`${BASE_URL}/api/mentor/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ message: "What are the typical salaries for computer science at my college?" })
  }, 'Mentor Chat');
  
  const f6_db = await mongoose.connection.collection('studentprofiles').findOne({ userId: new mongoose.Types.ObjectId(USER1_ID) });
  const f6_chat_db = await mongoose.connection.collection('mentorchatlogs').find({ userId: new mongoose.Types.ObjectId(USER1_ID) }).toArray();
  console.log("DB AI Logs / StudentProfile:", f6_db ? "Profile Created" : "No Profile", f6_chat_db.length ? f6_chat_db : "No Chat logs");

  // Flow 7
  console.log("\\n====================================");
  console.log("FLOW 7: Save Comparison Set");
  await safeFetch(`${BASE_URL}/api/colleges/comparisons`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${USER1_TOKEN}` },
    body: JSON.stringify({ name: "My Top Colleges", colleges: [COLLEGE_ID, COLLEGE_ID_2] })
  }, 'Save Comparison');
  
  await safeFetch(`${BASE_URL}/api/colleges/comparisons`, { headers: { 'Authorization': `Bearer ${USER1_TOKEN}` } }, 'Get Comparisons');
  
  const f7_db = await mongoose.connection.collection('comparisonsets').findOne({ userId: new mongoose.Types.ObjectId(USER1_ID) });
  console.log("DB ComparisonSet:", JSON.stringify(f7_db, null, 2));

  // Flow 8
  console.log("\\n====================================");
  console.log("FLOW 8: Export Data");
  await safeFetch(`${BASE_URL}/api/users/me/export`, { headers: { 'Authorization': `Bearer ${USER1_TOKEN}` } }, 'Export');

  console.log("\\n====================================");
  console.log("DONE");
  mongoose.disconnect();
}
run();
