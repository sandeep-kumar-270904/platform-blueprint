const mongoose = require('mongoose');

const teamRequestSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Ensure a user can only send one request to another user per event
teamRequestSchema.index({ eventId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });

module.exports = mongoose.model('TeamRequest', teamRequestSchema);
