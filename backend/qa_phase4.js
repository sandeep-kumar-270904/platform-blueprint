const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 4 QA: Saved Jobs, Recommendations, Analytics ---');
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
  const stuToken = (await stuRes.json()).token;

  // Set student skills to 'React'
  await fetch(`${API_URL}/api/users/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ skills: ['React'] })
  });

  // 2. Post Job with 'React' skill
  console.log('Posting job with React skill...');
  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      title: 'React Dev',
      company: { name: 'React Corp' },
      location: 'Remote',
      workMode: 'remote',
      jobType: 'full-time',
      experienceLevel: 'entry',
      description: 'Code React',
      qualifications: ['React'],
      responsibilities: ['Code React'],
      benefits: ['None'],
      skills: ['React', 'Node.js'],
      applyMode: 'in-app',
      status: 'published'
    })
  });
  const job = await jobRes.json();

  // 3. Check Recommended Jobs
  console.log('Fetching recommended jobs...');
  const recsRes = await fetch(`${API_URL}/api/jobs/recommended`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const recommendedJobs = await recsRes.json();
  const matchedJob = recommendedJobs.find(j => j._id === job._id);
  if (matchedJob && matchedJob.matchScore === 1) {
    console.log('✅ Job correctly recommended to student based on skills');
  } else {
    console.error('❌ Job not recommended correctly or match score incorrect', matchedJob);
    failures++;
  }

  // 4. Save Job
  console.log('Saving job...');
  const saveRes = await fetch(`${API_URL}/api/jobs/${job._id}/save`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (saveRes.ok) {
    console.log('✅ Job saved successfully');
  } else {
    console.error('❌ Failed to save job', await saveRes.text());
    failures++;
  }

  // 5. Get Saved Jobs
  console.log('Fetching saved jobs...');
  const getSavedRes = await fetch(`${API_URL}/api/jobs/saved`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const savedJobs = await getSavedRes.json();
  if (savedJobs.find(j => j._id === job._id)) {
    console.log('✅ Job appears in saved jobs list');
  } else {
    console.error('❌ Job missing from saved jobs list');
    failures++;
  }

  // 6. Delete Saved Job
  console.log('Removing saved job...');
  const delSaveRes = await fetch(`${API_URL}/api/jobs/${job._id}/save`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (delSaveRes.ok) {
    console.log('✅ Job removed from saved successfully');
    const getSavedRes2 = await fetch(`${API_URL}/api/jobs/saved`, { headers: { 'Authorization': `Bearer ${stuToken}` }});
    const savedJobs2 = await getSavedRes2.json();
    if (savedJobs2.find(j => j._id === job._id)) {
      console.error('❌ Job still in saved jobs after deletion');
      failures++;
    }
  } else {
    console.error('❌ Failed to remove saved job', await delSaveRes.text());
    failures++;
  }

  // 7. Get Analytics (Wait, is there an analytics endpoint?)
  // Let me check if /api/jobs/:id/analytics exists. It was in the checklist.
  // Actually, I didn't check jobs.js for `/analytics`. Let's test the endpoint and see if it fails.
  console.log('Fetching job analytics...');
  const analyticsRes = await fetch(`${API_URL}/api/jobs/${job._id}/analytics`, {
    headers: { 'Authorization': `Bearer ${recToken}` }
  });
  if (analyticsRes.status === 404) {
    console.error('❌ /api/jobs/:id/analytics endpoint not found!');
    failures++;
  } else if (!analyticsRes.ok) {
    console.error('❌ Analytics request failed', await analyticsRes.text());
    failures++;
  } else {
    const analytics = await analyticsRes.json();
    console.log('✅ Analytics endpoint responded:', analytics);
  }

  console.log(`\n--- Phase 4 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
