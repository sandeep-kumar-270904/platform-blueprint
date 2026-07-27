const mongoose = require('mongoose');

const creatorAnalyticsStatSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorContent', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
}, { timestamps: true });

creatorAnalyticsStatSchema.index({ contentId: 1, date: 1 }, { unique: true });
creatorAnalyticsStatSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('CreatorAnalyticsStat', creatorAnalyticsStatSchema);
