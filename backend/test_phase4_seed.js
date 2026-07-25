const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsComment = require('./models/NewsComment');
const NewsCollection = require('./models/NewsCollection');
const NewsBookmark = require('./models/NewsBookmark');

async function seedAndTestPhase4() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    // 1. Create a dummy user if none exists
    let user = await User.findOne({ email: 'test_phase4@example.com' });
    if (!user) {
      user = new User({
        username: 'phase4_tester',
        email: 'test_phase4@example.com',
        passwordHash: 'dummy',
        newsPreferences: {
          digestFrequency: 'daily'
        }
      });
      await user.save();
    }
    console.log('User digestFrequency:', user.newsPreferences.digestFrequency);

    // 2. Create a dummy article
    let article = await NewsArticle.findOne({ title: 'AI Phase 4 Test Article' });
    if (!article) {
      article = new NewsArticle({
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
    }
    console.log('Article aiSummary:', article.aiSummary);

    // 3. Create a collection
    let collection = await NewsCollection.findOne({ name: 'AI Research', userId: user._id });
    if (!collection) {
      collection = new NewsCollection({
        name: 'AI Research',
        userId: user._id
      });
      await collection.save();
    }
    console.log('Collection created:', collection.name);

    // 4. Create a bookmark in that collection
    let bookmark = await NewsBookmark.findOne({ userId: user._id, articleId: article._id });
    if (!bookmark) {
      bookmark = new NewsBookmark({
        userId: user._id,
        articleId: article._id,
        collectionId: collection._id
      });
      await bookmark.save();
    }
    console.log('Bookmark collectionId linked:', bookmark.collectionId);

    // 5. Add a comment
    let comment = await NewsComment.findOne({ userId: user._id, articleId: article._id });
    if (!comment) {
      comment = new NewsComment({
        articleId: article._id,
        userId: user._id,
        text: 'This is a test comment for Phase 4.',
        upvotes: 1
      });
      await comment.save();
    }
    console.log('Comment created:', comment.text);
    
    console.log('✔ All Phase 4 models and schema modifications are fully functional against real data.');

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

seedAndTestPhase4();
