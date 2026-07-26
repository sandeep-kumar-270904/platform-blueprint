const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testQuizzes() {
  try {
    console.log('Testing Quiz APIs...');

    // Fetch the quizzes first without auth
    const res = await fetch('http://localhost:5000/api/quizzes');
    const data = await res.json();
    console.log('GET /api/quizzes count:', data.quizzes.length);

    if (data.quizzes.length === 0) {
      console.log('No quizzes found. Make sure seeding completed.');
      return;
    }

    const quizId = data.quizzes[0]._id;
    console.log(`Testing with Quiz ID: ${quizId}`);
    
    const userId = data.quizzes[0].createdBy;
    const token = jwt.sign({ id: userId, role: 'admin' }, process.env.JWT_SECRET || 'your-secret-key');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Start Attempt
    console.log(`Starting attempt for quiz ${quizId}...`);
    const startRes = await fetch(`http://localhost:5000/api/quizzes/${quizId}/start`, {
      method: 'POST',
      headers
    });
    
    if (!startRes.ok) {
      console.error('Failed to start attempt:', await startRes.text());
      return;
    }
    const startData = await startRes.json();
    console.log('Attempt Started:', startData.attempt._id);
    const attemptId = startData.attempt._id;

    // 2. Submit Attempt
    console.log(`Submitting attempt ${attemptId}...`);
    const submitRes = await fetch(`http://localhost:5000/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        answers: [
          { questionIndex: 0, selectedOptionIndex: 1, timeTakenSeconds: 15 },
          { questionIndex: 1, selectedOptionIndex: 0, timeTakenSeconds: 10 }
        ]
      })
    });

    if (!submitRes.ok) {
      console.error('Failed to submit attempt:', await submitRes.text());
      return;
    }
    const submitData = await submitRes.json();
    console.log('Attempt Submitted. Score:', submitData.score);

    // 3. Analytics
    console.log(`Fetching analytics for quiz ${quizId}...`);
    const analyticsRes = await fetch(`http://localhost:5000/api/quizzes/${quizId}/analytics`, {
      headers
    });
    
    if (!analyticsRes.ok) {
      console.error('Failed to fetch analytics:', await analyticsRes.text());
      return;
    }
    const analyticsData = await analyticsRes.json();
    console.log('Analytics Data:', JSON.stringify(analyticsData));

    console.log('✅ All API tests passed.');

  } catch (err) {
    console.error('Error during testing:', err);
  }
}

testQuizzes();
