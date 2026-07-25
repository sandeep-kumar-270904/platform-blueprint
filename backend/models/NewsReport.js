const mongoose = require('mongoose');

const newsReportSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle'
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsComment'
  },
  targetType: {
    type: String,
    enum: ['NewsArticle', 'NewsComment'],
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'broken_link', 'misleading', 'harassment', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed_dismissed', 'reviewed_actioned'],
    default: 'pending'
  },
  adminNote: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('NewsReport', newsReportSchema);
