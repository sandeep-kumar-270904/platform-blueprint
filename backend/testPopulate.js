const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const NewsArticle = require('./models/NewsArticle');
const User = require('./models/User');

async function test() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  
  const seedLocalFallback = require('./scripts/seedLocalFallback');
  await seedLocalFallback();
  
  try {
    const articles = await NewsArticle.find({})
        .sort({ publishedAt: -1 })
        .skip(0)
        .limit(20)
        .populate('submittedBy', 'username full_name');
    console.log("Success:", JSON.stringify(articles).substring(0, 100));
  } catch(e) {
    console.error("ERROR STACK:");
    console.error(e.stack);
  }
  process.exit(0);
}

test();
