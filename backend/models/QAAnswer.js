const mongoose = require('mongoose');

const qaAnswerSchema = new mongoose.Schema({
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'QAQuestion', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  upvoted_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  is_accepted: { type: Boolean, default: false },
  isMentorVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('QAAnswer', qaAnswerSchema);
