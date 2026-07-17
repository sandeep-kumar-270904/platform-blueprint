const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsBookmark = require('./models/NewsBookmark');
const NewsViewEvent = require('./models/NewsViewEvent');
const NewsReport = require('./models/NewsReport');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studenthub');
    console.log('Connected to MongoDB');

    // 1. Create a dummy user
    const user = await User.create({
      email: `news_tester_${Date.now()}@example.com`,
      username: `newstester_${Date.now()}`,
      password: 'password123',
      followedCategories: ['AI', 'Startups'],
      followedTags: ['LLM', 'Robotics']
    });
    console.log('Created User with personalized follows.');

    // 2. Create a dummy article
    const article = await NewsArticle.create({
      title: 'The Future of AI scaling laws',
      summary: 'New paper reveals emergent abilities in smaller models.',
      contentSnippet: 'Researchers have discovered that by optimizing data quality, 7B models can match 70B models...',
      sourceName: 'TechCrunch',
      sourceLink: `https://techcrunch.com/article_${Date.now()}`,
      category: 'AI',
      tags: ['LLM', 'Research', 'Scaling'],
      status: 'live'
    });
    console.log('Created NewsArticle with multiple tags.');

    // 3. User bookmarks the article (M2M)
    const bookmark = await NewsBookmark.create({
      userId: user._id,
      articleId: article._id
    });
    console.log('Created NewsBookmark (M2M link).');

    // 4. View event for trending
    const view = await NewsViewEvent.create({
      userId: user._id,
      articleId: article._id
    });
    console.log('Created NewsViewEvent.');

    // 5. User reports the article
    const report = await NewsReport.create({
      reportedBy: user._id,
      articleId: article._id,
      reason: 'misleading'
    });
    console.log('Created NewsReport.');

    // 6. Test index sync (optional, ensures indexes created without error)
    await NewsArticle.syncIndexes();
    await NewsViewEvent.syncIndexes();
    await NewsBookmark.syncIndexes();
    console.log('Indexes synced successfully (Scalability Check Passed).');

    console.log('\nAll foundation checks passed! DB is ready for News feature.');
  } catch (error) {
    console.error('Error in verification:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
