const mongoose = require('mongoose');

const qaAnswerSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QAQuestion', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  is_accepted: { type: Boolean, default: false },
  isMentorVerified: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  reportCount: { type: Number, default: 0 },
  isModeratorReviewed: { type: Boolean, default: false },
  hasReceivedUpvoteXP: { type: Boolean, default: false },
  hasReceivedAcceptedXP: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('QAAnswer', qaAnswerSchema);
