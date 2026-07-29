const mongoose = require('mongoose');

const scholarshipReviewSchema = new mongoose.Schema({
  scholarshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScholarshipApplication', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  tipsForApplicants: { type: String },
  wasAwarded: { type: Boolean, required: true },
  reportCount: { type: Number, default: 0 },
  reports: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    details: { type: String },
    date: { type: Date, default: Date.now }
  }],
  isHidden: { type: Boolean, default: false }
}, { timestamps: true });

scholarshipReviewSchema.index({ scholarshipId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ScholarshipReview', scholarshipReviewSchema);
