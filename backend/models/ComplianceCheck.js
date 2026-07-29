const mongoose = require('mongoose');

const complianceCheckSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScholarshipApplication',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'verified', 'at_risk'],
    default: 'pending'
  },
  userSubmittedProof: {
    text: { type: String, default: null },
    fileUrl: { type: String, default: null }
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

complianceCheckSchema.index({ applicationId: 1, dueDate: 1 });
complianceCheckSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('ComplianceCheck', complianceCheckSchema);
