const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Review = require('../backend/models/Review');
const CommunityPost = require('../backend/models/CommunityPost');

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_insights');
    console.log('Connected to MongoDB');

    // 1. Migrate Reviews: Set overallRating = rating where overallRating is null
    const reviews = await Review.find({ overallRating: { $exists: false } });
    console.log(`Found ${reviews.length} reviews missing overallRating`);
    
    let reviewUpdates = 0;
    for (const r of reviews) {
      r.overallRating = r.rating;
      // We skip validation because other fields might be invalid in old data
      await r.save({ validateBeforeSave: false });
      reviewUpdates++;
    }
    console.log(`Updated ${reviewUpdates} reviews with overallRating`);

    // 2. Migrate CommunityPosts: Change category "campus_update" to "discussion"
    const posts = await CommunityPost.find({ category: "campus_update" });
    console.log(`Found ${posts.length} posts with category 'campus_update'`);

    let postUpdates = 0;
    for (const p of posts) {
      p.category = "discussion";
      await p.save({ validateBeforeSave: false });
      postUpdates++;
    }
    console.log(`Migrated ${postUpdates} posts from 'campus_update' to 'discussion'`);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

runMigration();
