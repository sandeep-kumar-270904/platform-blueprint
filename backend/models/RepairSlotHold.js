const mongoose = require('mongoose');

const repairSlotHoldSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairProvider',
    required: true,
    index: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RepairRequest' // Populated after the request is submitted
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  time: {
    type: String, // HH:mm
    required: true
  },
  status: {
    type: String,
    enum: ['held', 'confirmed', 'released'],
    default: 'held'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Atomic check-and-hold: prevent multiple 'held' or 'confirmed' holds for the same provider + date + time.
// This ensures we can safely rely on MongoDB to reject double-bookings.
repairSlotHoldSchema.index({ providerId: 1, date: 1, time: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: { $in: ['held', 'confirmed'] } } 
});

module.exports = mongoose.model('RepairSlotHold', repairSlotHoldSchema);
