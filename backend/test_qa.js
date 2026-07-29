async function testQAFixes() {
  const register = async (email, username) => {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: username, username, password: '123', role: 'student' })
    });
    const data = await res.json();
    return data.token;
  };

  const login = async (email) => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: '123' })
    });
    return (await res.json()).token;
  };

  let token1, token2;
  try { token1 = await register('qa1@test.com', 'qauser1'); } catch(e) {}
  if (!token1) token1 = await login('qa1@test.com');
  
  try { token2 = await register('qa2@test.com', 'qauser2'); } catch(e) {}
  if (!token2) token2 = await login('qa2@test.com');

  console.log('--- Voting Fix ---');
  let qRes = await fetch('http://localhost:5000/api/qa/questions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test Q', body: 'Test Body', category: 'General' })
  });
  let q = await qRes.json();

  let res1 = await fetch(`http://localhost:5000/api/qa/questions/${q._id}/vote`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote: 1 })
  });
  console.log('User1 self-vote status (should be 403):', res1.status, await res1.json());

  let res2 = await fetch(`http://localhost:5000/api/qa/questions/${q._id}/vote`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ vote: 1 })
  });
  console.log('User2 valid vote status (should be 200):', res2.status, await res2.json());

  console.log('--- XP Exploit Fix ---');
  let a1Res = await fetch(`http://localhost:5000/api/qa/questions/${q._id}/answers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: 'Self answer' })
  });
  let a1 = await a1Res.json();

  let a2Res = await fetch(`http://localhost:5000/api/qa/questions/${q._id}/answers`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: 'Real answer' })
  });
  let a2 = await a2Res.json();

  let res3 = await fetch(`http://localhost:5000/api/qa/answers/${a1._id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('User1 accepting self-answer status (should be 403):', res3.status, await res3.json());

  let res4 = await fetch(`http://localhost:5000/api/qa/answers/${a2._id}/accept`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('User1 accepting User2-answer status (should be 200):', res4.status, await res4.json());

  process.exit(0);
}
testQAFixes();
