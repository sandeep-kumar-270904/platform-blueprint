const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function runConcurrencyTests() {
  console.log("=== RUNNING CLAIM PROFILE CONCURRENCY TEST ===");

  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  // Schemas should be registered by the running backend server.
  // Wait, if we are running as a separate script, we need the schemas to talk to DB directly for setup.
  // But we can just use mongoose directly for the minimal setup if we define schemas, or let's just require the models since we can run from the backend directory.
  const User = require('./models/User');
  const College = require('./models/College');
  const AlumniRegistry = require('./models/AlumniRegistry');
  const AlumniProfile = require('./models/AlumniProfile');

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

  let college, registryRecord;
  let testUsers = [];

  try {
    // 1. Setup
    college = await new College({ 
      name: 'Concurrency Test College', 
      domain: 'concurrency.edu',
      type: 'Private',
      location: { city: 'Test City', state: 'Test State', country: 'Test Country' },
      fees: { tuition: 1000, hostel: 500 }
    }).save();
    
    // Create 10 different users
    for (let i = 0; i < 10; i++) {
      const user = await new User({ 
        email: `claim_test_${i}@test.com`, 
        role: 'student', 
        full_name: `Claim Test ${i}`,
        password: 'password123'
      }).save();
      testUsers.push(user);
    }

    // Create 1 registry record
    registryRecord = await new AlumniRegistry({
      fullName: 'Test Concurrency Alumni',
      collegeId: college._id,
      email: 'claim_target@concurrency.edu',
      status: 'UNCLAIMED',
      claimToken: 'CONCURRENT_TEST_TOKEN_123',
      claimTokenExpiresAt: new Date(Date.now() + 86400000), // tomorrow
      graduationYear: 2020,
      degree: 'B.Tech',
      branch: 'Computer Science'
    }).save();

    console.log("Setup complete. Starting 10 concurrent claim requests...");

    // 2. Fire 10 concurrent requests from 10 DIFFERENT users with the SAME token
    const requestPromises = testUsers.map((user, idx) => {
      const token = jwt.sign({ id: user._id, role: 'alumni' }, JWT_SECRET);
      
      return fetch(`http://localhost:5000/api/alumni/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          token: 'CONCURRENT_TEST_TOKEN_123',
          currentRole: 'Tester',
          currentCompany: 'Test Co'
        })
      }).then(res => res.json().then(data => ({ status: res.status, data, userIndex: idx })));
    });

    const responses = await Promise.all(requestPromises);
    
    // 3. Assertions
    const successCount = responses.filter(r => r.status === 200).length;
    const failCount = responses.filter(r => r.status === 400).length;

    let passed = 0;
    let failed = 0;
    const check = (name, cond) => {
      if (cond) { console.log(`[PASS] ${name}`); passed++; }
      else { console.error(`[FAIL] ${name}`); failed++; }
    }

    check("Exactly 1 request succeeded", successCount === 1);
    check("Other 9 requests were blocked with 400 status", failCount === 9);

    const winnerResponse = responses.find(r => r.status === 200);
    if (winnerResponse) {
      console.log(`Winning user index: ${winnerResponse.userIndex}`);
      const winnerUser = testUsers[winnerResponse.userIndex];
      
      // Check the DB
      const updatedRegistry = await AlumniRegistry.findById(registryRecord._id);
      check("Registry record status is VERIFIED", updatedRegistry.status === 'VERIFIED');
      check("Registry record claimedBy matches winner", updatedRegistry.claimedBy.toString() === winnerUser._id.toString());
      check("Registry record claimToken is null", updatedRegistry.claimToken === null);

      const createdProfile = await AlumniProfile.findOne({ userId: winnerUser._id });
      check("AlumniProfile was created for winner", !!createdProfile);
      check("AlumniProfile links to registryId", createdProfile.registryId.toString() === registryRecord._id.toString());
      
      const otherProfiles = await AlumniProfile.find({ registryId: registryRecord._id, userId: { $ne: winnerUser._id } });
      check("No other profiles point to this registry record", otherProfiles.length === 0);
    } else {
      console.error("[FAIL] No request succeeded.");
      failed++;
    }

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    // 4. Cleanup
    if (college) await College.findByIdAndDelete(college._id);
    if (registryRecord) await AlumniRegistry.findByIdAndDelete(registryRecord._id);
    for (const user of testUsers) {
      await User.findByIdAndDelete(user._id);
      await AlumniProfile.findOneAndDelete({ userId: user._id });
    }
    mongoose.disconnect();
  }
}

runConcurrencyTests();
