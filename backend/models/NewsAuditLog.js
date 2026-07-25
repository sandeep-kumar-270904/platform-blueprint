const mongoose = require('mongoose');

const newsAuditLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['approve', 'reject', 'delete', 'feature', 'unfeature'],
    required: true
  },
  targetArticleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('NewsAuditLog', newsAuditLogSchema);
