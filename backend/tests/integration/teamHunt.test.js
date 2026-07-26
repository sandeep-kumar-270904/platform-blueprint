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

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);

  // Create test user
  const user = await User.create({
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123'
  });
  global.testUserId = user._id;

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
});

describe('Team Hunt API (Phase 6 Hardening)', () => {
  describe('POST /api/teams', () => {
    it('should create a valid team successfully', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          title: 'Valid Team Project',
          description: 'A great project to learn new things.',
          category: 'Hackathon',
          teamSize: { max: 4, min: 2 }
        });
      if (res.status !== 201) console.log(res.body);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Valid Team Project');
      expect(res.body.data.status).toBe('open');
    });

    it('should reject team creation due to NLP moderation (spam)', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          title: 'Crypto scam project',
          description: 'Join my crypto scam',
          teamSize: { max: 4 }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/flagged content/);
    });

    it('should reject team creation due to NLP moderation (abusive)', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          title: 'Abusive project',
          description: 'I will kill everyone in this project',
          teamSize: { max: 4 }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/flagged content/);
    });
  });
});
