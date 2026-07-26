const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjUwOTA4Mzc1MTY2ZTRlZmMzZjlkNiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4NTAwNjM0NH0.jTGkqw405lSacej7JyLbHyh0AnBTlT96xOKh_IUjepE';

async function triggerRateLimit() {
  console.log("Triggering Rate Limit (20 requests)...");
  for (let i = 1; i <= 21; i++) {
    const res = await fetch('http://localhost:5001/api/quizzes/ai-draft-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Sending missing topic to avoid hitting Gemini while testing rate limit
      body: JSON.stringify({})
    });
    
    if (res.status === 429) {
      console.log(`Request ${i}: STATUS 429 - Rate limit reached successfully!`);
      const data = await res.json();
      console.log(`Response:`, data);
      break;
    } else {
      console.log(`Request ${i}: STATUS ${res.status}`);
    }
  }
}

triggerRateLimit();
