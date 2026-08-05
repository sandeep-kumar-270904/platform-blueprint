const mongoose = require('mongoose');

const VerificationAuditLogSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true,
    index: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // if null, it was an automated system change
  },
  fieldChanged: {
    type: String,
    enum: ['isVerified', 'businessRegistration', 'phoneNumber', 'address', 'idProof'],
    required: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Sort by provider and time to easily pull a timeline of verification changes
VerificationAuditLogSchema.index({ providerId: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationAuditLog', VerificationAuditLogSchema);
