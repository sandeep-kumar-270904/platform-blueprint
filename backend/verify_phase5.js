const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Verifying Phase 5 ---');

  // Register Student
  const studentEmail = `student${Date.now()}@studenthub.com`;
  console.log(`Registering new student ${studentEmail}`);
  const studentRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: 'password123', full_name: 'Test Student', username: `student${Date.now()}`, captchaToken: 'skip_captcha', consent: true })
  });
  const studentBody = await studentRes.json();
  const { token: studentToken, user: studentUser } = studentBody;
  if (!studentToken) throw new Error(`Failed to register student: ${JSON.stringify(studentBody)}`);

  // Direct DB update removed. We will search by preferredRole instead.

  // Register Recruiter
  const recruiterEmail = `recruiter${Date.now()}@studenthub.com`;
  console.log(`Registering new recruiter ${recruiterEmail}`);
  const recruiterRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recruiterEmail, password: 'password123', full_name: 'Test Recruiter', username: `recruiter${Date.now()}`, captchaToken: 'skip_captcha', consent: true })
  });
  const { token: recruiterToken, user: recruiterUser } = await recruiterRes.json();
  if (!recruiterToken) throw new Error('Failed to register recruiter');

  // Recruiter verification removed. The viewer will show up as "A recruiter".

  // 1. Student updates visibility
  console.log('Student updates visibility settings to TRUE...');
  const visRes = await fetch(`${API_URL}/api/users/me/visibility`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visibleToRecruiters: true,
      openToWork: true,
      visiblePreferredRoles: ['Frontend Developer']
    })
  });
  if (!visRes.ok) {
    const errText = await visRes.text();
    throw new Error(`Failed to update visibility: ${errText}`);
  }

  // 2. Recruiter searches for candidate
  console.log('Recruiter searching for candidates with preferredRole Frontend Developer...');
  let searchRes = await fetch(`${API_URL}/api/recruiter/candidates?preferredRole=Frontend`, {
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  let candidates = await searchRes.json();
  const foundCandidate = candidates.find((c) => c._id === studentUser.id);
  if (foundCandidate) {
    console.log('✅ Student found in search results');
  } else {
    console.error('❌ Student NOT found in search results');
    process.exit(1);
  }

  // 3. Recruiter views candidate profile
  console.log('Recruiter views student profile...');
  const viewRes = await fetch(`${API_URL}/api/recruiter/candidates/${studentUser.id}`, {
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  if (viewRes.ok) {
    console.log('✅ Recruiter viewed profile successfully');
  } else {
    console.error('❌ Failed to view profile');
    process.exit(1);
  }

  // 4. Student checks analytics
  console.log('Student checks visibility analytics...');
  const analyticsRes = await fetch(`${API_URL}/api/users/me/visibility-analytics`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const analytics = await analyticsRes.json();
  console.log('Analytics data:', JSON.stringify(analytics, null, 2));
  
  if (analytics.profileViewCount === 1 && analytics.recentViewers[0]?.name === 'A recruiter') {
    console.log('✅ Analytics correctly shows view count and masked recruiter name');
  } else {
    console.error('❌ Analytics data incorrect', analytics);
    process.exit(1);
  }

  // 5. Student turns off visibility
  console.log('Student updates visibility settings to FALSE...');
  await fetch(`${API_URL}/api/users/me/visibility`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      visibleToRecruiters: false
    })
  });

  // 6. Recruiter searches again
  console.log('Recruiter searching again...');
  searchRes = await fetch(`${API_URL}/api/recruiter/candidates?preferredRole=Frontend`, {
    headers: { 'Authorization': `Bearer ${recruiterToken}` }
  });
  candidates = await searchRes.json();
  if (candidates.some((c) => c._id === studentUser.id)) {
    console.error('❌ Student found in search results, but should be hidden!');
    process.exit(1);
  } else {
    console.log('✅ Student successfully hidden from search results');
  }

  console.log('--- Phase 5 Verification Complete ---');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
