const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');

// Mock Auth Middleware
jest.mock('../../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: global.testUserId };
    next();
  }
}));

const teamRoutes = require('../../routes/teams');
const User = require('../../models/User');
const Team = require('../../models/Team');
const TeamApplication = require('../../models/TeamApplication');
const SkillGapLog = require('../../models/SkillGapLog');
const SecondChanceLog = require('../../models/SecondChanceLog');

let mongoServer;
let app;
let testUser;
let teamCreator;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);

  // Create test user (applicant)
  testUser = await User.create({
    username: 'applicantuser',
    email: 'applicant@example.com',
    password: 'password123',
    skills: [{ skillName: 'React' }, { skillName: 'JavaScript' }]
  });
  global.testUserId = testUser._id;

  // Create team creator
  teamCreator = await User.create({
    username: 'creatoruser',
    email: 'creator@example.com',
    password: 'password123',
    skills: [{ skillName: 'Node.js' }, { skillName: 'MongoDB' }]
  });

  app = express();
  app.use(express.json());
  app.use('/api/teams', teamRoutes);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Team.deleteMany({});
  await TeamApplication.deleteMany({});
  await SkillGapLog.deleteMany({});
  await SecondChanceLog.deleteMany({});
});

describe('Skill Gap Advisor & Second Chance Match API', () => {
  it('should return skill gap advice and resources on GET /api/teams/:id/skill-gap', async () => {
    // Create a team requiring Python and Docker (missing for applicant who only has React/JavaScript)
    const team = await Team.create({
      title: 'Backend AI Platform',
      description: 'Looking for Python developers with Docker knowledge',
      category: 'Hackathon',
      requiredSkills: ['Python', 'Docker'],
      requiredRoles: ['Backend Developer'],
      teamSize: { current: 1, max: 4 },
      creator: teamCreator._id,
      status: 'open'
    });

    const res = await request(app).get(`/api/teams/${team._id}/skill-gap?trigger=low_match_view`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.missingSkills).toContain('python');
    expect(res.body.data.missingSkills).toContain('docker');
    expect(Array.isArray(res.body.data.resources)).toBe(true);
    expect(res.body.data.advisorMessage).toBeDefined();

    // Verify a SkillGapLog was created for deduplication tracking
    const logCount = await SkillGapLog.countDocuments({ user: testUser._id, team: team._id });
    expect(logCount).toBe(1);
  });

  it('should return trending skill gaps on GET /api/teams/me/skill-gaps/trending', async () => {
    // Create team and trigger gap log
    const team = await Team.create({
      title: 'Data Science Project',
      description: 'Need Python and SQL expertise',
      category: 'Research',
      requiredSkills: ['Python', 'SQL'],
      teamSize: { current: 1, max: 3 },
      creator: teamCreator._id,
      status: 'open'
    });

    await SkillGapLog.create({
      user: testUser._id,
      team: team._id,
      missingSkills: ['python', 'sql'],
      triggeredBy: 'low_match_view'
    });

    const res = await request(app).get('/api/teams/me/skill-gaps/trending');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trendingSkills).toBeDefined();
    expect(res.body.data.totalLogs).toBeGreaterThanOrEqual(1);
  });

  it('should enforce rejection requirement and return alternative matches on GET /api/teams/:id/second-chance', async () => {
    // 1. Create target team
    const targetTeam = await Team.create({
      title: 'Frontend React App',
      description: 'Building a cool React application',
      category: 'Startup',
      requiredSkills: ['React', 'TypeScript'],
      teamSize: { current: 3, max: 3 },
      creator: teamCreator._id,
      status: 'open'
    });

    // 2. Create alternative open team looking for React
    const altTeam = await Team.create({
      title: 'React Native Mobile App',
      description: 'Need React developer for mobile app',
      category: 'Startup',
      requiredSkills: ['React'],
      teamSize: { current: 1, max: 4 },
      creator: teamCreator._id,
      status: 'open'
    });

    // 3. Attempt to fetch second chance without a rejected application (should return 403)
    const resForbidden = await request(app).get(`/api/teams/${targetTeam._id}/second-chance`);
    expect(resForbidden.status).toBe(403);

    // 4. Create rejected application
    await TeamApplication.create({
      team: targetTeam._id,
      applicant: testUser._id,
      role: 'Frontend Developer',
      status: 'rejected'
    });

    // 5. Fetch second chance matches now (should return 200 and altTeam)
    const resSuccess = await request(app).get(`/api/teams/${targetTeam._id}/second-chance`);
    expect(resSuccess.status).toBe(200);
    expect(resSuccess.body.success).toBe(true);
    expect(Array.isArray(resSuccess.body.data)).toBe(true);
    expect(resSuccess.body.data.length).toBeGreaterThanOrEqual(1);
    expect(resSuccess.body.data[0]._id.toString()).toBe(altTeam._id.toString());
  });
});
