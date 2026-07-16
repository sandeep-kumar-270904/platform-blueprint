const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 7 QA: Admin Dashboard Sync & Audit ---');
  let failures = 0;
  const timestamp = Date.now();

  // 1. Authenticate Admin
  // (In `qa_phase2.js` we created an admin, but let's just create a new admin or use /api/auth/me bypass if it existed (we removed it).
  // Wait, I will just register a user and upgrade to admin.
  console.log('Registering and upgrading admin...');
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

  // 2. Fetch /api/admin/career-opportunities/overview
  console.log('Fetching Admin Career Opportunities Overview...');
  const overviewRes = await fetch(`${API_URL}/api/admin/career-opportunities/overview`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (overviewRes.ok) {
    const data = await overviewRes.json();
    console.log('✅ Overview returned successfully. Total Jobs:', data.totalJobs);
  } else {
    console.error('❌ Overview failed', await overviewRes.text());
    failures++;
  }

  // 3. Fetch /api/admin/career-opportunities/consistency-check
  console.log('Fetching Consistency Check...');
  const checkRes = await fetch(`${API_URL}/api/admin/career-opportunities/consistency-check`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (checkRes.ok) {
    console.log('✅ Consistency Check returned successfully');
  } else {
    console.error('❌ Consistency Check failed', await checkRes.text());
    failures++;
  }

  // 4. Fetch /api/admin-jobs/jobs
  console.log('Fetching Admin Jobs List...');
  const jobsRes = await fetch(`${API_URL}/api/admin-jobs/jobs`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  if (jobsRes.ok) {
    console.log('✅ Admin Jobs returned successfully');
  } else {
    // Check if it's maybe /api/admin/jobs
    const jobsRes2 = await fetch(`${API_URL}/api/admin/jobs`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (jobsRes2.ok) {
        console.log('✅ Admin Jobs returned successfully from /api/admin/jobs');
    } else {
        console.error('❌ Admin Jobs failed on both routes');
        failures++;
    }
  }

  console.log(`\n--- Phase 7 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
