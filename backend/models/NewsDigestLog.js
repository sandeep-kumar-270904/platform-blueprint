const mongoose = require('mongoose');

const newsDigestLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true
  },
  articleIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle'
  }],
  errorDetail: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('NewsDigestLog', newsDigestLogSchema);
