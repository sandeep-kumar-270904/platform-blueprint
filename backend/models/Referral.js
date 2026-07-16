const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referredUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Can be null if referring an external email not yet registered
  referredEmail: { type: String, required: true },
  message: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'applied', 'hired', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

referralSchema.index({ job: 1, referredEmail: 1 }, { unique: true });

module.exports = mongoose.model('Referral', referralSchema);
