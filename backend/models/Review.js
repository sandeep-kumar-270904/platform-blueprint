const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  categoryRatings: {
    hostel: { type: Number, min: 1, max: 5 },
    labs: { type: Number, min: 1, max: 5 },
    faculty: { type: Number, min: 1, max: 5 },
    campusLife: { type: Number, min: 1, max: 5 },
    placements: { type: Number, min: 1, max: 5 },
    academics: { type: Number, min: 1, max: 5 },
    infrastructure: { type: Number, min: 1, max: 5 }
  },
  title: { type: String, required: true },
  reviewText: { type: String, required: true },
  pros: { type: String },
  cons: { type: String },
  courseStudied: { type: String },
  yearOfStudy: { type: String },
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

module.exports = mongoose.model('Review', ReviewSchema);
