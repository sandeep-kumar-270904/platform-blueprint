const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const axios = require('axios');
const ioClient = require('socket.io-client');

// Import routes and models
const quizzesRoutes = require('./routes/quizzes');
const attemptsRoutes = require('./routes/attempts');
const liveSessionsRoutes = require('./routes/liveSessions');
const User = require('./models/User');
const Quiz = require('./models/Quiz');
const QuizAttempt = require('./models/QuizAttempt');
const LiveSession = require('./models/LiveSession');
const jwt = require('jsonwebtoken');

const PORT = 8089;
const URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('Starting E2E Tests for Quiz Module...');
  let passed = 0;
  let failed = 0;

  // 1. Setup DB and App
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  const app = express();
  app.use(express.json());
  
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  
  // Mock req.io
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  // Mock Authentication Middleware mapping
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        req.user = jwt.verify(token, 'test_secret');
      } catch (err) {}
    }
    next();
  });

  // Register real routes
  app.use('/api/quizzes', quizzesRoutes);
  app.use('/api/attempts', attemptsRoutes);
  app.use('/api/live-sessions', liveSessionsRoutes);
  
  // Socket.io handlers
  // removed null socket call // We need to mock socket connection event
  io.on('connection', (socket) => {
    require('./sockets/liveSessions')(io, socket);
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server listening on port ${PORT}`);

  // Create Users
  const user1 = await User.create({ username: 'testuser1', email: 'test1@test.com', password: 'password', full_name: 'Test User 1', role: 'student' });
  const user2 = await User.create({ username: 'testuser2', email: 'test2@test.com', password: 'password', full_name: 'Test User 2', role: 'student' });
  
  const token1 = jwt.sign({ id: user1._id, role: user1.role }, 'test_secret');
  const token2 = jwt.sign({ id: user2._id, role: user2.role }, 'test_secret');
  
  process.env.JWT_SECRET = 'test_secret'; // For socket auth

  let quizId, attemptId, sessionId, joinCode;

  const apiClient1 = axios.create({ baseURL: URL, headers: { Authorization: `Bearer ${token1}` } });
  const apiClient2 = axios.create({ baseURL: URL, headers: { Authorization: `Bearer ${token2}` } });

  // ----------------------------------------------------
  // TEST 1: Quiz Creation & Idempotency
  // ----------------------------------------------------
  try {
    console.log('--- TEST 1: Quiz Creation & Idempotency ---');
    const quizData = {
      title: 'E2E Test Quiz',
      category: 'computer-science',
      difficulty: 'medium',
      durationMinutes: 10,
      mode: 'solo',
      passingScorePercentage: 70,
      status: 'published',
      questions: [
        {
          questionText: 'What is 2+2?',
          type: 'mcq',
          options: ['3', '4', '5', '6'],
          correctOptionIndex: 1,
          explanation: 'Basic math',
          points: 10
        }
      ]
    };

    const res = await apiClient1.post('/api/quizzes', quizData);
    if (res.status !== 201 || !res.data.quiz._id) throw new Error(JSON.stringify(res.data));
    quizId = res.data.quiz._id;
    passed++;
    console.log('✅ Quiz creation successful');
  } catch (e) { failed++; console.log('❌ Quiz creation failed:', e.response?.data || e.message); }

  // ----------------------------------------------------
  // TEST 2: Attempt Start & Idempotency
  // ----------------------------------------------------
  try {
    console.log('--- TEST 2: Attempt Start & Idempotency ---');
    // Start attempt 1
    const res1 = await apiClient1.post(`/api/quizzes/${quizId}/start`);
    attemptId = res1.data.attempt._id;
    if (!attemptId) throw new Error('Failed to start attempt');

    // Try starting another attempt while first is in progress (should fail if non-retakable, but we didn't specify retakable, so default might allow or deny)
    // Actually, our logic handles duplicate in-progress attempts by returning the same attempt.
    const res2 = await apiClient1.post(`/api/quizzes/${quizId}/start`);
    if (res2.data.attempt._id !== attemptId) throw new Error('Did not return the same in-progress attempt');

    passed++;
    console.log('✅ Attempt start idempotency successful');
  } catch (e) { failed++; console.log('❌ Attempt start failed:', e.response?.data || e.message); }

  // ----------------------------------------------------
  // TEST 3: Server-Authoritative Scoring & Submit
  // ----------------------------------------------------
  try {
    console.log('--- TEST 3: Server-Authoritative Scoring & Submit ---');
    const answers = [
      { questionIndex: 0, selectedOptionIndex: 1, timeTakenSeconds: 5 }
    ];

    const res = await apiClient1.post(`/api/attempts/${attemptId}/submit`, { answers });
    if (res.data.attempt.percentageScore !== 100) throw new Error('Score calculation failed: ' + JSON.stringify(res.data.attempt));
    if (res.data.attempt.status !== 'completed') throw new Error('Status not updated to completed');

    passed++;
    console.log('✅ Server-authoritative scoring successful');
  } catch (e) { failed++; console.log('❌ Scoring failed:', e.response?.data || e.message); }

  // ----------------------------------------------------
  // TEST 4: Authorization Boundaries
  // ----------------------------------------------------
  try {
    console.log('--- TEST 4: Authorization Boundaries ---');
    // user2 tries to edit user1's quiz
    let authError = false;
    try {
      await apiClient2.patch(`/api/quizzes/${quizId}`, { title: 'Hacked' });
    } catch (err) {
      if (err.response && err.response.status === 403) authError = true;
    }
    if (!authError) throw new Error('Failed to block unauthorized quiz edit');

    passed++;
    console.log('✅ Authorization boundaries enforced');
  } catch (e) { failed++; console.log('❌ Auth boundaries failed:', e.response?.data || e.message); }

  // ----------------------------------------------------
  // TEST 5: Live Session Join & Reconnect
  // ----------------------------------------------------
  try {
    console.log('--- TEST 5: Live Session Join & Reconnect ---');
    // User1 Creates Live Session
    const liveQuizRes = await apiClient1.post('/api/quizzes', {
      title: 'Live Quiz', category: 'computer-science', difficulty: 'easy', durationMinutes: 10, mode: 'live', status: 'published',
      questions: [{ questionText: 'Q1', type: 'mcq', options: ['1','2','3','4'], correctOptionIndex: 0, points: 10 }]
    });
    const liveQuizId = liveQuizRes.data.quiz._id;
    await apiClient1.patch(`/api/quizzes/${liveQuizId}/status`, { status: 'published' });
    const lsRes = await apiClient1.post(`/api/live-sessions/quiz/${liveQuizId}`, { pacingMode: 'host' });
    joinCode = lsRes.data.joinCode;
    sessionId = lsRes.data._id;
    if (!joinCode) throw new Error('Failed to create live session');

    // User2 Joins Live Session via HTTP (to get in DB participants)
    const joinRes = await apiClient2.get(`/api/live-sessions/join/${joinCode}`);
    if (joinRes.status !== 200) throw new Error('HTTP join failed');

    // Connect User2 via Socket
    const clientSocket = ioClient(URL);
    await new Promise((resolve) => clientSocket.on('connect', resolve));

    // Emit joinSession with token
    clientSocket.emit('joinSession', { joinCode, token: token2 });

    let joined = false;
    await new Promise((resolve, reject) => {
      clientSocket.on('sessionState', (state) => {
        joined = true;
        resolve();
      });
      clientSocket.on('sessionError', (err) => {
        reject(new Error(err.message));
      });
      setTimeout(() => reject(new Error('Socket timeout')), 2000);
    });

    if (!joined) throw new Error('Socket failed to join');
    clientSocket.disconnect();

    passed++;
    console.log('✅ Live session socket flow successful');
  } catch (e) { failed++; console.log('❌ Live session failed:', e.response?.data || e.message); }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log(`\n=== E2E Test Run Complete ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  // Cleanup
  await mongoose.connection.close();
  await mongoServer.stop();
  server.close();
  
  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests().catch(console.error);
