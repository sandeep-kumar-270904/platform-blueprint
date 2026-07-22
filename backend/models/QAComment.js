const mongoose = require('mongoose');

const qaCommentSchema = new mongoose.Schema({
  answer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QAAnswer', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  reportCount: { type: Number, default: 0 },
  isModeratorReviewed: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('QAComment', qaCommentSchema);
