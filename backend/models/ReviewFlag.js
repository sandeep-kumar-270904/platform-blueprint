const mongoose = require('mongoose');

const reviewFlagSchema = new mongoose.Schema({
  reviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  reason: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['pending', 'reviewed_kept', 'reviewed_deleted'], default: 'pending' },
  notes: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }
}, { timestamps: true });

reviewFlagSchema.index({ status: 1 });
reviewFlagSchema.index({ reviewId: 1 });
reviewFlagSchema.index({ collegeId: 1 });

module.exports = mongoose.model('ReviewFlag', reviewFlagSchema);
