const mongoose = require('mongoose');

const ideaReportSchema = new mongoose.Schema({
  targetType: { type: String, enum: ['Idea', 'Comment', 'BrainstormThought', 'CirclePost', 'User'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'targetType' },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'dismissed', 'actioned'], default: 'open' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('IdeaReport', ideaReportSchema);
