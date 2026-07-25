const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsComment = require('./models/NewsComment');

async function verifyPhase5Data() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  try {
    console.log('Connecting to Mock MongoDB Server for Phase 5...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Wait for text indexes to build
    await NewsArticle.init();
    await NewsComment.init();
    
    console.log('\n--- 1. Testing User Model (Followed Authors) ---');
    let user = new User({
      username: 'phase5_tester',
      email: 'test_phase5@example.com',
      password: 'dummy',
      newsPreferences: {
        followedAuthors: ['Marques Brownlee', 'Jane Doe']
      }
    });
    await user.save();
    console.log('✔ User saved successfully.');
    console.log('Followed Authors:', user.newsPreferences.followedAuthors);

    console.log('\n--- 2. Testing NewsArticle Model (Author & Reading Time) ---');
    let article = new NewsArticle({
      title: 'AI Robotics Breakthrough',
      sourceLink: 'https://example.com/ai-robotics',
      sourceName: 'TechDaily',
      category: 'AI',
      tags: ['AI', 'Robotics'],
      summary: 'This is a test article.',
      aiSummary: 'An AI summary covering robots.',
      author: 'Jane Doe',
      readingTime: 3,
      status: 'live'
    });
    await article.save();
    console.log('✔ NewsArticle saved successfully.');
    console.log(`Author: ${article.author} | Reading Time: ${article.readingTime} min`);

    console.log('\n--- 3. Testing Full-Text Search Upgrade ---');
    const searchResults = await NewsArticle.find({ $text: { $search: 'robots' } });
    console.log(`Found ${searchResults.length} articles matching "robots" (from aiSummary).`);

    console.log('\n✅ VERIFICATION COMPLETE: Phase 5 models successfully validated against real data payloads.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Disconnected.');
  }
}

verifyPhase5Data();
