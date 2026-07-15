const mongoose = require('mongoose');

const mentorBookingSchema = new mongoose.Schema({
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  status: { 
    type: String, 
    enum: ['requested', 'confirmed', 'completed', 'cancelled', 'no-show'],
    default: 'requested'
  },
  sessionType: { type: String, enum: ['1-on-1', 'AMA'], default: '1-on-1' },
  pricePaid: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  meetingLink: { type: String, default: null },
  menteeNotes: { type: String, default: null },
  cancellationReason: { type: String, default: null }
}, { timestamps: true });

// Prevent double bookings for a mentor at the exact same time
mentorBookingSchema.index({ mentorId: 1, scheduledAt: 1 }, { unique: true });
mentorBookingSchema.index({ menteeId: 1 });
mentorBookingSchema.index({ status: 1 });

module.exports = mongoose.model('MentorBooking', mentorBookingSchema);
