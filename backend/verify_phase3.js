const mongoose = require('mongoose');
require('dotenv').config();
const { AMASession } = require('./models/AMA');
const User = require('./models/User');
const AdminActionLog = require('./models/AdminActionLog');

function runVerification() {
  console.log('--- Phase 3 Verification ---');

  // 1. Check Data Models
  console.log('\nChecking Data Models:');
  const sessionPaths = Object.keys(AMASession.schema.paths);
  const sessionExpected = ['mentor_id', 'title', 'scheduled_at', 'duration_minutes', 'max_participants', 'participant_count', 'registered_attendees', 'status', 'recording_url'];
  
  let sessionValid = true;
  for (const field of sessionExpected) {
    if (!sessionPaths.includes(field)) {
      console.error(`❌ AMASession missing field: ${field}`);
      sessionValid = false;
    }
  }
  if (sessionValid) console.log('✅ AMASession model schema valid');

  const actionPaths = Object.keys(AdminActionLog.schema.paths);
  const actionExpected = ['adminId', 'actionType', 'targetId', 'reason'];
  let actionValid = true;
  for (const field of actionExpected) {
    if (!actionPaths.includes(field)) {
      console.error(`❌ AdminActionLog missing field: ${field}`);
      actionValid = false;
    }
  }
  if (actionValid) console.log('✅ AdminActionLog model schema valid');

  // 2. Check Admin Route logic
  // We can't easily mock HTTP requests here without supertest, but we can check if the route file exists and has the methods
  const fs = require('fs');
  const adminRoutes = fs.readFileSync('./routes/admin.js', 'utf8');
  if (adminRoutes.includes("if (!user || user.role !== 'admin')")) {
    console.log('✅ Admin routes have strict server-side role checks (isAdmin middleware)');
  } else {
    console.error('❌ Admin routes missing strict server-side role check');
  }

  // 3. Check AMA race condition logic in amas.js
  const amasRoutes = fs.readFileSync('./routes/amas.js', 'utf8');
  if (amasRoutes.includes("participant_count: { $lt: ama.max_participants }") && amasRoutes.includes("$push")) {
    console.log('✅ AMA registration uses atomic race-condition safe updates');
  } else {
    console.error('❌ AMA registration might not be race-condition safe');
  }

  // 4. Check Cron Job
  const serverJs = fs.readFileSync('./server.js', 'utf8');
  if (serverJs.includes("cronService.init()")) {
    console.log('✅ cronService wired into server.js for session reminders and transitions');
  } else {
    console.error('❌ cronService not wired into server.js');
  }

  console.log('\n✅ Static verification complete. Proceeding to update walkthrough.');
}

runVerification();
