const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('CommunityComment', communityCommentSchema);
