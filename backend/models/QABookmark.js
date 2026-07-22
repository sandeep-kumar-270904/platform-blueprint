const mongoose = require('mongoose');

const qaBookmarkSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QAQuestion', required: true }
}, { timestamps: true });

// Ensure a user can only bookmark a question once
qaBookmarkSchema.index({ user_id: 1, question_id: 1 }, { unique: true });

module.exports = mongoose.model('QABookmark', qaBookmarkSchema);
