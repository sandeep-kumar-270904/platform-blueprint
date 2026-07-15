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
  chargedAmount: { type: Number, default: 0 }, // Authoritative amount charged in chargedCurrency
  chargedCurrency: { type: String, default: 'usd' }, // Authoritative currency charged
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  stripeSessionId: { type: String, default: null },
  stripePaymentIntentId: { type: String, default: null },
  paymentExpiresAt: { type: Date, default: null }, // Slot hold expiry
  meetingLink: { type: String, default: null }, // Legacy
  dailyRoomUrl: { type: String, default: null }, // Daily.co integration
  dailyRoomId: { type: String, default: null },
  calendarEventId: { type: String, default: null }, // Sync with external calendar
  
  // Phase 5: No-show tracking
  mentorJoinedAt: { type: Date, default: null },
  menteeJoinedAt: { type: Date, default: null },
  noShowBy: { type: String, enum: ['mentee', 'mentor', 'both', null], default: null },
  
  // AI & Recording
  recordingUrl: { type: String, default: null },
  recordingStatus: { 
    type: String, 
    enum: ['not_started', 'processing', 'ready', 'failed'], 
    default: 'not_started' 
  },
  transcriptText: { type: String, default: null },
  aiSummary: { type: String, default: null },
  aiActionItems: [{ type: String }],
  
  menteeNotes: { type: String, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, enum: ['mentee', 'mentor', 'system', null], default: null },
  refundStatus: { type: String, enum: ['none', 'full', 'partial'], default: 'none' },
  rescheduleHistory: [{
    previousDate: Date,
    rescheduledBy: { type: String, enum: ['mentee', 'mentor'] },
    reason: String,
    rescheduledAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Prevent double bookings for a mentor at the exact same time
mentorBookingSchema.index({ mentorId: 1, scheduledAt: 1 }, { unique: true });
mentorBookingSchema.index({ menteeId: 1 });
mentorBookingSchema.index({ status: 1 });

module.exports = mongoose.model('MentorBooking', mentorBookingSchema);
