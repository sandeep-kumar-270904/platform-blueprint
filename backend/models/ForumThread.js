const mongoose = require('mongoose');

const forumThreadSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  reply_count: { type: Number, default: 0 },
  view_count: { type: Number, default: 0 },
  like_count: { type: Number, default: 0 },
  liked_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  is_pinned: { type: Boolean, default: false },
  is_locked: { type: Boolean, default: false },
  last_activity_at: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ForumThread', forumThreadSchema);
