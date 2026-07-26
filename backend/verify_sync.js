const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function runTest() {
  const MONGO_URI = "mongodb+srv://avinash:anitha@cluster0.gznlyfi.mongodb.net/platform-blueprint?retryWrites=true&w=majority";
  await mongoose.connect(MONGO_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const admin = await User.findOne({ role: 'admin' });
  const user = await User.findOne({ role: { $ne: 'admin' } });
  
  console.log("Admin:", admin._id);
  console.log("User:", user._id);
  
  const JWT_SECRET = "supersecret_antigravity_jwt_key_2026";
  const adminToken = jwt.sign({ user: { id: admin._id } }, JWT_SECRET, { expiresIn: '1h' });
  const userToken = jwt.sign({ user: { id: user._id } }, JWT_SECRET, { expiresIn: '1h' });
  
  const BASE_URL = 'http://localhost:5000';
  
  // 1. User fetches profile
  let res = await fetch(`${BASE_URL}/api/dashboard/profile`, { headers: { Authorization: `Bearer ${userToken}` }});
  let userProf = await res.json();
  console.log("User Stats initially:", userProf.totalQuizPoints || 0);
  
  // 2. Admin fetches user profile
  res = await fetch(`${BASE_URL}/api/dashboard/profile?userId=${user._id}`, { headers: { Authorization: `Bearer ${adminToken}` }});
  let adminProf = await res.json();
  console.log("Admin sees user stats:", adminProf.totalQuizPoints || 0);
  
  if (userProf.totalQuizPoints !== adminProf.totalQuizPoints) {
      console.log("MISMATCH!");
  }
  
  // 3. Admin Adjusts Points
  res = await fetch(`${BASE_URL}/api/admin/users/${user._id}/adjust-points`, { 
      method: 'POST', 
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ points: 500 })
  });
  let adjustRes = await res.json();
  console.log("Admin adjusted points response:", adjustRes);
  
  // 4. Verify sync
  res = await fetch(`${BASE_URL}/api/dashboard/profile`, { headers: { Authorization: `Bearer ${userToken}` }});
  userProf = await res.json();
  
  res = await fetch(`${BASE_URL}/api/dashboard/profile?userId=${user._id}`, { headers: { Authorization: `Bearer ${adminToken}` }});
  adminProf = await res.json();
  
  console.log("User now sees:", userProf.totalQuizPoints || 0);
  console.log("Admin now sees:", adminProf.totalQuizPoints || 0);
  
  if (userProf.totalQuizPoints === adminProf.totalQuizPoints) {
      console.log("SUCCESS: User Dashboard and Admin Panel are fully synced via the same endpoints!");
  }
  
  process.exit(0);
}

runTest().catch(console.error);
