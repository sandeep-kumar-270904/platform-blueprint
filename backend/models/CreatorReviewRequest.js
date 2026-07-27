const mongoose = require('mongoose');

const creatorReviewRequestSchema = new mongoose.Schema({
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorContent', required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
  comments: [{
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

creatorReviewRequestSchema.index({ contentId: 1, reviewerId: 1 }, { unique: true });
creatorReviewRequestSchema.index({ creatorId: 1 });
creatorReviewRequestSchema.index({ reviewerId: 1 });

module.exports = mongoose.model('CreatorReviewRequest', creatorReviewRequestSchema);
