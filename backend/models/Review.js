const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, required: true },
  reviewText: { type: String, required: true },
  pros: { type: String },
  cons: { type: String },
  courseStudied: { type: String },
  yearOfStudy: { type: String },
  isVerified: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Review', ReviewSchema);
