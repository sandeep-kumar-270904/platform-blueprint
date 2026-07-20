const mongoose = require('mongoose');

const communityLikeSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'celebrate', 'insightful', 'support'], default: 'like' }
}, { timestamps: true });

// Ensure one like per user per post
communityLikeSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('CommunityLike', communityLikeSchema);
