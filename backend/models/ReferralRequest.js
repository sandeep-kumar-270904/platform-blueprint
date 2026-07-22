const mongoose = require('mongoose');

const referralRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referrer_profile: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferrerProfile', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep', required: true },
  // Snapshot of resume to prevent broken references if deleted
  resumeSnapshot: {
    original_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeVersion' },
    file_url: { type: String, required: true },
    versionName: { type: String, required: true }
  },
  target_role: { type: String, required: true },
  message: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'declined', 'referred', 'unavailable'], 
    default: 'pending' 
  },
  response_message: { type: String, default: '' },
  statusHistory: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  hasBeenRated: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure status changes are tracked in history
referralRequestSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, timestamp: new Date() });
  }
  next();
});

module.exports = mongoose.model('ReferralRequest', referralRequestSchema);
