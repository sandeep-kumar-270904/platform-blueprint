const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function run() {
  console.log('--- PHASE 5 QA (Admin Dashboard & Consistency) ---');
  let successCount = 0;
  let failureCount = 0;

  function pass(msg) { console.log(`[PASS] ${msg}`); successCount++; }
  function fail(msg) { console.error(`[FAIL] ${msg}`); failureCount++; }

  try {
    const ts = Date.now();
    
    // 1. Admin login
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, { email: 'admin@studenthub.com', password: 'admin123' });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    // 2. Register a new user
    await axios.post(`${API_BASE}/auth/register`, { username: `p5_user_${ts}`, email: `p5_user_${ts}@test.com`, password: 'password123', full_name: 'P5 User', role: 'student', captchaToken: 'dummy', consent: true });
    const p5Login = await axios.post(`${API_BASE}/auth/login`, { email: `p5_user_${ts}@test.com`, password: 'password123' });
    const p5UserId = p5Login.data.user._id || p5Login.data.user.id;
    const p5Headers = { Authorization: `Bearer ${p5Login.data.token}` };

    // 3. Admin: Get Quizzes Overview
    const overviewRes = await axios.get(`${API_BASE}/admin/quizzes-overview`, { headers: adminHeaders });
    assert(overviewRes.data, 'Admin quizzes overview should return data');
    assert(overviewRes.data.quizzes.published >= 0, 'Overview should have quizzes.published');
    pass('Admin summary overview numbers fetched');
    
    // 3.5 Admin: Check Consistency
    const consistencyRes = await axios.get(`${API_BASE}/admin/quizzes-overview/consistency-check`, { headers: adminHeaders });
    assert(Array.isArray(consistencyRes.data.issues), 'Consistency check should return issues array');
    pass('Admin consistency check fetched');

    // 4. Ban User
    await axios.patch(`${API_BASE}/admin/users/${p5UserId}/ban`, { reason: 'Test Ban' }, { headers: adminHeaders });
    
    // Check if banned user can create a quiz
    let bannedFailed = false;
    try {
      await axios.post(`${API_BASE}/quizzes`, {
        title: `Banned Quiz ${ts}`,
        category: 'Testing',
        mode: 'solo',
        difficulty: 'easy',
        durationMinutes: 10,
        questions: [{ questionText: 'Q1?', options: ['A', 'B'], correctOptionIndex: 0 }]
      }, { headers: p5Headers });
    } catch (err) {
      if (err.response && err.response.status === 403) {
        bannedFailed = true;
      }
    }
    assert(bannedFailed, 'Banned user should receive 403 when trying to access protected route');
    pass('Banned user check passed (cannot create quiz)');

    // 5. Unban User
    await axios.patch(`${API_BASE}/admin/users/${p5UserId}/unban`, {}, { headers: adminHeaders });
    pass('User unbanned successfully');
    
    // 6. Report a quiz and Resolve via Admin
    // Create a quiz first
    const quizRes = await axios.post(`${API_BASE}/quizzes`, {
      title: `Admin Moderation Quiz ${ts}`,
      category: 'Testing',
      mode: 'solo',
      difficulty: 'easy',
      durationMinutes: 10,
      questions: [{ questionText: 'Q1?', options: ['A', 'B'], correctOptionIndex: 0 }]
    }, { headers: p5Headers });
    const quizId = quizRes.data._id;
    await axios.patch(`${API_BASE}/quizzes/${quizId}/status`, { status: 'published' }, { headers: p5Headers });
    
    // Report the quiz
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam', details: 'test' }, { headers: p5Headers });
    
    // Get Admin Quiz Reports
    const reportsRes = await axios.get(`${API_BASE}/admin/quiz-reports?status=pending`, { headers: adminHeaders });
    if (!Array.isArray(reportsRes.data)) {
        console.error('reportsRes.data is not an array:', reportsRes.data);
    }
    const targetReport = reportsRes.data.find(r => r.targetId && r.targetId._id === quizId);
    assert(targetReport, 'Admin should see the pending report');
    
    // Resolve report by warning creator
    await axios.patch(`${API_BASE}/admin/quiz-reports/${targetReport._id}`, { action: 'warn_creator', adminNote: 'Be careful' }, { headers: adminHeaders });
    
    const reportsResAfter = await axios.get(`${API_BASE}/admin/quiz-reports`, { headers: adminHeaders });
    const resolvedReport = reportsResAfter.data.find(r => r._id === targetReport._id);
    assert(resolvedReport.status === 'reviewed_actioned', 'Report status should be reviewed_actioned');
    pass('Admin moderation report resolution check passed');

  } catch (err) {
    if (err.response) {
      fail(`Unhandled error: ${err.message}. Response data: ${JSON.stringify(err.response.data)}`);
    } else {
      fail(`Unhandled error: ${err.stack || err.message}`);
    }
  }

  if (failureCount > 0) {
    console.error(`\n❌ Phase 5 QA FAILED with ${failureCount} issues.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Phase 5 QA PASSED completely.`);
    process.exit(0);
  }
}

run();
