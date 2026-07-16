const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 1 QA ---');
  let failures = 0;

  // 1. Create a real recruiter test account and a real student test account
  const timestamp = Date.now();
  const recruiterEmail = `recruiter${timestamp}@studenthub.com`;
  const studentEmail = `student${timestamp}@studenthub.com`;

  console.log('Registering recruiter...');
  const recRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recruiterEmail, password: 'password123', full_name: 'Test Recruiter', username: `rec${timestamp}`, role: 'recruiter', captchaToken: 'skip', consent: true })
  });
  // Upgrade role via test hook and login to get new token
  const upgRes = await fetch(`${API_URL}/api/auth/test/upgrade-role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recruiterEmail, role: 'recruiter' })
  });
  console.log('Upgrade role status:', upgRes.status, await upgRes.text());

  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recruiterEmail, password: 'password123' })
  });
  let recToken;
  if (!loginRes.ok) {
    console.error('Recruiter login failed:', await loginRes.text());
    failures++;
  } else {
    recToken = (await loginRes.json()).token;
  }

  console.log('Registering student...');
  const stuRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentEmail, password: 'password123', full_name: 'Test Student', username: `stu${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
  });
  let stuToken, stuUser;
  if (!stuRes.ok) {
    console.error('Student register failed:', await stuRes.text());
    failures++;
  } else {
    const data = await stuRes.json();
    stuToken = data.token;
    stuUser = data.user;
  }

  // 2. Post a job as the recruiter with every field filled in
  console.log('Posting job...');
  const jobPayload = {
    title: `Full Stack Engineer ${timestamp}`,
    company: { name: 'Acme Corp', website: 'https://acme.com', logoUrl: '' },
    location: 'San Francisco, CA',
    workMode: 'hybrid',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salary: { min: 100000, max: 150000, currency: 'USD', type: 'yearly' },
    description: 'We are looking for a full stack engineer.',
    qualifications: ['React', 'Node.js'],
    responsibilities: ['Build stuff'],
    benefits: ['Health insurance', '401k'],
    skills: ['React', 'Node.js'],
    openings: 2,
    applyMode: 'in-app',
    status: 'published'
  };

  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify(jobPayload)
  });
  
  let job;
  if (!jobRes.ok) {
    console.error('Job creation failed:', await jobRes.text());
    failures++;
  } else {
    job = await jobRes.json();
  }
  
  if (job) {
    if (!job.qualifications || job.qualifications.length === 0 || !job.responsibilities || !job.benefits) {
      console.error('Job creation succeeded but some optional fields were not saved properly.');
      failures++;
    } else {
      console.log('✅ Job created with all fields intact.');
    }
  } else {
    // If job failed to create, abort further test steps that depend on it
    return console.error('Aborting due to job creation failure.');
  }


  // 3. Confirm job appears on /jobs and findable via search
  console.log('Searching by title...');
  const search1 = await fetch(`${API_URL}/api/jobs?keyword=Engineer+${timestamp}`);
  const search1Data = await search1.json();
  if (search1Data.jobs.some(j => j._id === job._id)) {
    console.log('✅ Found job by title keyword');
  } else {
    console.error('❌ Failed to find job by title keyword');
    failures++;
  }

  console.log('Searching by skill...');
  const search2 = await fetch(`${API_URL}/api/jobs?skills=Node.js`);
  const search2Data = await search2.json();
  if (search2Data.jobs.some(j => j._id === job._id)) {
    console.log('✅ Found job by skill');
  } else {
    console.error('❌ Failed to find job by skill');
    failures++;
  }

  // 4. Test filters individually
  // Let's create a contrasting job to test filters
  const job2Res = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      title: `Data Scientist ${timestamp}`,
      company: { name: 'Beta Corp' },
      location: 'New York, NY',
      workMode: 'remote',
      jobType: 'contract',
      experienceLevel: 'senior',
      salary: { min: 180000, max: 200000, currency: 'USD', type: 'yearly' },
      description: 'Data job',
      skills: ['Python', 'SQL'],
      applyMode: 'external',
      externalUrl: 'https://apply.com',
      status: 'published'
    })
  });
  const job2 = await job2Res.json();

  console.log('Testing filters...');
  const filters = [
    { name: 'location', query: 'New York, NY', expectedId: job2._id, notExpectedId: job._id },
    { name: 'workMode', query: 'remote', expectedId: job2._id, notExpectedId: job._id },
    { name: 'jobType', query: 'contract', expectedId: job2._id, notExpectedId: job._id },
    { name: 'experienceLevel', query: 'senior', expectedId: job2._id, notExpectedId: job._id },
    { name: 'minSalary', query: '160000', expectedId: job2._id, notExpectedId: job._id },
  ];

  for (const filter of filters) {
    const res = await fetch(`${API_URL}/api/jobs?${filter.name}=${encodeURIComponent(filter.query)}`);
    const data = await res.json();
    const hasExpected = data.jobs.some(j => j._id === filter.expectedId);
    const hasUnexpected = data.jobs.some(j => j._id === filter.notExpectedId);
    if (hasExpected && !hasUnexpected) {
      console.log(`✅ Filter ${filter.name} works`);
    } else {
      console.error(`❌ Filter ${filter.name} failed (hasExpected: ${hasExpected}, hasUnexpected: ${hasUnexpected})`);
      failures++;
    }
  }

  // 5. Apply to in-app job
  console.log('Applying to in-app job...');
  const apply1Res = await fetch(`${API_URL}/api/jobs/${job._id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ resumeUrl: '/uploads/my-resume.pdf' })
  });
  let apply1Data;
  if (apply1Res.ok) {
    apply1Data = await apply1Res.json();
    console.log('✅ Applied to in-app job');
  } else {
    console.error('❌ Failed to apply to in-app job', await apply1Res.text());
    failures++;
  }
  
  // Duplicate apply
  const apply1Duplicate = await fetch(`${API_URL}/api/jobs/${job._id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ resumeUrl: '/uploads/my-resume.pdf' })
  });
  if (apply1Duplicate.status === 409) {
    console.log('✅ Duplicate apply correctly returned 409');
  } else {
    console.error(`❌ Duplicate apply returned ${apply1Duplicate.status} instead of 409`);
    failures++;
  }

  // Check applicant count
  const checkJob1 = await fetch(`${API_URL}/api/jobs/${job._id}`);
  const job1Data = await checkJob1.json();
  if (job1Data.applicantCount === 1) {
    console.log('✅ applicantCount incremented');
  } else {
    console.error(`❌ applicantCount is ${job1Data.applicantCount}, expected 1`);
    failures++;
  }

  // 6. Apply to external-link job
  console.log('Applying to external job...');
  const apply2Res = await fetch(`${API_URL}/api/jobs/${job2._id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` }
  });
  const apply2Data = await apply2Res.json();
  if (apply2Res.ok && apply2Data.externalUrl === 'https://apply.com' && apply2Data.application) {
    console.log('✅ External apply logged and returned externalUrl');
  } else {
    console.error('❌ External apply failed or malformed', apply2Data);
    failures++;
  }
  
  // 7. Update Application Status
  console.log('Updating application status...');
  const applicationId = apply1Data.application ? apply1Data.application._id : apply1Data._id;
  const updateRes = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ newStatus: 'under_review' })
  });
  if (!updateRes.ok) {
    console.error('Status update to under_review failed', await updateRes.text());
    failures++;
  }

  const updateRes2 = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ newStatus: 'interview' })
  });
  if (!updateRes2.ok) {
    console.error('Status update to interview failed', await updateRes2.text());
    failures++;
  }

  const updateRes3 = await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ newStatus: 'rejected' })
  });
  if (!updateRes3.ok) {
    console.error('Status update to rejected failed', await updateRes3.text());
    failures++;
  }

  // 8. Withdraw Application
  console.log('Withdrawing application...');
  const withdrawRes = await fetch(`${API_URL}/api/applications/${applicationId}/withdraw`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (!withdrawRes.ok) {
    console.error('Application withdrawal failed', await withdrawRes.text());
    failures++;
  }

  // 9. Bulk Status Update
  console.log('Testing bulk status update...');
  // Need to create 3 students and apply them to job
  const appIds = [];
  for (let i = 0; i < 3; i++) {
    const tempRes = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `temp${i}_${timestamp}@test.com`, password: 'password123', full_name: 'Temp Stu', username: `temp${i}_${timestamp}`, role: 'student', captchaToken: 'skip', consent: true })
    });
    const { token } = await tempRes.json();
    const applyRes = await fetch(`${API_URL}/api/jobs/${job._id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ resumeUrl: '/u' })
    });
    appIds.push((await applyRes.json())._id);
  }

  const bulkRes = await fetch(`${API_URL}/api/applications/bulk-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ applicationIds: appIds, newStatus: 'shortlisted' })
  });
  if (bulkRes.ok) {
    console.log('✅ Bulk update succeeded');
    // Check that each got its own history entry (fetch one to verify)
    const atsRes = await fetch(`${API_URL}/api/jobs/${job._id}/applicants`, {
      headers: { 'Authorization': `Bearer ${recToken}` }
    });
    const atsData = await atsRes.json();
    const short = atsData.find(a => a._id === appIds[0]);
    if (short && short.status === 'shortlisted' && short.statusHistory.length === 2) {
      console.log('✅ Bulk update persisted with history');
    } else {
      console.error('❌ Bulk update didn\'t save properly', short);
      failures++;
    }
  } else {
    console.error('❌ Bulk update failed', await bulkRes.text());
    failures++;
  }

  console.log(`\n--- Phase 1 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
