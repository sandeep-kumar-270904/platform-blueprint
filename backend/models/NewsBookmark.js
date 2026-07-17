const mongoose = require('mongoose');

const newsBookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate bookmarks for the same user and article
newsBookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true });
// Fast lookup of all bookmarks for a specific article
newsBookmarkSchema.index({ articleId: 1 });

module.exports = mongoose.model('NewsBookmark', newsBookmarkSchema);
