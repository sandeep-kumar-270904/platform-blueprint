const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 2 QA: Verification & Moderation ---');
  let failures = 0;
  const timestamp = Date.now();

  // 1. Create Recruiter (Pending Verification)
  console.log('Registering pending recruiter...');
  const recRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `recruiter_pending_${timestamp}@test.com`, password: 'password123', full_name: 'Pending Recruiter', username: `rec_pending_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
  });
  let recData = await recRes.json();
  const recTokenRes = await fetch(`${API_URL}/api/auth/test/upgrade-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `recruiter_pending_${timestamp}@test.com`, role: 'recruiter', verificationStatus: 'pending' })
  });
  
  // Re-login to get updated token with new role
  const recLogin = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `recruiter_pending_${timestamp}@test.com`, password: 'password123' })
  });
  const recToken = (await recLogin.json()).token;

  // 2. Pending recruiter posts job
  console.log('Pending recruiter posting job...');
  const jobPayload = {
    title: 'Software Engineer',
    company: { name: 'Alpha Corp' },
    location: 'San Francisco, CA',
    workMode: 'hybrid',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: { min: 100000, max: 150000, currency: 'USD', type: 'yearly' },
    description: 'Great job',
    qualifications: ['React'],
    responsibilities: ['Code'],
    benefits: ['Health'],
    skills: ['React'],
    applyMode: 'in-app',
    status: 'published' // Attempt to publish directly
  };

  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify(jobPayload)
  });
  const job = await jobRes.json();

  if (job.status === 'under_review') {
    console.log('✅ Pending recruiter job correctly forced to under_review');
  } else {
    console.error(`❌ Pending recruiter job status is ${job.status}, expected under_review`);
    failures++;
  }

  // 3. Admin verifies recruiter
  console.log('Registering admin...');
  await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `admin_${timestamp}@test.com`, password: 'password123', full_name: 'Admin User', username: `admin_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
  });
  await fetch(`${API_URL}/api/auth/test/upgrade-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `admin_${timestamp}@test.com`, role: 'admin' })
  });
  const adminLogin = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `admin_${timestamp}@test.com`, password: 'password123' })
  });
  const adminToken = (await adminLogin.json()).token;

  console.log('Admin verifying recruiter...');
  const verifyRes = await fetch(`${API_URL}/api/admin/recruiters/${recData.user.id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ approve: true, note: 'Looks good' })
  });
  if (verifyRes.ok) {
    console.log('✅ Admin verified recruiter');
  } else {
    console.error('❌ Admin verification failed', await verifyRes.text());
    failures++;
  }

  // Need new token for recruiter after verification?
  // Wait, the recruiter's verification status is checked in DB in authMiddleware (Wait, NO, it's pulled from JWT or DB? let's check: auth.js middleware pulls from DB!). So same token works.

  // 4. Recruiter updates job to published
  console.log('Verified recruiter updating job to published...');
  const updateRes = await fetch(`${API_URL}/api/jobs/${job._id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ status: 'published' })
  });
  const updatedJob = await updateRes.json();
  if (updatedJob.status === 'published') {
    console.log('✅ Verified recruiter successfully published job');
  } else {
    console.error(`❌ Verified recruiter job status is ${updatedJob.status}, expected published`);
    failures++;
  }

  // 5. Create 3 students to report the job
  console.log('Registering 3 students and reporting job...');
  for (let i = 0; i < 3; i++) {
    const stuRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `stu_${i}_${timestamp}@test.com`, password: 'password123', full_name: `Stu ${i}`, username: `stu_${i}_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
    });
    const stuToken = (await stuRes.json()).token;

    const reportRes = await fetch(`${API_URL}/api/jobs/${job._id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
      body: JSON.stringify({ reason: 'spam', details: 'Looks like spam' })
    });
    if (!reportRes.ok) {
      console.error(`❌ Student ${i} failed to report job`, await reportRes.text());
      failures++;
    }
  }

  // 6. Check if job is auto-hidden
  console.log('Checking if job is auto-hidden...');
  const finalJobRes = await fetch(`${API_URL}/api/jobs/${job._id}`);
  const finalJob = await finalJobRes.json();
  // Wait, if it's under_review, /api/jobs/:id might still return it? 
  // Let's check status directly.
  if (finalJob.status === 'under_review') {
    console.log('✅ Job auto-hidden (under_review) after 3 reports');
  } else {
    console.error(`❌ Job status is ${finalJob.status}, expected under_review`);
    failures++;
  }

  console.log(`\n--- Phase 2 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
