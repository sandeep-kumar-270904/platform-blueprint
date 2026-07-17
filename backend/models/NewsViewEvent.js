const mongoose = require('mongoose');

const newsViewEventSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true // Useful for querying "views in last 24h"
  }
});

// Compound index for fast trending calculations (filtering by date and grouping by article)
newsViewEventSchema.index({ viewedAt: -1, articleId: 1 });

module.exports = mongoose.model('NewsViewEvent', newsViewEventSchema);
