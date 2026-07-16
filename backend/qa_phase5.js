const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 5 QA: Candidate Search & Visibility ---');
  let failures = 0;
  const timestamp = Date.now();

  // 1. Register Recruiter and Student
  console.log('Registering recruiter and student...');
  const recRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `rec_${timestamp}@test.com`, password: 'password123', full_name: 'Recruiter', username: `rec_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
  });
  await fetch(`${API_URL}/api/auth/test/upgrade-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `rec_${timestamp}@test.com`, role: 'recruiter', verificationStatus: 'verified' })
  });
  const recLogin = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `rec_${timestamp}@test.com`, password: 'password123' })
  });
  const recToken = (await recLogin.json()).token;

  const stuRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `stu_${timestamp}@test.com`, password: 'password123', full_name: 'Student', username: `stu_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
  });
  const stuLoginData = await stuRes.json();
  const stuToken = stuLoginData.token;
  const stuId = stuLoginData.user.id;

  // 2. Student sets visibility to true
  console.log('Student setting profile to visible...');
  const visRes = await fetch(`${API_URL}/api/users/me/visibility`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({
      visibleToRecruiters: true,
      openToWork: true,
      visiblePreferredRoles: ['Frontend Developer']
    })
  });
  if (!visRes.ok) {
    console.error('❌ Failed to update visibility', await visRes.text());
    failures++;
  }

  // 3. Recruiter searches candidates
  console.log('Recruiter searching candidates...');
  const searchRes = await fetch(`${API_URL}/api/recruiter/candidates?preferredRole=Frontend`, {
    headers: { 'Authorization': `Bearer ${recToken}` }
  });
  const candidates = await searchRes.json();
  if (candidates.some(c => c._id === stuId)) {
    console.log('✅ Student appeared in recruiter search');
  } else {
    console.error('❌ Student did not appear in recruiter search');
    failures++;
  }

  // 4. Recruiter views student profile
  console.log('Recruiter viewing student profile...');
  const viewRes = await fetch(`${API_URL}/api/recruiter/candidates/${stuId}`, {
    headers: { 'Authorization': `Bearer ${recToken}` }
  });
  if (!viewRes.ok) {
    console.error('❌ Failed to view candidate profile', await viewRes.text());
    failures++;
  } else {
    console.log('✅ Recruiter viewed candidate profile successfully');
  }

  // Check if student profileViewCount updated
  const stuMeRes = await fetch(`${API_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuMe = await stuMeRes.json();
  if (stuMe.user.careerVisibility?.profileViewCount > 0) {
    console.log('✅ Student profileViewCount incremented');
  } else {
    console.error('❌ Student profileViewCount did not increment');
    failures++;
  }

  // 5. Post Job to invite candidate to
  console.log('Recruiter posting job for invite...');
  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      title: 'Frontend Developer',
      company: { name: 'Tech Inc' },
      location: 'Remote',
      workMode: 'remote',
      jobType: 'full-time',
      experienceLevel: 'entry',
      description: 'Code React',
      qualifications: ['React'],
      responsibilities: ['Code React'],
      benefits: ['None'],
      skills: ['React'],
      applyMode: 'in-app',
      status: 'published'
    })
  });
  const job = await jobRes.json();

  // 6. Recruiter invites candidate
  console.log('Recruiter inviting candidate...');
  const inviteRes = await fetch(`${API_URL}/api/recruiter/candidates/${stuId}/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ jobId: job._id, message: 'Please apply!' })
  });
  if (inviteRes.ok) {
    console.log('✅ Candidate invited successfully');
  } else {
    console.error('❌ Failed to invite candidate', await inviteRes.text());
    failures++;
  }

  // 7. Verify Student Notification
  console.log('Checking student notifications for invite...');
  const stuNotifRes = await fetch(`${API_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuNotifs = await stuNotifRes.json();
  const inviteNotif = stuNotifs.notifications.find(n => n.type === 'job_invite_received');
  if (inviteNotif) {
    console.log('✅ Student received job_invite_received notification');
  } else {
    console.error('❌ Student did not receive job_invite_received notification');
    failures++;
  }

  console.log(`\n--- Phase 5 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
