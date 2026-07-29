const mongoose = require('mongoose');

const newsViewDedupSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  },
  viewerId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Document automatically expires after 24 hours (86400 seconds)
  }
});

// Ensure a unique viewer can only be tracked once per article in the TTL window
newsViewDedupSchema.index({ articleId: 1, viewerId: 1 }, { unique: true });

module.exports = mongoose.model('NewsViewDedup', newsViewDedupSchema);
