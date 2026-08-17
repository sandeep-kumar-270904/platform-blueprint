const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function runConcurrencyTests() {
  console.log("=== RUNNING CONCURRENCY TESTS (Priority 2 & 3) ===");

  await mongoose.connect('mongodb://localhost:27017/studenthub');
  console.log("Connected to DB.");

  const User = mongoose.model('User'); // Schemas should be registered by backend
  const AlumniProfile = mongoose.model('AlumniProfile');
  const ConnectionRequest = mongoose.model('ConnectionRequest');
  const Event = mongoose.model('Event');

  // Create mock data
  const student = await new User({ email: 'concurrent_student@test.com', role: 'student', full_name: 'Concurrent Student' }).save();
  const alumni = await new User({ email: 'concurrent_alum@test.com', role: 'alumni', full_name: 'Concurrent Alumni' }).save();
  const profile = await new AlumniProfile({ userId: alumni._id, collegeId: new mongoose.Types.ObjectId(), willingness: { openToMentoring: true } }).save();

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  const tokenStudent = jwt.sign({ id: student._id, role: 'student' }, JWT_SECRET);
  const tokenAlumni = jwt.sign({ id: alumni._id, role: 'alumni' }, JWT_SECRET);

  let passed = 0;
  let failed = 0;
  
  const check = (name, cond) => {
    if (cond) { console.log(`[PASS] ${name}`); passed++; }
    else { console.error(`[FAIL] ${name}`); failed++; }
  }

  try {
    // ---------------------------------------------------------
    // TEST 1: Concurrent POST /request
    // ---------------------------------------------------------
    console.log("Starting 10 concurrent connection requests...");
    const requestPromises = Array(10).fill(0).map(() => 
      fetch(`http://localhost:5000/api/alumni/connections/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenStudent}` },
        body: JSON.stringify({
          alumniProfileId: profile._id,
          type: 'session_1on1',
          intent: 'Mentorship',
          message: 'Hello'
        })
      })
    );

    const responses = await Promise.all(requestPromises);
    const successCount = responses.filter(r => r.status === 201).length;
    const failCount = responses.filter(r => r.status === 400).length;

    check("Exactly 1 request succeeded", successCount === 1);
    check("Other 9 requests were blocked", failCount === 9);

    // Get the created request
    const pendingReqs = await ConnectionRequest.find({ requesterId: student._id });
    check("Only 1 pending request exists in DB", pendingReqs.length === 1);

    const reqId = pendingReqs[0]._id;

    // ---------------------------------------------------------
    // TEST 2: Concurrent PUT /respond (Accept)
    // ---------------------------------------------------------
    console.log("Starting 10 concurrent accept requests...");
    const acceptPromises = Array(10).fill(0).map(() => 
      fetch(`http://localhost:5000/api/alumni/connections/${reqId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenAlumni}` },
        body: JSON.stringify({
          status: 'accepted'
        })
      })
    );

    const acceptResponses = await Promise.all(acceptPromises);
    const acceptSuccessCount = acceptResponses.filter(r => r.status === 200).length;
    const acceptFailCount = acceptResponses.filter(r => r.status === 404).length; // "already processed" -> 404

    check("Exactly 1 accept succeeded", acceptSuccessCount === 1);
    check("Other 9 accepts safely failed", acceptFailCount === 9);

    const events = await Event.find({ hostedBy: alumni._id });
    check("Exactly 1 Event created for the session", events.length === 1);

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    // Cleanup
    await User.deleteMany({ _id: { $in: [student._id, alumni._id] } });
    await AlumniProfile.deleteMany({ _id: profile._id });
    await ConnectionRequest.deleteMany({ requesterId: student._id });
    await Event.deleteMany({ hostedBy: alumni._id });
    mongoose.disconnect();
    
    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  }
}

runConcurrencyTests();
