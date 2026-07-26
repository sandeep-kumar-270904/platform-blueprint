require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function testAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const User = require('./models/User');
  const AdminActionLog = require('./models/AdminActionLog');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error("No admin found");

  const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET || "supersecret_antigravity_jwt_key_2026");

  console.log("Admin Token Generated.");

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Fetch Collections
  console.log("1. Fetching collections...");
  let res = await fetch('http://localhost:5000/api/admin/collections', { headers });
  let data = await res.json();
  if (!data.collections || !data.collections.includes('User')) {
    throw new Error("Collections route failed");
  }
  console.log("Collections OK.");

  // 2. Fetch Users
  console.log("2. Fetching records (User)...");
  res = await fetch('http://localhost:5000/api/admin/collections/User?limit=5', { headers });
  data = await res.json();
  if (data.records.length === 0) throw new Error("No users found");
  
  const testUser = data.records.find(u => u.role !== 'admin') || data.records[0];
  console.log(`Found test target user: ${testUser.username}`);

  // 3. Edit User (Change name)
  console.log("3. Updating user...");
  const oldName = testUser.full_name;
  const newName = oldName + " (Edited)";
  
  res = await fetch(`http://localhost:5000/api/admin/collections/User/${testUser._id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ ...testUser, full_name: newName })
  });
  
  data = await res.json();
  if (data.full_name !== newName) throw new Error("Update failed");
  console.log("Update OK.");

  // 4. Verify Audit Trail
  console.log("4. Verifying Audit Trail...");
  const log = await AdminActionLog.findOne({ targetId: testUser._id }).sort({ createdAt: -1 });
  if (!log || log.actionType !== 'crud_update') throw new Error("Audit log not found");
  
  if (log.changes.before.full_name !== oldName || log.changes.after.full_name !== newName) {
    throw new Error("Audit log diff is incorrect");
  }
  console.log("Audit log captures before/after diff perfectly!");

  // 5. Test Analytics
  console.log("5. Testing Analytics Endpoints...");
  res = await fetch('http://localhost:5000/api/admin/analytics/growth', { headers });
  data = await res.json();
  if (!Array.isArray(data)) throw new Error("Growth analytics failed");
  console.log("Growth Analytics OK. Array length:", data.length);
  
  // Revert the name
  await User.updateOne({ _id: testUser._id }, { full_name: oldName });
  
  console.log("SUCCESS: All admin extension requirements verified!");
  process.exit(0);
}

testAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
