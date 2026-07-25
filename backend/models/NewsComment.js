const mongoose = require('mongoose');

const newsCommentSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 1000
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsComment',
    default: null
  },
  aiModerationScore: {
    flagged: { type: Boolean, default: false },
    reason: { type: String }
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['live', 'flagged', 'removed'],
    default: 'live'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NewsComment', newsCommentSchema);
