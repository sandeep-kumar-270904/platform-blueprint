const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(process.cwd(), '.env') });

const API_URL = 'http://localhost:5000';

async function run() {
  console.log('--- Verifying Phase 4 ---');

  const randomEmail = `recruiter${Date.now()}@studenthub.com`;
  
  console.log(`Registering new user ${randomEmail}`);
  const registerRes = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: randomEmail, password: 'password123', full_name: 'Test Recruiter', username: `recruiter${Date.now()}` })
  });
  
  const { token, user } = await registerRes.json();
  if (!token) {
    console.error('Failed to register');
    process.exit(1);
  }

  // Set role to recruiter
  await mongoose.connect(process.env.MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  await User.findByIdAndUpdate(user._id, { $set: { role: 'recruiter' } });

  console.log('Registered and updated role for', user.email);

  // 1. Post a test job to ensure we have something
  const jobRes = await fetch(`${API_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Senior SWE - Recommendations',
      company: { name: 'TechCo', verified: true },
      location: 'San Francisco, CA',
      workMode: 'hybrid',
      jobType: 'full-time',
      experienceLevel: 'senior',
      description: 'Test job for phase 4',
      skills: ['React', 'Node.js', 'MongoDB'],
      status: 'published'
    })
  });
  const newJob = await jobRes.json();
  const jobId = newJob._id || newJob.job?._id;
  console.log(`Created test job ${jobId}`);

  // 2. Save the job
  console.log('Testing Save Job...');
  const saveRes = await fetch(`${API_URL}/api/jobs/${jobId}/save`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Save job response:', saveRes.status);
  
  // Fetch saved jobs
  const savedJobsRes = await fetch(`${API_URL}/api/jobs/saved`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const savedJobs = await savedJobsRes.json();
  console.log(`Saved jobs count: ${savedJobs.length}`);
  if (!savedJobs.some(j => j._id === jobId)) {
    console.error('Job was not successfully saved!');
  }

  // 3. Unsave the job
  console.log('Testing Unsave Job...');
  const unsaveRes = await fetch(`${API_URL}/api/jobs/${jobId}/save`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Unsave job response:', unsaveRes.status);

  // 4. Test Job Recommendations (Skill overlap)
  console.log('Testing Job Recommendations...');
  // The user admin@studenthub.com might not have skills set up in their profile.
  // We'll update the user's skills directly via DB to test recommendations.
  await User.findByIdAndUpdate(user._id, { $set: { skills: ['React', 'Node.js'] } });
  console.log('Updated user skills to React and Node.js');

  const recRes = await fetch(`${API_URL}/api/jobs/recommended`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const recommendedJobs = await recRes.json();
  console.log(`Found ${recommendedJobs.length} recommended jobs.`);
  
  // 5. Test Analytics (Job Level)
  console.log('Testing Job Analytics...');
  const analyticsRes = await fetch(`${API_URL}/api/jobs/${jobId}/analytics`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const analytics = await analyticsRes.json();
  console.log('Job Analytics:', analytics);

  // 6. Test Analytics (Recruiter Overview)
  console.log('Testing Recruiter Overview Analytics...');
  const overviewRes = await fetch(`${API_URL}/api/recruiter/analytics/overview`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const overview = await overviewRes.json();
  console.log('Overview:', overview);

  console.log('--- Phase 4 Verification Complete ---');
  process.exit(0);
}

run().catch(console.error);
