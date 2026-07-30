const mongoose = require('mongoose');

const operatingHoursSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' }, // 24-hour format HH:mm
  closeTime: { type: String, default: '17:00' } // 24-hour format HH:mm
}, { _id: false });

const RepairProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true, // For fast category filtering
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  services: [{
    type: String,
    trim: true
  }],
  priceIndicator: {
    type: String, // e.g. "Starting from $30"
    required: true
  },
  basePrice: {
    type: Number, // Stored numerically for sorting "price ascending"
    default: 0
  },
  location: {
    address: {
      type: String,
      required: true
    },
    // GeoJSON point for geospatial sorting (Nearest)
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      required: true
    }
  },
  contact: {
    phone: { type: String },
    email: { type: String }
  },
  // Allows manual override ("Available 24/7", "Closed") instead of computing from hours
  manualStatusOverride: {
    type: String,
    enum: ["", "Open now", "Closed", "Usually responds within 2 hours", "Available 24/7"],
    default: ""
  },
  operatingHours: [operatingHoursSchema],
  
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    businessRegistration: { type: Boolean, default: false },
    phoneNumber: { type: Boolean, default: false },
    address: { type: Boolean, default: false },
    idProof: { type: Boolean, default: false }
  },
  
  reputationStats: {
    responseRate: { type: Number, default: 0 }, // 0 to 100 percentage
    responseTimeHours: { type: Number, default: 0 } // e.g. 2 for 2 hours
  },
  
  handlesEmergencies: {
    type: Boolean,
    default: false
  },
  
  gallery: [{
    imageUrl: { type: String, required: true },
    type: { type: String, enum: ['single', 'before', 'after'], default: 'single' },
    groupId: { type: String }, // Links before/after pairs together
    caption: { type: String },
    category: { type: String },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Derived fields from RepairReviews (cached here for fast sorting/display)
  rating: {
    type: Number,
    default: 0,
    index: true // For top_rated sort
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  
  // Computed badge statuses cached here to avoid heavy aggregation on reads
  badges: {
    isTopRated: { type: Boolean, default: false },
    isPopular: { type: Boolean, default: false },
    isNew: { type: Boolean, default: true }
  },
  
  // Soft deletion flag
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a 2dsphere index is created for geospatial queries
RepairProviderSchema.index({ "location.coordinates": "2dsphere" });

// Add text index for fast search
RepairProviderSchema.index(
  { name: 'text', description: 'text', services: 'text' },
  { weights: { name: 10, services: 5, description: 1 }, name: 'RepairSearchIndex' }
);

module.exports = mongoose.model('RepairProvider', RepairProviderSchema);
