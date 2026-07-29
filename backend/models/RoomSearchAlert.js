const mongoose = require('mongoose');

const RoomSearchAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  criteria: {
    location: { type: String, trim: true },
    maxRent: { type: Number },
    roomType: { type: String, enum: ['All', 'Single', 'Shared', 'Entire Unit'] },
    minBeds: { type: Number }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

RoomSearchAlertSchema.index({ user: 1 });

module.exports = mongoose.model('RoomSearchAlert', RoomSearchAlertSchema);
