const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const NewsBookmark = require('./models/NewsBookmark');
const NewsCollection = require('./models/NewsCollection');

dotenv.config({ path: path.join(__dirname, '.env') });

async function migrateBookmarks() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Starting migration...');

    // Find all bookmarks that do not belong to a collection
    const unassignedBookmarks = await NewsBookmark.find({ collectionId: { $exists: false } });
    console.log(`Found ${unassignedBookmarks.length} unassigned bookmarks.`);

    let migratedCount = 0;
    
    // Group them by user to create one "Uncategorized" collection per user
    const bookmarksByUser = {};
    for (const bm of unassignedBookmarks) {
      const uIdStr = bm.userId.toString();
      if (!bookmarksByUser[uIdStr]) {
        bookmarksByUser[uIdStr] = [];
      }
      bookmarksByUser[uIdStr].push(bm);
    }

    for (const [userIdStr, bookmarks] of Object.entries(bookmarksByUser)) {
      // Find or create 'Uncategorized' collection for this user
      let uncategorized = await NewsCollection.findOne({ userId: userIdStr, name: 'Uncategorized' });
      if (!uncategorized) {
        uncategorized = await NewsCollection.create({
          userId: userIdStr,
          name: 'Uncategorized',
          description: 'Default collection for migrated bookmarks'
        });
      }

      // Assign the collectionId to the bookmarks
      for (const bm of bookmarks) {
        bm.collectionId = uncategorized._id;
        await bm.save();
        migratedCount++;
      }
    }

    console.log(`Migration complete. Migrated ${migratedCount} bookmarks to 'Uncategorized' collections.`);
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

if (require.main === module) {
  migrateBookmarks();
}

module.exports = migrateBookmarks;
