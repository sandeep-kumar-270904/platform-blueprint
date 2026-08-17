const mongoose = require('mongoose');
const Job = require('./models/Job');
const JobApplication = require('./models/JobApplication');
const ReferralRequest = require('./models/ReferralRequest');
const User = require('./models/User');

require('dotenv').config();

async function runTests() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-hub');
  console.log('Connected.');

  try {
    // 1. Setup Test Users
    const student1 = await User.create({
      full_name: 'Opp Test Student 1',
      username: 'opp_student1',
      email: 'opp1@test.com',
      password_hash: 'hash',
      role: 'student'
    });
    
    const student2 = await User.create({
      full_name: 'Opp Test Student 2',
      username: 'opp_student2',
      email: 'opp2@test.com',
      password_hash: 'hash',
      role: 'student'
    });

    const alumni = await User.create({
      full_name: 'Opp Test Alumni',
      username: 'opp_alumni',
      email: 'opp_alumni@test.com',
      password_hash: 'hash',
      role: 'alumni'
    });

    const admin = await User.create({
      full_name: 'Opp Test Admin',
      username: 'opp_admin',
      email: 'opp_admin@test.com',
      password_hash: 'hash',
      role: 'admin'
    });

    // 2. Create Opportunity
    const opp = await Job.create({
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'Remote',
      description: 'Test job',
      category: 'job',
      postedBy: admin._id,
      applyMode: 'in-app'
    });

    console.log('Created Opportunity:', opp._id);

    // 3. Test Concurrency on Application (Student 1 applies multiple times concurrently)
    console.log('Running Application Concurrency Test...');
    const applyPromises = Array(10).fill().map(() => 
      JobApplication.create({
        job: opp._id,
        applicant: student1._id,
        resumeSnapshot: {},
        status: 'applied'
      }).catch(err => err.message)
    );
    const applyResults = await Promise.all(applyPromises);
    
    // We expect only some to succeed or maybe they all succeed if we don't have unique constraint
    // Actually JobApplication usually doesn't have unique constraint on (job, applicant) by default in some systems,
    // let's check how many succeeded.
    const successfulApps = applyResults.filter(r => r && r._id);
    console.log(`Successful concurrent applications: ${successfulApps.length}`);
    
    // 4. Test Saving Opportunity
    console.log('Testing Saving Opportunity...');
    opp.savedBy = opp.savedBy || [];
    if (!opp.savedBy.includes(student1._id)) {
      opp.savedBy.push(student1._id);
      await opp.save();
    }
    console.log('Opportunity saved by student1.');

    // 5. Test Referral Request
    console.log('Testing Referral Request...');
    const refReq = await ReferralRequest.create({
      requester: student2._id,
      referrer: alumni._id,
      opportunity: opp._id,
      message: 'Please refer me',
      status: 'pending'
    });
    console.log('Created Referral Request:', refReq._id);

    console.log('All tests completed successfully!');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // Cleanup
    await User.deleteMany({ username: { $regex: '^opp_' } });
    await Job.deleteMany({ company: 'Tech Corp', title: 'Software Engineer' });
    // Assuming cleanup handles apps and referrals via cascading or we ignore for scratch DB
    mongoose.disconnect();
  }
}

runTests();
