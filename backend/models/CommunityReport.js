const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityPost', required: true, index: true },
  reporting_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
}, { timestamps: true });

// A user can only report a specific post once
communityReportSchema.index({ post_id: 1, reporting_user_id: 1 }, { unique: true });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
