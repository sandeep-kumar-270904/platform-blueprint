const mongoose = require('mongoose');

function arrayLimit(val) {
  return val.length <= 5;
}

const ReviewSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  categoryRatings: {
    academics: { type: Number, min: 1, max: 5 },
    placements: { type: Number, min: 1, max: 5 },
    faculty: { type: Number, min: 1, max: 5 },
    infrastructure: { type: Number, min: 1, max: 5 },
    hostel: { type: Number, min: 1, max: 5 },
    campusLife: { type: Number, min: 1, max: 5 },
    valueForMoney: { type: Number, min: 1, max: 5 }
  },
  overallRating: { type: Number },
  title: { type: String, required: true },
  reviewText: { type: String, required: true },
  pros: [{ type: String, validate: [arrayLimit, 'Exceeds the limit of 5 pros'] }],
  cons: [{ type: String, validate: [arrayLimit, 'Exceeds the limit of 5 cons'] }],
  wouldRecommend: { type: Boolean },
  yearAttended: { type: Number },
  courseStudied: { type: String },
  yearOfStudy: { type: String },
  ipAddress: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified'], default: 'unverified' },
  verificationMethod: { type: String },
  flaggedCount: { type: Number, default: 0 },
  flagReasons: [{
    reason: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['public', 'hidden'], default: 'public' },
  helpfulVotes: { type: Number, default: 0 }
}, {
  timestamps: true
});

ReviewSchema.index({ collegeId: 1, isApproved: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
