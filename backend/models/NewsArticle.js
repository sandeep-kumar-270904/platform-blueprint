const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  summary: {
    type: String,
    required: true
  },
  contentSnippet: {
    type: String
  },
  sourceLink: {
    type: String,
    required: true,
    unique: true
  },
  sourceName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['AI', 'Startups', 'Big Tech', 'Research', 'Gadgets'],
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  publishedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  viewCount: {
    type: Number,
    default: 0
  },
  saveCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['live', 'pending', 'rejected', 'archived'],
    default: 'pending'
  },
  submissionType: {
    type: String,
    enum: ['automatic', 'user_submitted'],
    default: 'automatic'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isFeatured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add indexes for fast searching and filtering
newsArticleSchema.index({ title: 'text', summary: 'text', tags: 'text' });
// General feed index
newsArticleSchema.index({ status: 1, publishedAt: -1 });
// Category feed index (Equality first, then sort)
newsArticleSchema.index({ status: 1, category: 1, publishedAt: -1 });
// Tag feed index (Equality first, then sort)
newsArticleSchema.index({ status: 1, tags: 1, publishedAt: -1 });

module.exports = mongoose.model('NewsArticle', newsArticleSchema);
