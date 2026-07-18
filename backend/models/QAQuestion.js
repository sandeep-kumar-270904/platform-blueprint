const mongoose = require('mongoose');

const qaQuestionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  upvotes: { type: Number, default: 0 },
  upvoted_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  answer_count: { type: Number, default: 0 },
  view_count: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' },
  is_pinned: { type: Boolean, default: false }
}, { timestamps: true });

qaQuestionSchema.index({ subject: 1 });
qaQuestionSchema.index({ isResolved: 1 });

module.exports = mongoose.model('QAQuestion', qaQuestionSchema);
