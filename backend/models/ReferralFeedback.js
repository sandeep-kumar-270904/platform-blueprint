const mongoose = require('mongoose');

const referralFeedbackSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferralRequest', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referrerProfile: { type: mongoose.Schema.Types.ObjectId, ref: 'ReferrerProfile', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: { type: String }
}, { timestamps: true });

// Ensure a student can only submit feedback once per request
referralFeedbackSchema.index({ request: 1 }, { unique: true });

module.exports = mongoose.model('ReferralFeedback', referralFeedbackSchema);
