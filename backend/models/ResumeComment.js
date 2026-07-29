const mongoose = require('mongoose');

const resumeCommentSchema = new mongoose.Schema({
  feedbackRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeedbackRequest', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sectionAnchor: { type: String, required: true }, // e.g. "experience_0", "summary", "skills"
  body: { type: String, required: true },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

resumeCommentSchema.index({ feedbackRequestId: 1 });

module.exports = mongoose.model('ResumeComment', resumeCommentSchema);
