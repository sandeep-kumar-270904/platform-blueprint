// Native fetch in Node 18+

async function testRateLimit() {
  console.log("Testing POST /api/news/:id/view rate limit...");
  for (let i = 1; i <= 25; i++) {
    const res = await fetch('http://localhost:5000/api/news/6a64cc7f8637339a9a51b8bf/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status === 429) {
      const text = await res.text();
      console.log(`Request ${i} returned 429 Too Many Requests: ${text}`);
      break;
    } else {
      console.log(`Request ${i} returned ${res.status}`);
    }
  }
}

testRateLimit();
