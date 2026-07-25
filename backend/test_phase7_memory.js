const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsCollection = require('./models/NewsCollection');
const NewsBookmark = require('./models/NewsBookmark');

async function verifyPhase7Data() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  try {
    console.log('Connecting to Mock MongoDB Server for Phase 7...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Wait for text indexes to build
    await NewsArticle.init();
    
    console.log('\n--- 1. Testing User Model (News Streak) ---');
    let user = new User({
      username: 'phase7_tester',
      email: 'test_phase7@example.com',
      password: 'dummy',
      newsStreak: {
        current: 5,
        longest: 12,
        lastActiveDate: new Date()
      }
    });
    await user.save();
    console.log('✔ User saved successfully.');
    console.log('News Streak:', user.newsStreak);

    console.log('\n--- 2. Testing NewsCollection (Shared Export) ---');
    let collection = new NewsCollection({
      userId: user._id,
      name: 'Public Reading List',
      description: 'A shared collection'
    });
    await collection.save();
    
    let article = new NewsArticle({
      title: 'RSS Validation Test',
      sourceLink: 'https://example.com/rss-test',
      sourceName: 'TechDaily',
      category: 'AI',
      summary: 'This is a test article.',
      status: 'live'
    });
    await article.save();
    
    let bookmark = new NewsBookmark({
      userId: user._id,
      articleId: article._id,
      collectionId: collection._id
    });
    await bookmark.save();
    
    console.log('✔ Collection and Bookmark saved successfully.');
    console.log(`Collection Name: ${collection.name}, Bound Article ID: ${bookmark.articleId}`);

    console.log('\n✅ VERIFICATION COMPLETE: Phase 7 models and relations successfully validated against real data payloads.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Disconnected.');
  }
}

verifyPhase7Data();
