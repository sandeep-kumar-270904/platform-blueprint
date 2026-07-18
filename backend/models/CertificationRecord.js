const mongoose = require('mongoose');

const certificationRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: Date, required: true },
  expiryDate: { type: Date },
  credentialId: { type: String },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'self_attested', 'platform_verified'], 
    default: 'unverified' 
  },
  evidenceUrl: { type: String }, // File or link
  rejectionReason: { type: String }, // Admin feedback if rejected
  linkedResumeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }]
}, { timestamps: true });

certificationRecordSchema.index({ userId: 1 });

module.exports = mongoose.model('CertificationRecord', certificationRecordSchema);
