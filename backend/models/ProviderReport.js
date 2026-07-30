const mongoose = require('mongoose');

const ProviderReportSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reasonCategory: {
    type: String,
    enum: ['Fraud/Scam', 'Inappropriate Behavior', 'Unresponsive', 'False Information', 'Other'],
    required: true
  },
  details: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['Open', 'Reviewed', 'Resolved', 'Dismissed'],
    default: 'Open'
  },
  resolutionNote: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Compound index to help quickly find existing reports by the same user against the same provider
ProviderReportSchema.index({ providerId: 1, reportedBy: 1, createdAt: -1 });
// Index for admin queues
ProviderReportSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('ProviderReport', ProviderReportSchema);
