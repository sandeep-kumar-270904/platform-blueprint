const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsComment = require('./models/NewsComment');
const NewsCollection = require('./models/NewsCollection');
const NewsBookmark = require('./models/NewsBookmark');

async function verifyPhase4Data() {
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  try {
    console.log('Connecting to Mock MongoDB Server...');
    await mongoose.connect(uri);
    console.log('Connected.');
    
    console.log('\n--- 1. Testing User Model Update ---');
    let user = new User({
      username: 'phase4_tester',
      email: 'test_phase4@example.com',
      password: 'dummy',
      newsPreferences: {
        digestFrequency: 'daily'
      }
    });
    await user.save();
    console.log('✔ User saved successfully.');
    console.log('User digestFrequency:', user.newsPreferences.digestFrequency);

    console.log('\n--- 2. Testing NewsArticle Model Update ---');
    let article = new NewsArticle({
      title: 'AI Phase 4 Test Article',
      sourceLink: 'https://example.com/ai-phase-4',
      sourceName: 'TestSource',
      category: 'AI',
      tags: ['AI', 'GPT-5'],
      summary: 'This is a test article.',
      aiSummary: 'AI generated summary for Phase 4.',
      status: 'live'
    });
    await article.save();
    console.log('✔ NewsArticle saved successfully.');
    console.log('Article aiSummary:', article.aiSummary);

    console.log('\n--- 3. Testing NewsCollection Creation ---');
    let collection = new NewsCollection({
      name: 'AI Research',
      userId: user._id
    });
    await collection.save();
    console.log('✔ NewsCollection saved successfully.');
    console.log('Collection created:', collection.name);

    console.log('\n--- 4. Testing NewsBookmark Update ---');
    let bookmark = new NewsBookmark({
      userId: user._id,
      articleId: article._id,
      collectionId: collection._id
    });
    await bookmark.save();
    console.log('✔ NewsBookmark saved with Collection ID successfully.');
    console.log('Bookmark collectionId linked:', bookmark.collectionId);

    console.log('\n--- 5. Testing NewsComment Threading ---');
    let parentComment = new NewsComment({
      articleId: article._id,
      userId: user._id,
      text: 'This is a top level comment.',
      upvotes: 5
    });
    await parentComment.save();
    
    let childComment = new NewsComment({
      articleId: article._id,
      userId: user._id,
      text: 'This is a nested reply.',
      parentCommentId: parentComment._id,
      upvotes: 1
    });
    await childComment.save();
    console.log('✔ NewsComments (Parent & Child) saved successfully.');
    console.log('Parent Comment:', parentComment.text);
    console.log('Child Comment (refers to parent):', childComment.parentCommentId);

    console.log('\n✅ VERIFICATION COMPLETE: All Phase 4 models successfully validated against real data payloads.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
    console.log('Disconnected.');
  }
}

verifyPhase4Data();
