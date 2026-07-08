const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image_url: { type: String, default: null },
  tags: [{ type: String }],
  like_count: { type: Number, default: 0 },
  liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comment_count: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
