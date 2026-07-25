const mongoose = require('mongoose');
async function testAdmin() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const NewsArticle = require('./models/NewsArticle');
  const seedLocalFallback = require('./scripts/seedLocalFallback');
  await seedLocalFallback();

  console.log("Running explain on NewsArticle feed query...");
  const explainResult = await NewsArticle.find({ status: 'live' }).sort({ publishedAt: -1 }).explain('executionStats');
  console.log(JSON.stringify(explainResult.executionStats, null, 2));
  process.exit(0);
}
testAdmin();
