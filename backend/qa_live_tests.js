const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function runLiveTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to live DB.");

  try {
    // 5. Query plan/index usage
    const db = mongoose.connection.db;
    
    // Main feed query
    const feedExplain = await db.collection('newsarticles').find({ status: 'live' }).sort({ publishedAt: -1 }).limit(20).explain("executionStats");
    console.log("5. FEED QUERY PLAN (Index usage):", feedExplain.queryPlanner.winningPlan.stage, feedExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');

    // For You query
    const forYouExplain = await db.collection('newsarticles').find({ status: 'live', $or: [{ category: 'AI' }] }).sort({ publishedAt: -1 }).limit(20).explain("executionStats");
    console.log("5. FOR YOU QUERY PLAN (Index usage):", forYouExplain.queryPlanner.winningPlan.stage, forYouExplain.queryPlanner.winningPlan.inputStage?.indexName || 'COLLSCAN');

    // 8. RSS Feed Endpoint (Simulated since we won't spin up full Express just for one curl, we can just call the logic or we can assume it works if we start it)
    // Actually, I can just start server.js in a separate background task, wait 3 seconds, and hit it.
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
runLiveTests();
