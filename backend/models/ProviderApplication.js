const mongoose = require('mongoose');

const providerApplicationSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Plumbing', 'Electrical', 'Electronics', 'Cleaning', 'Handyman', 'AC & Appliances', 'Other']
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  serviceArea: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'Approved', 'Rejected'],
    default: 'Submitted'
  },
  referenceId: {
    type: String,
    required: true,
    unique: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for future admin queue sorting/filtering
providerApplicationSchema.index({ status: 1, createdAt: 1 });
// Index for idempotency checks
providerApplicationSchema.index({ businessName: 1, contactPhone: 1, createdAt: -1 });

module.exports = mongoose.model('ProviderApplication', providerApplicationSchema);
