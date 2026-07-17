const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function run() {
  console.log('--- PHASE 4 QA (Analytics & Gamification) ---');
  let successCount = 0;
  let failureCount = 0;

  function pass(msg) { console.log(`[PASS] ${msg}`); successCount++; }
  function fail(msg) { console.error(`[FAIL] ${msg}`); failureCount++; }

  try {
    const ts = Date.now();
    
    // 1. Register users
    await axios.post(`${API_BASE}/auth/register`, { username: `p4_host_${ts}`, email: `p4_host_${ts}@test.com`, password: 'password123', full_name: 'P4 Host', role: 'student', captchaToken: 'dummy', consent: true });
    await axios.post(`${API_BASE}/auth/register`, { username: `p4_p1_${ts}`, email: `p4_p1_${ts}@test.com`, password: 'password123', full_name: 'P4 P1', role: 'student', captchaToken: 'dummy', consent: true });
    
    const hostLogin = await axios.post(`${API_BASE}/auth/login`, { email: `p4_host_${ts}@test.com`, password: 'password123' });
    const p1Login = await axios.post(`${API_BASE}/auth/login`, { email: `p4_p1_${ts}@test.com`, password: 'password123' });
    
    const hostHeaders = { Authorization: `Bearer ${hostLogin.data.token}` };
    const p1Headers = { Authorization: `Bearer ${p1Login.data.token}` };

    // 2. Create Quiz
    const quizRes = await axios.post(`${API_BASE}/quizzes`, {
      title: `Gamification Quiz ${ts}`,
      description: 'Testing Phase 4',
      category: 'Testing',
      mode: 'live',
      difficulty: 'medium',
      durationMinutes: 10,
      status: 'published',
      questions: [
        { questionText: 'Q1?', options: ['A', 'B'], points: 50, correctOptionIndex: 0 },
        { questionText: 'Q2?', options: ['A', 'B'], points: 50, correctOptionIndex: 0 }
      ]
    }, { headers: hostHeaders });
    const quizId = quizRes.data._id;
    await axios.patch(`${API_BASE}/quizzes/${quizId}/status`, { status: 'published' }, { headers: hostHeaders });
    pass('Created quiz');

    // 3. Attempt Quiz & Gamification Points
    const p1Attempt = await axios.post(`${API_BASE}/quizzes/${quizId}/start`, {}, { headers: p1Headers });
    const p1AttemptId = p1Attempt.data.attempt._id;

    // Wait a little to simulate time taken
    await new Promise(r => setTimeout(r, 100));

    // Submit perfect score
    const submitRes = await axios.post(`${API_BASE}/attempts/${p1AttemptId}/submit`, {
      answers: [
        { questionIndex: 0, selectedOptionIndex: 0 },
        { questionIndex: 1, selectedOptionIndex: 0 }
      ]
    }, { headers: p1Headers });
    
    const result = submitRes.data;
    assert(result.score > 0, 'Score should be calculated');
    pass('Quiz attempt submitted and scored');

    // 4 & 5. Verify Leaderboard Points & Streaks via Global Leaderboard
    const p1UserId = p1Login.data.user._id || p1Login.data.user.id;
    
    // 5. Global Leaderboard Check
    const leaderboardRes = await axios.get(`${API_BASE}/leaderboards/global?limit=50`);
    const globalBoard = leaderboardRes.data;
    const p1InBoard = globalBoard.find(u => u._id.toString() === p1UserId.toString() || u.username === p1Login.data.user.username);
    assert(p1InBoard, 'User should appear in global leaderboard after scoring');
    assert(p1InBoard.points > 0, `User points should be > 0, got ${p1InBoard.points}`);
    pass('Global Leaderboard updated correctly and gamification points added');

    // 6. Analytics Check (Quiz Level)
    const analyticsRes = await axios.get(`${API_BASE}/quizzes/${quizId}/analytics`, { headers: hostHeaders });
    const analytics = analyticsRes.data;
    assert(analytics.attemptCount === 1, 'Quiz analytics attemptCount should be 1');
    assert(analytics.averageScore > 0, 'Quiz analytics averageScore should be calculated');
    pass('Quiz Analytics generated correctly');

  } catch (err) {
    if (err.response) {
      fail(`Unhandled error: ${err.message}. Response data: ${JSON.stringify(err.response.data)}`);
    } else {
      fail(`Unhandled error: ${err.stack || err.message}`);
    }
  }

  if (failureCount > 0) {
    console.error(`\n❌ Phase 4 QA FAILED with ${failureCount} issues.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Phase 4 QA PASSED completely.`);
    process.exit(0);
  }
}

run();
