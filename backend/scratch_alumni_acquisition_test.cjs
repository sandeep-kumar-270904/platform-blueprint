const mongoose = require('mongoose');
require('dotenv').config();
const { MongoMemoryServer } = require('mongodb-memory-server');

const AlumniRegistry = require('./models/AlumniRegistry');
const AlumniProfile = require('./models/AlumniProfile');
const User = require('./models/User');
const College = require('./models/College');
const Notification = require('./models/Notification');
const crypto = require('crypto');

async function runTest() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Memory Server');

  // Setup test context
  const admin = await User.findOne({ role: 'admin' }) || await User.create({ email: 'admin_alumni@test.com', password: 'test', full_name: 'Admin', role: 'admin' });
  const college = await College.findOne({}) || await College.create({ name: 'Test College', location: { city: 'Test', state: 'TS' }, type: 'Private', fees: { tuition: 1000, hostel: 1000 } });

  console.log(`Using College: ${college.name}`);

  // 1. Simulate Import
  const email = `alumni_${Date.now()}@test.edu`;
  const registry = await AlumniRegistry.create({
    collegeId: college._id,
    fullName: 'Jane Doe Alumni',
    institutionalEmail: email,
    graduationYear: 2023,
    degree: 'B.Tech',
    branch: 'Computer Science',
    status: 'UNCLAIMED'
  });
  console.log(`[+] Created AlumniRegistry record for ${email}`);

  // 2. Simulate Invite
  const token = crypto.randomBytes(32).toString('hex');
  registry.claimToken = token;
  registry.claimTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await registry.save();

  await Notification.create({
    targetEmail: registry.institutionalEmail,
    type: 'alumni_invitation',
    message: 'Invitation to claim your alumni profile',
    actionUrl: `/claim-alumni?token=${token}`,
    deliveryChannels: ['email'],
    emailStatus: 'pending',
    actors: [{ userId: admin._id, name: admin.full_name }],
    metadata: { collegeName: college.name }
  });
  console.log(`[+] Sent Invitation (Notification queued) with token: ${token.substring(0,8)}...`);

  // 3. Concurrency Test
  console.log(`\n[!] Simulating 50 concurrent claims using the SAME token...`);
  const numConcurrent = 50;
  
  // Create 50 fake users to simulate different sessions clicking the claim button
  const users = await Promise.all(Array.from({ length: numConcurrent }).map((_, i) => 
    User.create({
      email: `claimant_${Date.now()}_${i}@test.com`,
      password: 'test',
      full_name: `Claimant ${i}`,
      role: 'user'
    })
  ));

  const claimPromises = users.map(async (user) => {
    // Exact logic from the POST /api/alumni/claim endpoint
    const claimedRegistry = await AlumniRegistry.findOneAndUpdate(
      { 
        claimToken: token, 
        claimTokenExpiresAt: { $gt: new Date() },
        status: 'UNCLAIMED' 
      },
      { 
        $set: { 
          status: 'VERIFIED',
          claimedBy: user._id,
          claimedAt: new Date(),
          claimToken: null,
          claimTokenExpiresAt: null
        }
      },
      { new: true }
    );

    if (claimedRegistry) {
      await AlumniProfile.create({
        userId: user._id,
        collegeId: claimedRegistry.collegeId,
        branch: claimedRegistry.branch,
        graduationYear: claimedRegistry.graduationYear,
        verificationStatus: 'verified',
        verificationMethod: 'institutional-token',
        registryId: claimedRegistry._id,
        visibility: 'students-only'
      });
      return { success: true, userId: user._id };
    }
    return { success: false, userId: user._id };
  });

  const results = await Promise.all(claimPromises);
  
  const successfulClaims = results.filter(r => r.success);
  const failedClaims = results.filter(r => !r.success);

  console.log(`\n--- CONCURRENCY TEST RESULTS ---`);
  console.log(`Total Attempts: ${numConcurrent}`);
  console.log(`Successful Claims: ${successfulClaims.length}`);
  console.log(`Failed Claims (Safe Rejections): ${failedClaims.length}`);

  if (successfulClaims.length === 1) {
    console.log(`[PASS] Exactly one claim succeeded. Atomic locking is working correctly.`);
  } else {
    console.error(`[FAIL] Expected 1 success, but got ${successfulClaims.length}`);
  }

  // Database verification
  const finalRegistry = await AlumniRegistry.findById(registry._id);
  console.log(`\nFinal Registry Status: ${finalRegistry.status}`);
  console.log(`Claimed By User ID: ${finalRegistry.claimedBy}`);
  console.log(`Token Nullified: ${finalRegistry.claimToken === null}`);

  const profilesCreated = await AlumniProfile.countDocuments({ registryId: registry._id });
  console.log(`Total AlumniProfiles created for this registry: ${profilesCreated}`);

  if (profilesCreated === 1) {
     console.log(`[PASS] Database integrity maintained. Only 1 profile exists.`);
  } else {
     console.error(`[FAIL] Duplicate profiles created: ${profilesCreated}`);
  }

  // Cleanup test users
  await User.deleteMany({ _id: { $in: users.map(u => u._id) } });
  await AlumniProfile.deleteMany({ registryId: registry._id });
  await AlumniRegistry.findByIdAndDelete(registry._id);
  
  console.log('\nDone.');
  process.exit(0);
}

runTest().catch(console.error);
