const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Models
const User = require('./models/User');
const StudyGroup = require('./models/StudyGroup');
const GroupMessage = require('./models/GroupMessage');
const GroupSession = require('./models/GroupSession');
const Notification = require('./models/Notification');

// Routes
const studyGroupsRoutes = require('./routes/studyGroups');
app.use('/api/study-groups', studyGroupsRoutes);

let mongoServer;
let server;
let io;
let port;

async function runHighRiskAudit() {
  console.log('=== STARTING LIVE E2E AUDIT: HIGH-RISK UNTESTED ITEMS ===\n');

  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  server = http.createServer(app);
  io = new Server(server);
  app.set('io', io);

  await new Promise(resolve => {
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  const jwtSecret = 'supersecret_antigravity_jwt_key_2026';

  // Create Users
  const u1 = await User.create({ username: 'OwnerUser', email: 'owner@test.com', password: 'pwd', role: 'user' });
  const u2 = await User.create({ username: 'MemberUser', email: 'member@test.com', password: 'pwd', role: 'user' });
  const u3 = await User.create({ username: 'BlockedUser', email: 'blocked@test.com', password: 'pwd', role: 'user' });

  const t1 = jwt.sign({ id: u1._id.toString(), role: 'user' }, jwtSecret);
  const t2 = jwt.sign({ id: u2._id.toString(), role: 'user' }, jwtSecret);
  const t3 = jwt.sign({ id: u3._id.toString(), role: 'user' }, jwtSecret);

  console.log('--- TEST 1: MEMBER LIMIT ENFORCEMENT ---');
  console.log('Action: OwnerUser creates group with member_limit: 2.');
  const createRes = await request(app)
    .post('/api/study-groups')
    .set('Authorization', 'Bearer ' + t1)
    .send({ name: 'Limited Group', description: 'Testing member limits', category: 'Data Structures', privacy: 'public', member_limit: 2 });
  
  const groupId = createRes.body._id;
  console.log(`  -> Created Group ID: ${groupId}, Limit: ${createRes.body.member_limit}, Active Members: 1 (Owner)`);

  console.log('Action: MemberUser (User B) joins public group.');
  const joinB = await request(app)
    .post(`/api/study-groups/${groupId}/join`)
    .set('Authorization', 'Bearer ' + t2);
  console.log(`  -> Join User B Status: ${joinB.status} (${joinB.body.message})`);

  console.log('Action: BlockedUser (User C) attempts to join full group.');
  const joinC = await request(app)
    .post(`/api/study-groups/${groupId}/join`)
    .set('Authorization', 'Bearer ' + t3);
  console.log(`  -> Join User C Status: ${joinC.status}`);
  console.log(`  -> Response Body: JSON=${JSON.stringify(joinC.body)}`);
  if (joinC.status === 400 && joinC.body.message.includes('limit')) {
    console.log('  -> [PASS] Member limit enforcement verified. User C blocked.\n');
  } else {
    console.error('  -> [FAIL] Member limit not enforced correctly.');
    process.exit(1);
  }

  console.log('--- TEST 2: LEAVE GROUP ---');
  console.log('Action: MemberUser leaves the group.');
  const leaveRes = await request(app)
    .post(`/api/study-groups/${groupId}/leave`)
    .set('Authorization', 'Bearer ' + t2);
  console.log(`  -> Leave Status: ${leaveRes.status} (${leaveRes.body.message})`);

  const dbGroupAfterLeave = await StudyGroup.findById(groupId);
  console.log(`  -> DB Members count after leave: ${dbGroupAfterLeave.memberships.length}`);

  console.log('Action: MemberUser attempts to send chat message after leaving.');
  const msgAfterLeave = await request(app)
    .post(`/api/study-groups/${groupId}/messages`)
    .set('Authorization', 'Bearer ' + t2)
    .send({ text: 'Should fail' });
  console.log(`  -> Send Message Status: ${msgAfterLeave.status} (${JSON.stringify(msgAfterLeave.body)})`);
  if (msgAfterLeave.status === 403 && dbGroupAfterLeave.memberships.length === 1) {
    console.log('  -> [PASS] Leave group verified. Record removed from DB & access revoked.\n');
  } else {
    console.error('  -> [FAIL] Leave group behavior incorrect.');
    process.exit(1);
  }

  console.log('--- TEST 3: OWNERSHIP TRANSFER ---');
  console.log('Action: MemberUser rejoins group for ownership transfer test.');
  await request(app).post(`/api/study-groups/${groupId}/join`).set('Authorization', 'Bearer ' + t2);

  console.log('Action: OwnerUser transfers ownership to MemberUser.');
  const transferRes = await request(app)
    .post(`/api/study-groups/${groupId}/transfer-ownership`)
    .set('Authorization', 'Bearer ' + t1)
    .send({ newOwnerId: u2._id.toString() });
  console.log(`  -> Transfer Status: ${transferRes.status} (${transferRes.body.message})`);

  const groupAfterTransfer = await StudyGroup.findById(groupId);
  console.log(`  -> New Owner ID in DB: ${groupAfterTransfer.owner_id}`);

  console.log('Action: Former owner (OwnerUser) attempts to delete group.');
  const delFail = await request(app)
    .delete(`/api/study-groups/${groupId}`)
    .set('Authorization', 'Bearer ' + t1);
  console.log(`  -> Former Owner Delete Status: ${delFail.status} (${JSON.stringify(delFail.body)})`);
  if (transferRes.status === 200 && delFail.status === 403 && groupAfterTransfer.owner_id.toString() === u2._id.toString()) {
    console.log('  -> [PASS] Ownership transfer verified. Privileges reassigned in DB.\n');
  } else {
    console.error('  -> [FAIL] Ownership transfer failed.');
    process.exit(1);
  }

  console.log('--- TEST 4: DELETE GROUP CASCADE ---');
  console.log('Action: Seeding messages, sessions, and notifications for the group before deletion.');
  await GroupMessage.create({ group_id: groupId, sender: u2._id, text: 'Test message 1' });
  await GroupMessage.create({ group_id: groupId, sender: u1._id, text: 'Test message 2' });
  await GroupSession.create({
    group_id: groupId,
    creator_id: u2._id,
    title: 'Cascade Session',
    scheduled_at: new Date(Date.now() + 86400000),
    duration_minutes: 60
  });
  await Notification.create({ userId: u1._id, type: 'group_join_request', relatedContentId: groupId, message: 'Invite' });

  const msgCountBefore = await GroupMessage.countDocuments({ group_id: groupId });
  const sessCountBefore = await GroupSession.countDocuments({ group_id: groupId });
  const notifCountBefore = await Notification.countDocuments({ relatedContentId: groupId });
  console.log(`  -> DB State before delete: Messages=${msgCountBefore}, Sessions=${sessCountBefore}, Notifications=${notifCountBefore}`);

  console.log('Action: New Owner (MemberUser) deletes group.');
  const delSuccess = await request(app)
    .delete(`/api/study-groups/${groupId}`)
    .set('Authorization', 'Bearer ' + t2);
  console.log(`  -> Delete Status: ${delSuccess.status} (${delSuccess.body.message})`);

  const groupInDb = await StudyGroup.findById(groupId);
  const msgCountAfter = await GroupMessage.countDocuments({ group_id: groupId });
  const sessCountAfter = await GroupSession.countDocuments({ group_id: groupId });
  const notifCountAfter = await Notification.countDocuments({ relatedContentId: groupId });
  console.log(`  -> DB State after delete: GroupDoc=${groupInDb}, Messages=${msgCountAfter}, Sessions=${sessCountAfter}, Notifications=${notifCountAfter}`);

  if (!groupInDb && msgCountAfter === 0 && sessCountAfter === 0 && notifCountAfter === 0) {
    console.log('  -> [PASS] Cascade delete verified. Group and all associated records wiped from DB.\n');
  } else {
    console.error('  -> [FAIL] Cascade deletion incomplete.');
    process.exit(1);
  }

  console.log('=== ALL 4 HIGH-RISK UNTESTED ITEMS VERIFIED LIVE IN DB ===');
  await mongoose.disconnect();
  await mongoServer.stop();
  server.close();
  process.exit(0);
}

runHighRiskAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
