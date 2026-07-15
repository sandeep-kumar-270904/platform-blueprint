const mongoose = require('mongoose');

const payoutTrackingSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorBooking', required: true, unique: true },
  amountEarned: { type: Number, required: true },
  platformFee: { type: Number, required: true },
  payoutStatus: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
  transactionId: { type: String, default: null }
}, { timestamps: true });

payoutTrackingSchema.index({ mentorId: 1, payoutStatus: 1 });

module.exports = mongoose.model('PayoutTracking', payoutTrackingSchema);
