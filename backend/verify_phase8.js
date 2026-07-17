const mongoose = require('mongoose');
require('dotenv').config();

const NewsArticle = require('./models/NewsArticle');
const NewsBookmark = require('./models/NewsBookmark');
const NewsViewEvent = require('./models/NewsViewEvent');

async function verify() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studenthub');
    console.log('[PASS] Connected to MongoDB');

    // Test GET /api/news logic (mocking req.query)
    const liveArticles = await NewsArticle.find({ status: 'live' }).limit(5);
    console.log(`[PASS] Found ${liveArticles.length} live articles for feed`);

    // Test Trending Logic
    const trending = await NewsArticle.aggregate([
      { $match: { status: 'live' } },
      { 
        $addFields: { 
          trendingScore: { $add: ["$viewCount", { $multiply: ["$saveCount", 2] }] } 
        } 
      },
      { $sort: { trendingScore: -1, publishedAt: -1 } },
      { $limit: 3 }
    ]);
    console.log(`[PASS] Trending pipeline success. Top score: ${trending[0]?.trendingScore || 0}`);

    if (liveArticles.length > 0) {
      const art = liveArticles[0];
      
      // Test Related Logic
      const related = await NewsArticle.find({
        _id: { $ne: art._id },
        status: 'live',
        $or: [
          { category: art.category },
          { tags: { $in: art.tags || [] } }
        ]
      }).limit(2);
      console.log(`[PASS] Related articles pipeline success. Found: ${related.length}`);
    }

    console.log('\n✅ Phase 8 Verification Complete: All queries execute without syntax errors.');

  } catch (err) {
    console.error('[FAIL] Verification error:', err);
  } finally {
    mongoose.connection.close();
  }
}

verify();
