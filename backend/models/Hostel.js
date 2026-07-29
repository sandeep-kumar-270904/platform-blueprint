const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['single', 'shared', 'dorm'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 1
  }
});

const hostelSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  type: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed'],
    required: true
  },
  pricing: {
    type: Number,
    required: true
  },
  roomTypes: [roomTypeSchema],
  amenities: [{
    type: String
  }],
  totalCapacity: {
    type: Number,
    required: true,
    default: 0
  },
  availableBeds: {
    type: Number,
    required: true,
    default: 0
  },
  isFull: {
    type: Boolean,
    default: false
  },
  mealPlan: {
    included: { type: Boolean, default: false },
    type: { type: String, enum: ['veg', 'non-veg', 'both', null], default: null },
    note: { type: String }
  },
  houseRules: {
    curfewTime: { type: String },
    guestPolicy: { type: String },
    otherRules: { type: String }
  },
  deposit: {
    amount: { type: Number, default: 0 },
    refundPolicy: { type: String },
    lockInPeriod: { type: String }
  },
  coverPhotoIndex: {
    type: Number,
    default: 0
  },
  photos: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'pending', 'verified'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

hostelSchema.index({ name: 'text', description: 'text', address: 'text' });
hostelSchema.index({ type: 1 });
hostelSchema.index({ pricing: 1 });
hostelSchema.index({ amenities: 1 });
hostelSchema.index({ 'roomTypes.type': 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
