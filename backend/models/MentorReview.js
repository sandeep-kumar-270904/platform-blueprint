const mongoose = require('mongoose');

const mentorReviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorBooking', required: true, unique: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  writtenFeedback: { type: String, required: true, trim: true },
  mentorReply: { type: String, default: null, trim: true },
  moderationStatus: { type: String, enum: ['public', 'hidden'], default: 'public' }
}, { timestamps: true });

mentorReviewSchema.index({ mentorId: 1, moderationStatus: 1 });
mentorReviewSchema.index({ menteeId: 1 });

module.exports = mongoose.model('MentorReview', mentorReviewSchema);
