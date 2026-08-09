const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function runSecurityTests() {
  console.log("=== RUNNING SECURITY TESTS (Priority 0 & Priority 6) ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  const User = mongoose.model('User', new mongoose.Schema({ email: String, university: String, role: String }, { strict: false }));
  const College = mongoose.model('College', new mongoose.Schema({ name: String }, { strict: false }));
  const AlumniProfile = mongoose.model('AlumniProfile', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, collegeId: mongoose.Schema.Types.ObjectId }, { strict: false }));
  const ConnectionRequest = mongoose.model('ConnectionRequest', new mongoose.Schema({ type: String, isAnonymous: Boolean, requesterId: mongoose.Schema.Types.ObjectId, status: String, alumniProfileId: mongoose.Schema.Types.ObjectId, alumniUserId: mongoose.Schema.Types.ObjectId }, { strict: false }));

  // Create mock data
  const testCollege = await new College({ name: 'Security Test College' }).save();
  const otherCollege = await new College({ name: 'Other College' }).save();

  const studentA = await new User({ email: 'studentA@test.com', university: 'Security Test College', role: 'student', full_name: 'Student A' }).save();
  const studentB = await new User({ email: 'studentB@test.com', university: 'Other College', role: 'student', full_name: 'Student B' }).save();
  
  const alumniA = await new User({ email: 'alumA@test.com', university: 'Security Test College', role: 'alumni', full_name: 'Alumni A' }).save();
  const alumniProfileA = await new AlumniProfile({ userId: alumniA._id, collegeId: testCollege._id }).save();

  // Create an anonymous Q&A to test Privacy (Priority 1)
  const qaRequest = await new ConnectionRequest({
    type: 'qa',
    status: 'completed',
    isAnonymous: true,
    requesterId: studentA._id,
    alumniProfileId: alumniProfileA._id,
    alumniUserId: alumniA._id,
    message: 'Test question'
  }).save();

  // Mint tokens
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  const tokenStudentA = jwt.sign({ id: studentA._id, role: 'student' }, JWT_SECRET);
  const tokenStudentB = jwt.sign({ id: studentB._id, role: 'student' }, JWT_SECRET);

  let passed = 0;
  let failed = 0;
  
  const check = (name, cond) => {
    if (cond) { console.log(`[PASS] ${name}`); passed++; }
    else { console.error(`[FAIL] ${name}`); failed++; }
  }

  try {
    // Test 1: Unauthenticated Q&A Request
    const res1 = await fetch(`http://localhost:5000/api/alumni/connections/qa/${testCollege._id}`);
    check("Unauthenticated Q&A yields 401", res1.status === 401);
    if (res1.status !== 401) console.log("RES1:", res1.status, await res1.text());

    // Test 2: Authenticated Student from same college
    const res2 = await fetch(`http://localhost:5000/api/alumni/connections/qa/${testCollege._id}`, {
      headers: { 'Authorization': `Bearer ${tokenStudentA}` }
    });
    check("Student from same college yields 200", res2.status === 200);
    if (res2.status !== 200) console.log("RES2:", res2.status, await res2.text());

    // Verify Privacy (Priority 1)
    if (res2.status === 200) {
      const data2 = await res2.json();
      const testQa = data2.find(q => q._id === qaRequest._id.toString());
      check("Anonymous QA hides identifying info (Name)", testQa?.requesterId?.full_name === 'Student');
      check("Anonymous QA hides identifying info (ID)", testQa?.requesterId?._id === 'anonymous');
      if (testQa?.requesterId?._id !== 'anonymous') console.log("QA ID:", testQa?.requesterId);
    }

    // Test 3: Authenticated Student from different college
    const res3 = await fetch(`http://localhost:5000/api/alumni/connections/qa/${testCollege._id}`, {
      headers: { 'Authorization': `Bearer ${tokenStudentB}` }
    });
    check("Student from different college yields 403 Forbidden", res3.status === 403);
    if (res3.status !== 403) console.log("RES3:", res3.status, await res3.text());

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    // Cleanup
    await User.deleteMany({ _id: { $in: [studentA._id, studentB._id, alumniA._id] } });
    await College.deleteMany({ _id: { $in: [testCollege._id, otherCollege._id] } });
    await AlumniProfile.deleteMany({ _id: alumniProfileA._id });
    await ConnectionRequest.deleteMany({ _id: qaRequest._id });
    mongoose.disconnect();
    
    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  }
}

runSecurityTests();
