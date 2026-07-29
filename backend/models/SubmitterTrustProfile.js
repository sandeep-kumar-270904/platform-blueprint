const mongoose = require('mongoose');

const submitterTrustProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  approvedCount: {
    type: Number,
    default: 0
  },
  rejectedCount: {
    type: Number,
    default: 0
  },
  trustTier: {
    type: String,
    enum: ['standard', 'spot_check_eligible'],
    default: 'standard'
  }
}, { timestamps: true });

module.exports = mongoose.model('SubmitterTrustProfile', submitterTrustProfileSchema);
