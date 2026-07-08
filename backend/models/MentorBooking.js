const mongoose = require('mongoose');

const mentorBookingSchema = new mongoose.Schema({
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  mentee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheduled_at: { type: Date, required: true },
  duration_minutes: { type: Number, default: 60 },
  price_paid: { type: Number, default: 0 },
  status: { type: String, default: "pending" }, // pending, confirmed, cancelled
  video_link: { type: String, default: null },
  notes: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('MentorBooking', mentorBookingSchema);
