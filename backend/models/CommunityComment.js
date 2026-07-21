const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityComment', default: null },
  text: { type: String, required: true },
  report_count: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },
  auto_flag_reason: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('CommunityComment', communityCommentSchema);
