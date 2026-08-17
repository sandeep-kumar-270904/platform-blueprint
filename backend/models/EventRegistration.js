const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['registered', 'waitlisted', 'cancelled'],
    default: 'registered'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  teamName: { type: String, default: null }, // DEPRECATED: use teamId instead
  teamMembers: [{ type: String }], // array of names/emails
  lookingForTeammates: { type: Boolean, default: false },
  skills: { type: String, default: "" },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date, default: null },
  registeredAt: { type: Date, default: Date.now },
  lookingForTeammates: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure a user can only register for an event once
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ userId: 1 }); // For querying user's registrations

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
