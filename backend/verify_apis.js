const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const User = require('./models/User');
const Event = require('./models/Event');
const EventRegistration = require('./models/EventRegistration');
const Team = require('./models/Team');
const TeamMember = require('./models/TeamMember');
const TeamApplication = require('./models/TeamApplication');
const teamController = require('./controllers/teamController');

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub';

// Mock request and response for controller testing
function mockReq(user, body = {}, params = {}, query = {}) {
  return { user, body, params, query };
}

function mockRes() {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.data = data;
    return this;
  };
  return res;
}

async function runApiTests() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
  
  // 1. Setup Data
  const users = await User.find().limit(5);
  if (users.length < 5) throw new Error("Not enough users to run tests.");
  
  const creator = users[0];
  const applicant = users[1];
  const unregistered = users[2];
  const anotherUser = users[3];
  const user5 = users[4];

  // Create a clean test event
  const testEvent = await Event.create({
    title: 'API Test Event',
    description: 'Testing team hunt integration',
    eventType: 'hackathon',
    mode: 'online',
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 86400000 * 2),
    registrationDeadline: new Date(Date.now() + 86400000),
    organizer: creator._id,
    hostedBy: creator._id,
    hostName: 'Test Host',
    startTime: '10:00',
    endTime: '18:00',
    status: 'approved',
    lifecycleStatus: 'upcoming',
    capacity: 100,
    maxTeamSize: 2 // Critical for size tests
  });
  
  console.log(`Created test event: ${testEvent._id}`);
  
  // Register creator and applicant, but NOT unregistered
  await EventRegistration.create({ eventId: testEvent._id, userId: creator._id, status: 'registered' });
  await EventRegistration.create({ eventId: testEvent._id, userId: applicant._id, status: 'registered' });
  await EventRegistration.create({ eventId: testEvent._id, userId: anotherUser._id, status: 'registered' });
  await EventRegistration.create({ eventId: testEvent._id, userId: user5._id, status: 'registered' });

  // Phase 9 Security: Unregistered user tries to create a team
  console.log('--- TEST: Unregistered user creates team ---');
  let req = mockReq({ id: unregistered._id }, { title: 'Illegal Team', description: 'Desc', teamSize: { max: 4 }, eventId: testEvent._id });
  let res = mockRes();
  await teamController.createTeam(req, res);
  if (res.statusCode !== 400 || !res.data.message.includes('registered')) {
    console.error('FAIL: Unregistered user was able to create a team', res.statusCode, res.data);
  } else {
    console.log('PASS: Unregistered user blocked from team creation');
  }

  // Phase 4: Canonical Team Creation (Registered User)
  console.log('--- TEST: Canonical Team Creation ---');
  req = mockReq({ id: creator._id }, { title: 'Alpha Team', description: 'Desc', teamSize: { max: 4 }, category: 'Hackathon', eventId: testEvent._id });
  res = mockRes();
  await teamController.createTeam(req, res);
  
  if (res.statusCode !== 201) throw new Error(`Team creation failed: ${JSON.stringify(res.data)}`);
  const teamId = res.data.data._id;
  console.log('PASS: Team created successfully');
  
  const creatorReg = await EventRegistration.findOne({ eventId: testEvent._id, userId: creator._id });
  if (creatorReg.teamId?.toString() === teamId.toString()) {
    console.log('PASS: EventRegistration.teamId updated successfully');
  } else {
    console.error('FAIL: EventRegistration.teamId NOT updated');
  }
  
  // Phase 5: Team Application (Registered User)
  console.log('--- TEST: Registered user applies to team ---');
  req = mockReq({ id: applicant._id }, { coverLetter: 'Let me join!' }, { id: teamId });
  res = mockRes();
  await teamController.applyToTeam(req, res);
  if (res.statusCode !== 201) throw new Error(`Team application failed: ${JSON.stringify(res.data)}`);
  const appId = res.data.data._id;
  console.log('PASS: Application created successfully');

  // Security: Unregistered user applies to team
  console.log('--- TEST: Unregistered user applies to team ---');
  req = mockReq({ id: unregistered._id }, { coverLetter: 'Illegal' }, { id: teamId });
  res = mockRes();
  await teamController.applyToTeam(req, res);
  if (res.statusCode !== 400) console.error('FAIL: Unregistered user could apply');
  else console.log('PASS: Unregistered user blocked from applying');
  
  // Phase 6: Team Acceptance (Leader accepts applicant)
  console.log('--- TEST: Leader accepts applicant ---');
  req = mockReq({ id: creator._id }, { status: 'accepted' }, { id: teamId, appId: appId });
  res = mockRes();
  await teamController.updateApplicationStatus(req, res);
  if (res.statusCode !== 200) throw new Error(`Acceptance failed: ${JSON.stringify(res.data)}`);
  console.log('PASS: Application accepted');
  
  const applicantReg = await EventRegistration.findOne({ eventId: testEvent._id, userId: applicant._id });
  if (applicantReg && applicantReg.teamId?.toString() === teamId.toString()) {
    console.log('PASS: EventRegistration.teamId updated for applicant');
  } else {
    console.error('FAIL: EventRegistration.teamId NOT updated for applicant (this might be fine if architecture uses TeamMember strictly instead of mirroring it to EventRegistration)');
  }
  
  // Phase 12: Team Size Concurrency / Limits (Max size is 2, currently has 2)
  console.log('--- TEST: Team Size Limits (adding 3rd member to max 2) ---');
  // anotherUser applies
  req = mockReq({ id: anotherUser._id }, { coverLetter: 'Me too!' }, { id: teamId });
  res = mockRes();
  await teamController.applyToTeam(req, res);
  const app2Id = res.data.data._id;
  
  // Creator tries to accept
  req = mockReq({ id: creator._id }, { status: 'accepted' }, { id: teamId, appId: app2Id });
  res = mockRes();
  await teamController.updateApplicationStatus(req, res);
  if (res.statusCode === 400 && res.data.message.includes('Team is already full')) {
    console.log('PASS: Team size limit enforced!');
  } else {
    console.error('FAIL: Team size limit bypassed', res.statusCode, res.data);
  }
  
  // Cleanup test data
  await Event.findByIdAndDelete(testEvent._id);
  await EventRegistration.deleteMany({ eventId: testEvent._id });
  await Team.findByIdAndDelete(teamId);
  await TeamMember.deleteMany({ teamId: teamId });
  await TeamApplication.deleteMany({ team: teamId });

  process.exit(0);
}

runApiTests().catch(err => {
  console.error(err);
  process.exit(1);
});
