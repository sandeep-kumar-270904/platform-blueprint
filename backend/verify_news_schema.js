require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const NewsArticle = require('./models/NewsArticle');
const NewsBookmark = require('./models/NewsBookmark');
const NewsViewEvent = require('./models/NewsViewEvent');
const NewsReport = require('./models/NewsReport');
const db = require('./db');

async function runVerification() {
  try {
    await db();
    console.log('--- News Schema Verification ---');

    // 1. Create a User with Preferences
    let user = await User.findOne({ email: 'test_news_user@example.com' });
    if (!user) {
      user = await User.create({
        username: 'testnewsuser',
        email: 'test_news_user@example.com',
        password: 'password',
        full_name: 'Test News User',
        newsPreferences: {
          followedCategories: ['AI', 'Startups'],
          followedTags: ['openai', 'funding']
        }
      });
    }
    console.log(`[PASS] User created with newsPreferences: ${user.newsPreferences.followedCategories.join(', ')}`);

    // 2. Create a NewsArticle
    let article = await NewsArticle.create({
      title: 'OpenAI announces new model',
      summary: 'OpenAI has released a new model with amazing capabilities.',
      contentSnippet: 'The new model is faster and cheaper...',
      sourceName: 'TechCrunch',
      sourceLink: `https://techcrunch.com/${Date.now()}`,
      category: 'AI',
      tags: ['openai', 'ai', 'model'],
      viewCount: 1,
      saveCount: 1,
      status: 'archived'
    });
    console.log(`[PASS] NewsArticle created: ${article.title} (Status: ${article.status})`);

    // 3. Create a Bookmark
    let bookmark = await NewsBookmark.create({
      userId: user._id,
      articleId: article._id
    });
    console.log(`[PASS] NewsBookmark created`);

    // 4. Test Duplicate Bookmark (should fail)
    try {
      await NewsBookmark.create({
        userId: user._id,
        articleId: article._id
      });
      console.log('[FAIL] Duplicate bookmark was allowed!');
    } catch (err) {
      if (err.code === 11000) {
        console.log('[PASS] Duplicate bookmark correctly rejected via compound index');
      } else {
        throw err;
      }
    }

    // 5. Create a View Event
    let viewEvent = await NewsViewEvent.create({
      userId: user._id,
      articleId: article._id
    });
    console.log(`[PASS] NewsViewEvent created`);

    // 6. Create a Report
    let report = await NewsReport.create({
      reportedBy: user._id,
      articleId: article._id,
      reason: 'misleading'
    });
    console.log(`[PASS] NewsReport created (Reason: ${report.reason})`);

    // Cleanup
    await NewsReport.findByIdAndDelete(report._id);
    await NewsViewEvent.findByIdAndDelete(viewEvent._id);
    await NewsBookmark.findByIdAndDelete(bookmark._id);
    await NewsArticle.findByIdAndDelete(article._id);
    await User.findByIdAndDelete(user._id);

    console.log('\nVerification complete!');
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

runVerification();
