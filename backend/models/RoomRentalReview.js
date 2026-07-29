const mongoose = require('mongoose');

const RoomRentalReviewSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomRental',
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  reviewText: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// A user can only review a room once
RoomRentalReviewSchema.index({ room: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('RoomRentalReview', RoomRentalReviewSchema);
