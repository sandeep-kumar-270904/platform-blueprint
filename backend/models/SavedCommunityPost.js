const mongoose = require('mongoose');

const savedCommunityPostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true }
}, { timestamps: true });

savedCommunityPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

module.exports = mongoose.model('SavedCommunityPost', savedCommunityPostSchema);
