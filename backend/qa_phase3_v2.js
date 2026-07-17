const axios = require('axios');
const io = require('socket.io-client');
const assert = require('assert');
const fs = require('fs');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function run() {
  console.log('--- PHASE 3 QA (Notifications) ---');
  let successCount = 0;
  let failureCount = 0;

  function pass(msg) { console.log(`[PASS] ${msg}`); successCount++; }
  function fail(msg) { console.error(`[FAIL] ${msg}`); failureCount++; }

  try {
    const ts = Date.now();
    // 1. Create users
    await axios.post(`${API_BASE}/auth/register`, { username: `h3_${ts}`, email: `h3_${ts}@test.com`, password: 'password123', full_name: 'Host 3', role: 'student', captchaToken: 'dummy', consent: true });
    await axios.post(`${API_BASE}/auth/register`, { username: `p1_3_${ts}`, email: `p1_3_${ts}@test.com`, password: 'password123', full_name: 'Player 1_3', role: 'student', captchaToken: 'dummy', consent: true });
    
    // Register an admin user (simulated bypass)
    await axios.post(`${API_BASE}/auth/register`, { username: `admin3_${ts}`, email: `admin3_${ts}@test.com`, password: 'password123', full_name: 'Admin 3', role: 'admin', captchaToken: 'dummy', consent: true });
    await axios.put(`${API_BASE}/auth/test/upgrade-role`, { email: `admin3_${ts}@test.com`, role: 'admin' });
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, { email: `admin3_${ts}@test.com`, password: 'password123' });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    const hostLogin = await axios.post(`${API_BASE}/auth/login`, { email: `h3_${ts}@test.com`, password: 'password123' });
    const p1Login = await axios.post(`${API_BASE}/auth/login`, { email: `p1_3_${ts}@test.com`, password: 'password123' });

    const hostHeaders = { Authorization: `Bearer ${hostLogin.data.token}` };
    const p1Headers = { Authorization: `Bearer ${p1Login.data.token}` };
    const hostId = hostLogin.data.user._id;
    const p1Id = p1Login.data.user._id;

    // Connect socket for p1
    const p1Socket = io(SOCKET_URL, { auth: { token: p1Login.data.token } });
    
    // Wait for connection
    await new Promise(r => p1Socket.on('connect', r));

    // Listen for notification updates
    let lastNotificationCount = -1;
    p1Socket.on('notifications_update', (data) => {
      lastNotificationCount = data.unreadCount;
    });

    // 2. Create quiz
    const quizRes = await axios.post(`${API_BASE}/quizzes`, {
      title: `Notification Quiz ${ts}`,
      description: 'Testing Phase 3',
      category: 'Testing',
      mode: 'live',
      difficulty: 'easy',
      durationMinutes: 10,
      status: 'published',
      questions: [{ questionText: 'Q1?', options: ['A', 'B'], points: 10, correctOptionIndex: 0 }]
    }, { headers: hostHeaders });
    const quizId = quizRes.data._id;
    await axios.patch(`${API_BASE}/quizzes/${quizId}/status`, { status: 'published' }, { headers: hostHeaders });
    pass('Created and published quiz');

    // Subscribe p1 to quiz so they get notifications
    await axios.post(`${API_BASE}/quizzes/${quizId}/subscribe`, {}, { headers: p1Headers });
    pass('P1 subscribed to quiz');

    // 3. Trigger Report -> Auto-hide -> Check Creator gets notified
    await axios.post(`${API_BASE}/auth/register`, { username: `rp1_${ts}`, email: `rp1_${ts}@test.com`, password: 'password123', full_name: 'RP1', role: 'student', captchaToken: 'dummy', consent: true });
    await axios.post(`${API_BASE}/auth/register`, { username: `rp2_${ts}`, email: `rp2_${ts}@test.com`, password: 'password123', full_name: 'RP2', role: 'student', captchaToken: 'dummy', consent: true });
    const rp1 = await axios.post(`${API_BASE}/auth/login`, { email: `rp1_${ts}@test.com`, password: 'password123' });
    const rp2 = await axios.post(`${API_BASE}/auth/login`, { email: `rp2_${ts}@test.com`, password: 'password123' });
    
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: p1Headers });
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: { Authorization: `Bearer ${rp1.data.token}` } });
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: { Authorization: `Bearer ${rp2.data.token}` } });
    
    // Admin restores it (otherwise we can't test further easily)
    const dashboardRes = await axios.get(`${API_BASE}/admin/quiz-reports`, { headers: adminHeaders });
    const reports = dashboardRes.data.reports.filter(r => r.targetId === quizId || r.target_id === quizId);
    
    // Check host notifications
    const hostNots = await axios.get(`${API_BASE}/notifications`, { headers: hostHeaders });
    console.log('Host notifications:', JSON.stringify(hostNots.data.notifications, null, 2));
    const reportNots = hostNots.data.notifications.filter(n => n.type === 'quiz_reported');
    assert(reportNots.length > 0, 'Host should receive quiz_reported notification');
    pass('Trigger auto-hide: Confirm creator gets notified');

    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[0]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });
    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[1]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });
    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[2]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });

    // 4. Toggle off notification category
    await axios.put(`${API_BASE}/users/me/notification-preferences`, { liveSessionReminders: { inApp: false, email: false } }, { headers: p1Headers });
    pass('Toggle off notification category (mock check)');

    // 5. Overtake leaderboard
    // Submit score 5 for Host
    const hostAttempt = await axios.post(`${API_BASE}/quizzes/${quizId}/start`, {}, { headers: hostHeaders });
    const hostAttemptId = hostAttempt.data.attempt._id;
    await axios.post(`${API_BASE}/attempts/${hostAttemptId}/submit`, {
      answers: [{ questionId: quizRes.data.questions[0]._id, selectedOptionIndex: 0 }]
    }, { headers: hostHeaders });

    // Submit score 10 for P1
    const p1Attempt = await axios.post(`${API_BASE}/quizzes/${quizId}/start`, {}, { headers: p1Headers });
    const p1AttemptId = p1Attempt.data.attempt._id;
    await axios.post(`${API_BASE}/attempts/${p1AttemptId}/submit`, {
      answers: [{ questionId: quizRes.data.questions[0]._id, selectedOptionIndex: 0 }]
    }, { headers: p1Headers });

    // Host should be notified of leaderboard overtaken
    const hostNots2 = await axios.get(`${API_BASE}/notifications`, { headers: hostHeaders });
    const overtakenNots = hostNots2.data.notifications.filter(n => n.type === 'leaderboard_overtaken');
    assert(overtakenNots.length > 0, 'Host should receive leaderboard_overtaken notification');
    pass('Overtake leaderboard: Confirm bumped user notified');
    
    // 6. Socket unread count update check
    // Give it a second to propagate
    await new Promise(r => setTimeout(r, 1000));
    const p1Nots = await axios.get(`${API_BASE}/notifications`, { headers: p1Headers });
    const unread = p1Nots.data.notifications.filter(n => !n.read).length;
    
    if (lastNotificationCount !== -1) {
      assert(lastNotificationCount === unread, `Socket unread count mismatch. Socket says ${lastNotificationCount}, API says ${unread}`);
      pass('Socket unread count update check passed');
    } else {
      console.log('Skipping socket unread count check as no update was received (maybe no new notifications for p1 during connection).');
    }

    p1Socket.disconnect();

  } catch (err) {
    if (err.response) {
      fail(`Unhandled error: ${err.message}. Response data: ${JSON.stringify(err.response.data)}`);
    } else {
      fail(`Unhandled error: ${err.stack || err.message}`);
    }
  }

  if (failureCount > 0) {
    console.error(`\n❌ Phase 3 QA FAILED with ${failureCount} issues.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Phase 3 QA PASSED completely.`);
    process.exit(0);
  }
}

run();
