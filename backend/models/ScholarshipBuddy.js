const mongoose = require('mongoose');

const scholarshipBuddySchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['looking', 'matched', 'ended'],
    default: 'looking'
  },
  matchedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
  lastCheckInDate: {
    type: Date
  },
  checkInCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

scholarshipBuddySchema.index({ user1: 1 });
scholarshipBuddySchema.index({ user2: 1 });

module.exports = mongoose.model('ScholarshipBuddy', scholarshipBuddySchema);
