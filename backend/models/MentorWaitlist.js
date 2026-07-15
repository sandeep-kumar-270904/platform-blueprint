const mongoose = require('mongoose');

const mentorWaitlistSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Specific time window or "any"
  preferredStartTime: { type: Date, default: null },
  preferredEndTime: { type: Date, default: null },
  anyAvailability: { type: Boolean, default: true },
  
  status: { 
    type: String, 
    enum: ['waiting', 'notified', 'expired', 'converted'], 
    default: 'waiting' 
  },
  
  claimExpiresAt: { type: Date, default: null },
  notifiedAt: { type: Date, default: null },
  convertedBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorBooking', default: null }
}, { timestamps: true });

// Help quickly find waiting users
mentorWaitlistSchema.index({ mentorId: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model('MentorWaitlist', mentorWaitlistSchema);
