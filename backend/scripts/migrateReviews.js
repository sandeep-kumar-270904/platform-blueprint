const mongoose = require('mongoose');
const Review = require('../models/Review');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/platform-blueprint');
    console.log('Connected to MongoDB.');

    const reviews = await Review.find({});
    let updatedCount = 0;

    for (const review of reviews) {
      let changed = false;

      // Migrate overallRating
      if (review.overallRating === undefined || review.overallRating === null) {
        review.overallRating = review.rating || 0;
        changed = true;
      }

      // Ensure wouldRecommend is a boolean, default to null if not set
      if (review.wouldRecommend === undefined) {
        review.wouldRecommend = null;
        changed = true;
      }

      // Convert pros from String to Array if needed
      if (review.pros !== undefined && typeof review.pros === 'string') {
        const str = review.pros.trim();
        review.pros = str ? [str] : [];
        changed = true;
      } else if (review.pros === undefined) {
        review.pros = [];
        changed = true;
      }

      // Convert cons from String to Array if needed
      if (review.cons !== undefined && typeof review.cons === 'string') {
        const str = review.cons.trim();
        review.cons = str ? [str] : [];
        changed = true;
      } else if (review.cons === undefined) {
        review.cons = [];
        changed = true;
      }

      if (changed) {
        await Review.updateOne(
          { _id: review._id },
          {
            $set: {
              overallRating: review.overallRating,
              wouldRecommend: review.wouldRecommend,
              pros: review.pros,
              cons: review.cons
            }
          }
        );
        updatedCount++;
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} reviews.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
