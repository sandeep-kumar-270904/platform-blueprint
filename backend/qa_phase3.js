const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Phase 3 QA: Notifications ---');
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

  // 2. Post job
  console.log('Posting job...');
  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({
      title: 'QA Tester',
      company: { name: 'Test Corp' },
      location: 'Remote',
      workMode: 'remote',
      jobType: 'full-time',
      experienceLevel: 'entry',
      description: 'Testing',
      qualifications: ['Testing'],
      responsibilities: ['Test'],
      benefits: ['None'],
      applyMode: 'in-app',
      status: 'published'
    })
  });
  const job = await jobRes.json();

  // 3. Apply to job
  console.log('Student applying to job...');
  const applyRes = await fetch(`${API_URL}/api/jobs/${job._id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${stuToken}` },
    body: JSON.stringify({ resumeUrl: '/uploads/my-resume.pdf' })
  });
  const applyData = await applyRes.json();
  const applicationId = applyData.application ? applyData.application._id : applyData._id;

  // 4. Verify Student Notifications
  console.log('Fetching student notifications...');
  const stuNotifRes = await fetch(`${API_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuNotifsData = await stuNotifRes.json();
  const stuNotifs = stuNotifsData.notifications;
  const submittedNotif = stuNotifs.find(n => n.type === 'application_submitted');
  if (submittedNotif) {
    console.log('✅ Student received application_submitted notification');
  } else {
    console.error('❌ Student did NOT receive application_submitted notification');
    failures++;
  }

  // 5. Verify Recruiter Notifications
  console.log('Fetching recruiter notifications...');
  const recNotifRes = await fetch(`${API_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${recToken}` }
  });
  const recNotifsData = await recNotifRes.json();
  const recNotifs = recNotifsData.notifications;
  const newAppNotif = recNotifs.find(n => n.type === 'new_applicant');
  if (newAppNotif) {
    console.log('✅ Recruiter received new_applicant notification');
  } else {
    console.error('❌ Recruiter did NOT receive new_applicant notification');
    failures++;
  }

  // 6. Recruiter changes status
  console.log('Recruiter updating application status...');
  await fetch(`${API_URL}/api/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${recToken}` },
    body: JSON.stringify({ newStatus: 'interview' })
  });

  // 7. Verify Student Notification for Status Change
  const stuNotifRes2 = await fetch(`${API_URL}/api/notifications`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuNotifsData2 = await stuNotifRes2.json();
  const stuNotifs2 = stuNotifsData2.notifications;
  const statusNotif = stuNotifs2.find(n => n.type === 'application_status_changed' && n.message.includes('interview'));
  if (statusNotif) {
    console.log('✅ Student received application_status_changed notification');
  } else {
    console.error('❌ Student did NOT receive application_status_changed notification');
    failures++;
  }

  // 8. Mark notification as read
  if (statusNotif) {
    console.log('Marking notification as read...');
    const markRes = await fetch(`${API_URL}/api/notifications/${statusNotif._id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${stuToken}` }
    });
    if (markRes.ok) {
      console.log('✅ Marked single notification as read');
      const verifyRead = await fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${stuToken}` }});
      const checkData = await verifyRead.json();
      const isRead = checkData.notifications.find(n => n._id === statusNotif._id)?.isRead;
      if (!isRead) {
        console.error('❌ Notification was not actually marked as read');
        failures++;
      }
    } else {
      console.error('❌ Failed to mark notification as read', await markRes.text());
      failures++;
    }
  }

  // 9. Mark all as read
  console.log('Marking all notifications as read...');
  const markAllRes = await fetch(`${API_URL}/api/notifications/read-all`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  if (markAllRes.ok) {
    console.log('✅ Marked all notifications as read');
    const verifyAllRead = await fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${stuToken}` }});
    const checkAllData = await verifyAllRead.json();
    if (checkAllData.notifications.some(n => !n.isRead)) {
      console.error('❌ Not all notifications were actually marked as read');
      failures++;
    }
  } else {
    console.error('❌ Failed to mark all notifications as read', await markAllRes.text());
    failures++;
  }

  console.log(`\n--- Phase 3 QA Complete: ${failures} Failures ---`);
  process.exit(failures > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
