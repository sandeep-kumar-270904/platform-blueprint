const mongoose = require('mongoose');

const referrerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep', required: true },
  role: { type: String, required: true },
  batch_year: { type: Number, required: true },
  note: { type: String, default: '' },
  limit: { type: Number, default: 5 },
  total_referrals_given: { type: Number, default: 0 },
  is_active: { type: Boolean, default: true },
  
  // Verification & Trust
  verificationStatus: { type: String, enum: ['Unverified', 'Pending', 'Verified', 'Failed'], default: 'Unverified' },
  verifiedEmail: { type: String },
  verificationTimestamp: { type: Date },
  linkedInUrl: { type: String },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  
  // Ratings & Moderation
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  isUnderReview: { type: Boolean, default: false }
}, { timestamps: true });

referrerProfileSchema.index({ user: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('ReferrerProfile', referrerProfileSchema);
