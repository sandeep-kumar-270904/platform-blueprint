require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Classroom = require('./models/VirtualClassroom');
const AlumniProfile = require('./models/AlumniProfile');
const jwt = require('jsonwebtoken');

async function runRegressionTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  let passed = 0;
  let failed = 0;
  
  const check = (name, cond) => {
    if (cond) { console.log(`[PASS] ${name}`); passed++; }
    else { console.error(`[FAIL] ${name}`); failed++; }
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
  
  // Cleanup
  await User.deleteMany({ email: /regression/ });
  await Event.deleteMany({ title: /Regression/ });
  await Classroom.deleteMany({ title: /Regression/ });
  
  try {
    // 1. AlumniProfile Regression
    const alum = await new User({ email: 'regression_alum@test.com', password: 'password', role: 'user', full_name: 'Regression Alum' }).save();
    const profile = await new AlumniProfile({ 
      userId: alum._id, 
      collegeId: new mongoose.Types.ObjectId(), 
      graduationYear: 2020,
      branch: 'Computer Science',
      willingness: { openToMentoring: true } 
    }).save();
    check("AlumniProfile Creation successful", !!profile._id);

    // 2. Event Regression
    const tomorrow = new Date(Date.now() + 86400000);
    const event = await new Event({
      title: 'Regression Event',
      description: 'Test Event',
      eventType: 'workshop',
      hostedBy: alum._id,
      hostName: alum.full_name,
      startDate: tomorrow,
      endDate: tomorrow,
      startTime: '09:00',
      endTime: '17:00',
      isVirtual: true,
      status: 'approved'
    }).save();
    check("Event Creation successful", !!event._id);

    // 3. Classroom Regression
    const classroom = await new Classroom({
      title: 'Regression Classroom',
      subject: 'CS101',
      host_id: alum._id,
      join_code: 'REGRESS',
      scheduled_at: tomorrow
    }).save();
    check("Classroom Creation successful", !!classroom._id);

    // 4. Failure Injection: Invalid Event (Missing Title)
    try {
      const yesterday = new Date(Date.now() - 86400000);
      await new Event({
        // title: 'Regression Event Past', // Intentionally missing
        description: 'Test Event',
        eventType: 'workshop',
        hostedBy: alum._id,
        hostName: alum.full_name,
        startDate: yesterday,
        endDate: yesterday,
        startTime: '09:00',
        endTime: '17:00',
        isVirtual: true,
        status: 'approved'
      }).save();
      check("Failure Injection: Event with missing title is blocked natively", false);
    } catch (err) {
      check("Failure Injection: Event with missing title is blocked natively", err.name === 'ValidationError'); 
    }

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed\n`);
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runRegressionTests();
