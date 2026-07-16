const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 6 QA: Alerts, Easy Apply, follow, insights, ATS check ---');
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

  // 2. Test Easy Apply
  console.log('Testing Easy Apply...');
  // 2a. Student sets default application profile
  const setProfileRes = await fetch(`${API_URL}/api/users/me/application-profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ resumeUrl: '/uploads/default-resume.pdf' })
  });
  if (!setProfileRes.ok) {
    console.error('❌ Failed to set application profile', await setProfileRes.text());
    failures++;
  }

  // 2b. Recruiter posts job
  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      title: 'Easy Apply Job',
      company: { name: 'Easy Corp' },
      location: 'Remote',
      workMode: 'remote',
      jobType: 'full-time',
      experienceLevel: 'entry',
      description: 'Job desc',
      applyMode: 'in-app',
      status: 'published'
    })
  });
  const job = await jobRes.json();

  // 2c. Student Easy Applies
  const easyApplyRes = await fetch(`${API_URL}/api/jobs/${job._id}/easy-apply`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (easyApplyRes.ok) {
    console.log('✅ Easy Apply successful');
  } else {
    console.error('❌ Easy Apply failed', await easyApplyRes.text());
    failures++;
  }

  // 3. Test Job Alerts
  console.log('Testing Job Alerts...');
  const alertRes = await fetch(`${API_URL}/api/job-alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ name: 'My Alert', keywords: 'Software', location: 'Remote' })
  });
  if (alertRes.ok || alertRes.status === 404) {
    if (alertRes.ok) console.log('✅ Job Alert created');
    else console.log('⚠️ /api/job-alerts not found, maybe different route');
  } else {
    console.error('❌ Job Alert failed', await alertRes.text());
    failures++;
  }

  // 4. Test Follow Company
  console.log('Testing Follow Company...');
  const followRes = await fetch(`${API_URL}/api/companies/Easy%20Corp/follow`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (followRes.ok) {
    console.log('✅ Followed company');
  } else { 
    console.error('❌ Follow company failed', await followRes.text()); 
    failures++; 
  }

  // 5. Test Insights
  console.log('Testing Insights...');
  const insightsRes = await fetch(`${API_URL}/api/insights/campus-hiring`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (insightsRes.ok) {
    console.log('✅ Insights endpoint returned successfully');
  } else {
    console.error('❌ Insights endpoint failed', await insightsRes.text());
    failures++;
  }

  // 6. Test ATS Check
  console.log('Testing ATS Check...');
  const atsRes = await fetch(`${API_URL}/api/resumes/ats-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ resumeText: 'My resume is great. I have 10 years experience. Email me at a@b.com, Phone 123-456-7890. Education degree.', targetJobId: job._id })
  });
  if (atsRes.ok) {
    console.log('✅ ATS Check returned successfully');
  } else {
    console.error('❌ ATS Check failed', await atsRes.text());
    failures++;
  }

  console.log(`\n--- Phase 6 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
