const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

// Models
const User = require('./models/User');
const StudyGroup = require('./models/StudyGroup');
const GroupMessage = require('./models/GroupMessage');
const GroupSession = require('./models/GroupSession');
const Report = require('./models/Report');

// Routes
const studyGroupsRoutes = require('./routes/studyGroups');
const adminStudyGroupsRoutes = require('./routes/adminStudyGroups');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const authMiddleware = require('./middleware/auth');

app.use('/api/study-groups', studyGroupsRoutes);
app.use('/api/admin/study-groups', adminStudyGroupsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);

let mongoServer;
let server;
let io;
let port;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runLiveAudit() {
  console.log('=== LIVE AUDIT EXECUTION TRACE ===\n');
  
  // Setup Memory Server
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  
  // Setup Http and Socket Server
  server = http.createServer(app);
  io = new Server(server);
  app.set('io', io);
  
  // Minimal socket setup matching server.js
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, 'supersecret_antigravity_jwt_key_2026');
      socket.user = await User.findById(decoded.id);
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_group_room', async (data) => {
      const groupId = typeof data === 'string' ? data : data.groupId;
      socket.join('group_' + groupId);
    });
    socket.on('join_group', async (groupId) => {
      socket.join('group_' + groupId);
    });
    socket.on('send_message', async (data) => {
      const msg = await GroupMessage.create({
        group_id: data.groupId,
        sender: socket.user._id,
        text: data.text
      });
      io.to('group_' + data.groupId).emit('receive_message', msg);
    });
  });

  await new Promise(resolve => {
    server.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });
  
  // Seed Users
  const jwtSecret = 'supersecret_antigravity_jwt_key_2026';
  const u1 = await User.create({ username: 'UserA', email: 'a@test.com', password: 'pwd', role: 'user' });
  const u2 = await User.create({ username: 'UserB', email: 'b@test.com', password: 'pwd', role: 'user' });
  const admin = await User.create({ username: 'Admin', email: 'admin@test.com', password: 'pwd', role: 'admin' });

  const t1 = jwt.sign({ id: u1._id.toString(), role: 'user' }, jwtSecret);
  const t2 = jwt.sign({ id: u2._id.toString(), role: 'user' }, jwtSecret);
  const tAdmin = jwt.sign({ id: admin._id.toString(), role: 'admin' }, jwtSecret);

  console.log('1. Create a new group as User A. Confirm it persists — fetch it back from a fresh page load.');
  const createRes = await request(app)
    .post('/api/study-groups')
    .set('Authorization', 'Bearer ' + t1)
    .send({ name: 'Live Audit Group', description: 'Testing 123', category: 'Data Structures', privacy: 'public', member_limit: 10 });
  
  console.log('  -> POST /api/study-groups (Status):', createRes.status);
  const groupId = createRes.body._id;

  if (!groupId) {
    console.log('  -> Aborting tests due to failure in creation.');
    console.log(createRes.body);
    process.exit(1);
  }

  const fetchRes = await request(app)
    .get('/api/study-groups/' + groupId)
    .set('Authorization', 'Bearer ' + t1);
  console.log('  -> GET /api/study-groups/' + groupId + ' (Status):', fetchRes.status);
  console.log('  -> Group Name in DB:', fetchRes.body.name);
  console.log('  -> Members count:', fetchRes.body.memberships.length);
  
  console.log('\n2. Join that group as User B. Confirm User A sees User B in real time via socket without refreshing.');
  const socketA = ioClient(`http://localhost:${port}`, { auth: { token: t1 } });
  await new Promise(r => socketA.on('connect', r));
  socketA.emit('join_group_room', { groupId, userId: u1._id });
  socketA.emit('join_group', groupId);
  await sleep(100);

  let membershipUpdatedPayload = null;
  socketA.on('membership_updated', (data) => {
    membershipUpdatedPayload = data;
  });

  const joinRes = await request(app)
    .post(`/api/study-groups/${groupId}/join`)
    .set('Authorization', 'Bearer ' + t2);
  console.log('  -> POST join (Status):', joinRes.status);
  const updatedGroupAfterJoin = await StudyGroup.findById(groupId);
  console.log('  -> DB state for memberships after join:', updatedGroupAfterJoin.memberships.map(m => m.status));
  await sleep(200);
  console.log('  -> Received membership_updated event on User A socket:', membershipUpdatedPayload ? 'YES' : 'NO');
  if (membershipUpdatedPayload) {
    console.log('  -> Socket Payload Memberships Count:', membershipUpdatedPayload.memberships.length);
    console.log('  -> Socket Payload Members List:', membershipUpdatedPayload.memberships.map(m => `${m.user.username || m.user._id} (${m.status})`));
  }

  console.log('\n3. Send a chat message from User B. Confirm User A receives it in real time.');
  let receivedMessage = null;
  socketA.on('receive_message', (msg) => {
    receivedMessage = msg;
  });

  const socketB = ioClient(`http://localhost:${port}`, { auth: { token: t2 } });
  await new Promise(r => socketB.on('connect', r));
  socketB.emit('join_group', groupId);
  await sleep(100);
  
  socketB.emit('send_message', { groupId, text: 'Hello from User B live test!' });
  await sleep(200); // Wait for propagation

  console.log('  -> Message received by User A via socket:', receivedMessage ? receivedMessage.text : 'FAILED');

  console.log('\n4. Create a session, RSVP as both users, then wait for real time to elapse (genuine transition).');
  const futureDate = new Date(Date.now() + 1000); // 1 second in future
  const sessionRes = await request(app)
    .post(`/api/study-groups/${groupId}/sessions`)
    .set('Authorization', 'Bearer ' + t1)
    .send({ title: 'Live Test Session', scheduled_at: futureDate.toISOString(), duration_minutes: 0.05 }); // 3 seconds duration
  console.log('  -> POST session (Status):', sessionRes.status);
  const sessionId = sessionRes.body._id;

  const rsvpRes = await request(app)
    .post(`/api/study-groups/${groupId}/sessions/${sessionId}/rsvp`)
    .set('Authorization', 'Bearer ' + t2);
  console.log('  -> POST RSVP (Status):', rsvpRes.status);

  // Check initial state (should be upcoming)
  let fetchSessionsRes = await request(app)
    .get(`/api/study-groups/${groupId}/sessions`)
    .set('Authorization', 'Bearer ' + t1);
  const isUpcomingInitial = fetchSessionsRes.body.upcoming.some(s => s._id === sessionId);
  const isPastInitial = fetchSessionsRes.body.past.some(s => s._id === sessionId);
  console.log('  -> Initial check (before time elapses):');
  console.log('     * Is in "upcoming":', isUpcomingInitial);
  console.log('     * Is in "past":', isPastInitial);

  console.log('  -> Waiting 5 seconds for real time to naturally surpass scheduled_at + duration...');
  await sleep(5000);

  // Check state after time has elapsed naturally!
  fetchSessionsRes = await request(app)
    .get(`/api/study-groups/${groupId}/sessions`)
    .set('Authorization', 'Bearer ' + t1);
  const isUpcomingAfter = fetchSessionsRes.body.upcoming.some(s => s._id === sessionId);
  const isPastAfter = fetchSessionsRes.body.past.some(s => s._id === sessionId);
  console.log('  -> After time elapsed naturally:');
  console.log('     * Is in "upcoming":', isUpcomingAfter);
  console.log('     * Is in "past":', isPastAfter);

  console.log('\n5. Trigger a join request on a private group, approve it as owner.');
  const privateGroupRes = await request(app)
    .post('/api/study-groups')
    .set('Authorization', 'Bearer ' + t1)
    .send({ name: 'Private Audit Group', description: 'Testing 123', category: 'Data Structures', privacy: 'private', member_limit: 10 });
  const privGroupId = privateGroupRes.body._id;

  const reqJoinRes = await request(app)
    .post(`/api/study-groups/${privGroupId}/join`)
    .set('Authorization', 'Bearer ' + t2);
  console.log('  -> POST private join (Status):', reqJoinRes.status);
  
  const approveRes = await request(app)
    .put(`/api/study-groups/${privGroupId}/memberships/${u2._id}`)
    .set('Authorization', 'Bearer ' + t1)
    .send({ status: 'active' });
  console.log('  -> PUT approve (Status):', approveRes.status);
  
  const privGroupDB = await StudyGroup.findById(privGroupId);
  const u2PrivStatus = privGroupDB.memberships.find(m => m.user.toString() === u2._id.toString()).status;
  console.log('  -> Requester status in DB:', u2PrivStatus);

  console.log('\n6. Open the Admin Panel as a non-admin user — confirm blocked.');
  const blockedRes = await request(app)
    .get('/api/admin/study-groups')
    .set('Authorization', 'Bearer ' + t1);
  console.log('  -> GET /api/admin/study-groups with User A (Status):', blockedRes.status);
  console.log('  -> Response:', blockedRes.body.message || blockedRes.body);

  console.log('\n7. Report a message, check the Admin Panel moderation queue.');
  const reportRes = await request(app)
    .post('/api/reports')
    .set('Authorization', 'Bearer ' + t1)
    .send({ targetType: 'message', targetId: receivedMessage._id, reason: 'Spam', contextData: { groupId } });
  console.log('  -> POST /api/reports (Status):', reportRes.status);

  const adminQueueRes = await request(app)
    .get('/api/admin/study-groups')
    .set('Authorization', 'Bearer ' + tAdmin);
  console.log('  -> Admin GET groups (Status):', adminQueueRes.status);
  const flaggedGroup = adminQueueRes.body.find(g => g._id === groupId);
  console.log('  -> Group isFlagged in Admin response:', flaggedGroup ? flaggedGroup.isFlagged : 'Not Found');

  console.log('\n8. Check the dashboard widgets.');
  const dashRes = await request(app)
    .get('/api/dashboard/stats')
    .set('Authorization', 'Bearer ' + t1);
  console.log('  -> GET /api/dashboard/stats (Status):', dashRes.status);
  console.log('  -> General Dashboard Teams count:', dashRes.body.teams);
  
  const meRes = await request(app).get('/api/study-groups/dashboard/summary').set('Authorization', 'Bearer ' + t1);
  console.log('  -> GET /api/study-groups/dashboard/summary (Status):', meRes.status);
  console.log('  -> Returned dashboard groups array length:', meRes.body.length);
  
  const upcomingRes = await request(app).get('/api/study-groups/sessions/upcoming').set('Authorization', 'Bearer ' + t1);
  console.log('  -> GET /api/study-groups/sessions/upcoming (Status):', upcomingRes.status);
  console.log('  -> Upcoming RSVP sessions:', upcomingRes.body.length);

  socketA.disconnect();
  socketB.disconnect();
  server.close();
  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('\n=== LIVE AUDIT COMPLETE ===');
}

runLiveAudit().catch(console.error);
