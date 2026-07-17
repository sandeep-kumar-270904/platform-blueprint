const mongoose = require('mongoose');

const newsReportSchema = new mongoose.Schema({
  articleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    enum: ['spam', 'broken_link', 'misleading', 'other'],
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
