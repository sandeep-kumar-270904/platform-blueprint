const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

async function runStressTests() {
  console.log("=== RUNNING STRESS TESTS (Priority 5, 8, & 9) ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB.");

  let passed = 0;
  let failed = 0;
  
  const check = (name, cond) => {
    if (cond) { console.log(`[PASS] ${name}`); passed++; }
    else { console.error(`[FAIL] ${name}`); failed++; }
  }

  try {
    console.log("Starting 30 concurrent GET /api/alumni/directory calls");
    
    const start = Date.now();
    const loadPromises = Array(30).fill(0).map(() => 
      fetch(`http://localhost:5000/api/alumni/directory`)
    );

    const loadResponses = await Promise.all(loadPromises);
    const end = Date.now();

    const successCount = loadResponses.filter(r => r.status === 200).length;
    console.log(`Latency for 30 requests: ${end - start}ms`);
    
    check("All 30 GET directory requests succeeded", successCount === 30);
    check("Latency under 2500ms", (end - start) < 2500);

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    mongoose.disconnect();
    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  }
}

runStressTests();
