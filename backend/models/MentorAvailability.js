const mongoose = require('mongoose');

const mentorAvailabilitySchema = new mongoose.Schema({
  mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MentorProfile', required: true },
  starts_at: { type: Date, required: true },
  ends_at: { type: Date, required: true },
  is_booked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MentorAvailability', mentorAvailabilitySchema);
