const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://127.0.0.1:5000/api';
const WS_BASE = 'http://127.0.0.1:5000';

async function run() {
  console.log('--- PHASE 2 QA ---');
  let failures = 0;
  const assert = (condition, msg) => {
    if (condition) console.log(`[PASS] ${msg}`);
    else { console.error(`[FAIL] ${msg}`); failures++; }
  };

  try {
    const timestamp = Date.now();
    const pw = 'Password123!';
    
    // Create users: host, player1, player2, player3 (for reporting), admin
    const hostRes = await axios.post(`${API_BASE}/auth/register`, { username: `host_${timestamp}`, email: `host_${timestamp}@test.com`, password: pw, role: 'student', captchaToken: 'dummy', consent: true });
    const p1Res = await axios.post(`${API_BASE}/auth/register`, { username: `p1_${timestamp}`, email: `p1_${timestamp}@test.com`, password: pw, role: 'student', captchaToken: 'dummy', consent: true });
    const p2Res = await axios.post(`${API_BASE}/auth/register`, { username: `p2_${timestamp}`, email: `p2_${timestamp}@test.com`, password: pw, role: 'student', captchaToken: 'dummy', consent: true });
    const p3Res = await axios.post(`${API_BASE}/auth/register`, { username: `p3_${timestamp}`, email: `p3_${timestamp}@test.com`, password: pw, role: 'student', captchaToken: 'dummy', consent: true });
    const adminRes = await axios.post(`${API_BASE}/auth/register`, { username: `admin_${timestamp}`, email: `admin_${timestamp}@test.com`, password: pw, role: 'admin', captchaToken: 'dummy', consent: true });
    
    // console.log(hostRes.data);
    const hostId = hostRes.data.user.id || hostRes.data.user._id;
    const p1Id = p1Res.data.user.id || p1Res.data.user._id;
    const p2Id = p2Res.data.user.id || p2Res.data.user._id;
    
    await axios.put(`${API_BASE}/auth/test/upgrade-role`, { email: `admin_${timestamp}@test.com`, role: 'admin' });

    const hostHeaders = { Authorization: `Bearer ${hostRes.data.token}` };
    const p1Headers = { Authorization: `Bearer ${p1Res.data.token}` };
    const p2Headers = { Authorization: `Bearer ${p2Res.data.token}` };
    const p3Headers = { Authorization: `Bearer ${p3Res.data.token}` };
    const adminHeaders = { Authorization: `Bearer ${adminRes.data.token}` };

    // Create Quiz
    const quizRes = await axios.post(`${API_BASE}/quizzes`, {
      title: `Live Quiz ${timestamp}`, category: 'Math', difficulty: 'easy', mode: 'live',
      status: 'published', durationMinutes: 10, perQuestionTimeLimitSeconds: 15,
      questions: [
        { questionText: "1+1?", options: ["1","2","3","4"], correctOptionIndex: 1, points: 10 },
        { questionText: "2+2?", options: ["2","4","6","8"], correctOptionIndex: 1, points: 10 }
      ]
    }, { headers: hostHeaders });
    const quizId = quizRes.data._id;
    await axios.patch(`${API_BASE}/quizzes/${quizId}`, { status: 'published' }, { headers: hostHeaders });
    assert(quizId, 'Created live quiz');

    // 1. Host live session
    const sessionRes = await axios.post(`${API_BASE}/live-sessions/quiz/${quizId}`, { pacingMode: 'host' }, { headers: hostHeaders });
    const joinCode = sessionRes.data.joinCode;
    const sessionId = sessionRes.data._id;
    assert(joinCode && joinCode.length === 6, `Generated unique joinCode: ${joinCode}`);

    // Create socket clients
    const hostSocket = io(WS_BASE, { auth: { token: hostRes.data.token } });
    const p1Socket = io(WS_BASE, { auth: { token: p1Res.data.token } });
    const p2Socket = io(WS_BASE, { auth: { token: p2Res.data.token } });

    await new Promise(r => {
      let connected = 0;
      const onConnect = () => { if (++connected === 3) r(); };
      hostSocket.on('connect', onConnect);
      p1Socket.on('connect', onConnect);
      p2Socket.on('connect', onConnect);
      // Fallback
      setTimeout(r, 1000);
    });

    await new Promise(r => setTimeout(r, 1000));

    // 2. Join from 2 accounts -> confirm broadcast
    let p1Joined = false;
    let p2Joined = false;
    hostSocket.emit('joinSession', { joinCode, userId: hostId });
    await new Promise(r => setTimeout(r, 200));
    hostSocket.on('participantUpdate', (data) => {
      console.log('participantUpdate:', JSON.stringify(data));
      if (data.participants && data.participants.some(p => p.name === `p1_${timestamp}`)) p1Joined = true;
      if (data.participants && data.participants.some(p => p.name === `p2_${timestamp}`)) p2Joined = true;
    });

    p1Socket.emit('joinSession', { joinCode, userId: p1Id });
    p2Socket.emit('joinSession', { joinCode, userId: p2Id });
    await new Promise(r => setTimeout(r, 500));
    assert(p1Joined && p2Joined, 'Socket.io broadcasted participantJoined for both users');

    // 3. Start session -> Confirm broadcast, no data leak
    let p1Q1Data = null;
    p1Socket.on('questionBroadcast', (data) => { p1Q1Data = data; });
    
    hostSocket.emit('startSession', { sessionId, hostId });
    await new Promise(r => setTimeout(r, 500));
    
    assert(p1Q1Data && p1Q1Data.questionIndex === 0, 'Question 1 broadcasted');
    if (p1Q1Data) {
      assert(p1Q1Data.question.correctOptionIndex === undefined && p1Q1Data.question.explanation === undefined, 'No data leak in question broadcast');
    }

    // 4. Submit answers at diff speeds
    p1Socket.emit('submitAnswer', { sessionId, userId: p1Id, questionIndex: 0, selectedOptionIndex: 1, timeTakenSeconds: 2 });
    await new Promise(r => setTimeout(r, 3000));
    p2Socket.emit('submitAnswer', { sessionId, userId: p2Id, questionIndex: 0, selectedOptionIndex: 1, timeTakenSeconds: 4 });

    // Host ends question 1
    let hostLeaderboard = null;
    hostSocket.on('leaderboardUpdate', (data) => { hostLeaderboard = data.leaderboard; });
    hostSocket.emit('advanceQuestion', { sessionId, hostId });
    await new Promise(r => setTimeout(r, 500));
    
    assert(hostLeaderboard && hostLeaderboard.length >= 2, 'Live leaderboard updated');
    const p1Score = hostLeaderboard.find(l => l.name === `p1_${timestamp}`)?.score;
    const p2Score = hostLeaderboard.find(l => l.name === `p2_${timestamp}`)?.score;
    assert(p1Score > p2Score, `Time bonus computed correctly (P1: ${p1Score}, P2: ${p2Score})`);

    // 5. Late submit
    p1Socket.emit('submitAnswer', { sessionId, userId: p1Id, questionIndex: 0, selectedOptionIndex: 1, timeTakenSeconds: 2 });
    await new Promise(r => setTimeout(r, 200));

    // Submit Q2
    p1Socket.emit('submitAnswer', { sessionId, userId: p1Id, questionIndex: 1, selectedOptionIndex: 1, timeTakenSeconds: 1 });
    p2Socket.emit('submitAnswer', { sessionId, userId: p2Id, questionIndex: 1, selectedOptionIndex: 2, timeTakenSeconds: 1 });
    
    // 6. End session
    hostSocket.emit('advanceQuestion', { sessionId, hostId }); // Q2 end -> ends session
    await new Promise(r => setTimeout(r, 500));

    const p1Attempts = await axios.get(`${API_BASE}/attempts/me`, { headers: p1Headers });
    assert(p1Attempts.data.some(a => a.quiz._id === quizId && a.sourceLiveSession === sessionId), 'QuizAttempt created for P1, live-sourced');

    // 7. Rejoin mid-session
    const sessionRes2 = await axios.post(`${API_BASE}/live-sessions/quiz/${quizId}`, { pacingMode: 'host' }, { headers: hostHeaders });
    const sessionId2 = sessionRes2.data._id;
    p1Socket.emit('joinSession', { joinCode: sessionRes2.data.joinCode, userId: p1Id });
    await new Promise(r => setTimeout(r, 200));
    hostSocket.emit('startSession', { sessionId: sessionId2, hostId });
    await new Promise(r => setTimeout(r, 200));
    p1Socket.disconnect();
    await new Promise(r => setTimeout(r, 200));
    const p1SocketRejoin = io(WS_BASE, { auth: { token: p1Res.data.token } });
    let rejoinedState = null;
    p1SocketRejoin.on('sessionState', (data) => { rejoinedState = data; });
    p1SocketRejoin.emit('joinSession', { joinCode: sessionRes2.data.joinCode, userId: p1Id });
    await new Promise(r => setTimeout(r, 500));
    assert(rejoinedState && rejoinedState.status === 'in_progress', 'Rejoined mid-session successfully');

    // 8. Report quiz 3 times
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: p1Headers });
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: p2Headers });
    await axios.post(`${API_BASE}/quizzes/${quizId}/report`, { reason: 'spam' }, { headers: p3Headers });
    
    const quizAfterReport = await axios.get(`${API_BASE}/quizzes/${quizId}`);
    assert(quizAfterReport.data.status === 'under_review', 'Quiz auto-hidden after 3 reports');

    // 9. Admin dismiss reports
    const reportsRes = await axios.get(`${API_BASE}/admin/quiz-reports`, { headers: adminHeaders });
    const reports = reportsRes.data.reports.filter(r => r.targetId === quizId || r.target_id === quizId);
    
    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[0]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });
    let checkQuiz = await axios.get(`${API_BASE}/quizzes/${quizId}`);
    assert(checkQuiz.data.status === 'under_review', 'Quiz remains under_review with 2 reports pending');

    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[1]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });
    await axios.patch(`${API_BASE}/admin/quiz-reports/${reports[2]._id}`, { status: 'reviewed_dismissed' }, { headers: adminHeaders });
    
    checkQuiz = await axios.get(`${API_BASE}/quizzes/${quizId}`);
    assert(checkQuiz.data.status === 'published', 'Quiz restored to published after all reports dismissed');

    hostSocket.disconnect();
    p1Socket.disconnect();
    p2Socket.disconnect();
    p1SocketRejoin.disconnect();

  } catch (err) {
    console.error('Unhandled error:', err.response ? JSON.stringify(err.response.data) : err.stack);
    failures++;
  }
  
  if (failures === 0) console.log('\n✅ Phase 2 QA PASSED completely.');
  else console.log(`\n❌ Phase 2 QA FAILED with ${failures} issues.`);
  
  process.exit(failures === 0 ? 0 : 1);
}

run();
