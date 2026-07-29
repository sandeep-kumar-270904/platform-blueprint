const mongoose = require('mongoose');

const RoomRentalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  rent: {
    type: Number,
    required: true,
    min: [0, 'Rent cannot be negative'],
  },
  roomType: {
    type: String,
    enum: ['Single', 'Shared', 'Entire Unit'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  availableBeds: {
    type: Number,
    required: true,
    min: [1, 'Must have at least 1 bed'],
  },
  moveInDate: {
    type: Date,
    required: true,
  },
  photos: [{
    type: String,
  }],
  utilitiesIncluded: {
    type: Boolean,
    default: false,
  },
  utilitiesNote: {
    type: String,
    trim: true,
  },
  lister: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  verificationStatus: {
    type: String,
    enum: ['None', 'Pending', 'Verified', 'Rejected'],
    default: 'None',
  },
  status: {
    type: String,
    enum: ['Available', 'Rented'],
    default: 'Available',
  },
  reports: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RoomRentalSchema.index({ roomType: 1, rent: 1 });
RoomRentalSchema.index({ availableBeds: 1 });
RoomRentalSchema.index({ moveInDate: 1 });
RoomRentalSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('RoomRental', RoomRentalSchema);
