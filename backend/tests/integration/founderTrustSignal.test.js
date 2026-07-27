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
const TeamReview = require('../../models/TeamReview');

let mongoServer;
let app;
let testUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);

  // Create test user
  testUser = await User.create({
    username: 'trustuser',
    email: 'trustuser@example.com',
    password: 'password123'
  });
  global.testUserId = testUser._id;

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
  await TeamReview.deleteMany({});
});

describe('Founder Trust Signal API', () => {
  it('should include lightweight trust signal on GET /api/teams (browse)', async () => {
    // Create a team
    await Team.create({
      title: 'First Hackathon Project',
      description: 'Looking for developers to build an awesome app',
      category: 'Hackathon',
      requiredSkills: ['React', 'Node.js'],
      requiredRoles: ['Frontend Developer'],
      teamSize: { current: 1, max: 4 },
      creator: testUser._id,
      status: 'open'
    });

    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    
    const team = res.body.data[0];
    expect(team.creator).toBeDefined();
    expect(team.creator.creatorTrust).toBeDefined();
    expect(team.creator.creatorTrust.teamsCreated).toBe(1);
    expect(team.creator.creatorTrust.teamsCompleted).toBe(0);
    expect(team.creator.creatorTrust.isFirstTimeCreator).toBe(true);
    expect(team.creator.creatorTrust.totalReviews).toBe(0);
  });

  it('should include full breakdown trust signal on GET /api/teams/:id (detail)', async () => {
    // Create a past team that is completed
    const team1 = await Team.create({
      title: 'Completed Project',
      description: 'This was built last semester',
      category: 'Course Project',
      requiredSkills: ['Python'],
      requiredRoles: ['ML Engineer'],
      teamSize: { current: 3, max: 3 },
      creator: testUser._id,
      status: 'completed',
      members: [
        { user: testUser._id, role: 'Leader', joinedAt: new Date() }
      ]
    });

    // Create a second active team
    const team2 = await Team.create({
      title: 'New Hackathon Project',
      description: 'Building a cool AI tool',
      category: 'Hackathon',
      requiredSkills: ['TypeScript'],
      requiredRoles: ['Fullstack Engineer'],
      teamSize: { current: 1, max: 4 },
      creator: testUser._id,
      status: 'open'
    });

    // Create a review for this creator from team1
    const reviewer = await User.create({
      username: 'teammate1',
      email: 'teammate1@example.com',
      password: 'password123'
    });

    await TeamReview.create({
      team: team1._id,
      reviewer: reviewer._id,
      reviewee: testUser._id,
      rating: 5,
      comment: 'Great team leader!'
    });

    const res = await request(app).get(`/api/teams/${team2._id}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const teamDetail = res.body.data;
    expect(teamDetail.creator.creatorTrust).toBeDefined();
    expect(teamDetail.creator.creatorTrust.teamsCreated).toBe(2);
    expect(teamDetail.creator.creatorTrust.teamsCompleted).toBe(1);
    expect(teamDetail.creator.creatorTrust.completionRate).toBe(0.5);
    expect(teamDetail.creator.creatorTrust.averageRatingReceived).toBe(5);
    expect(teamDetail.creator.creatorTrust.totalReviews).toBe(1);
    expect(teamDetail.creator.creatorTrust.isFirstTimeCreator).toBe(false);
  });
});
