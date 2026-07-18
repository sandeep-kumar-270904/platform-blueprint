const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  thread_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumThread', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumReply', default: null },
  like_count: { type: Number, default: 0 },
  liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isHidden: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ForumReply', forumReplySchema);
