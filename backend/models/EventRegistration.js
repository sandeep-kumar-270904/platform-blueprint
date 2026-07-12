const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['registered', 'waitlisted', 'cancelled'],
    default: 'registered'
  },
  teamName: { type: String, default: null },
  teamMembers: [{ type: String }], // array of names/emails
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a user can only register once for an event
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
