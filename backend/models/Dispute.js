const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorBooking', required: true },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['no_show', 'inappropriate_behavior', 'poor_quality', 'other'], required: true },
  description: { type: String, required: true },
  evidence: { type: String }, // Optional text or URL to evidence
  status: { type: String, enum: ['pending', 'under_review', 'resolved'], default: 'pending' },
  resolution: { type: String, enum: ['refunded', 'warning_issued', 'banned', 'dismissed', 'none'], default: 'none' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminNotes: { type: String }
}, { timestamps: true });

disputeSchema.index({ bookingId: 1 });
disputeSchema.index({ status: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
