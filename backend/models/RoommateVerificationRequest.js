const mongoose = require('mongoose');

const roommateVerificationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  idPhotoUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('RoommateVerificationRequest', roommateVerificationRequestSchema);
