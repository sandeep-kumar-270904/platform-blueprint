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
  jitteredCoordinates: {
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
  amenities: [{
    type: String
  }],
  houseRules: {
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false },
    guestPolicy: { type: String, default: 'Flexible' },
    genderPreference: { type: String, enum: ['Any', 'Male Only', 'Female Only'], default: 'Any' },
    quietHours: { type: String }
  },
  deposit: {
    type: Number,
    min: 0,
    default: 0
  },
  minLease: {
    type: Number,
    min: 0,
    default: 0
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
  verificationProof: {
    type: String
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
