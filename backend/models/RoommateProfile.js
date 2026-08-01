const mongoose = require('mongoose');

function arrayLimit(val) {
  return val.length <= 3;
}

const RoommateProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferredLocations: {
    type: [String],
    default: []
  },
  profilePhoto: {
    type: String,
    default: null
  },
  galleryPhotos: {
    type: [String],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 3']
  },
  lifestyle_preferences: {
    cleanliness: {
      type: String,
      enum: ['Messy', 'Average', 'Clean', 'Neat Freak'],
      required: true
    },
    sleepSchedule: {
      type: String,
      enum: ['Early Bird', 'Night Owl', 'Flexible'],
      required: true
    },
    noiseTolerance: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
    },
    smoking: {
      type: String,
      enum: ['No', 'Yes', 'Outside only'],
      required: true
    },
    pets: {
      type: String,
      enum: ['No', 'Yes', 'Cats only', 'Dogs only'],
      required: true
    },
    guestPolicy: {
      type: String,
      enum: ['Strictly No Guests', 'Rarely', 'Occasionally', 'Frequently']
    },
    cookingHabits: {
      type: String,
      enum: ['Rarely Cooks', 'Cooks Often - Keeps Separate', 'Cooks Often - Shares Meals']
    },
    sharedSpaceExpectations: {
      type: String,
      enum: ['Strictly Separate', 'Happy to Share']
    }
  },
  budgetRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  moveInDate: {
    type: Date,
    required: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  visibility: {
    type: String,
    enum: ['everyone', 'same_college', 'hidden'],
    default: 'everyone'
  },
  status: {
    type: String,
    enum: ['active', 'paused'],
    default: 'active'
  },
  verificationStatus: {
    type: String,
    enum: ['none', 'email_verified', 'id_verified'],
    default: 'none'
  },
  dismissedSuggestions: [{
    type: String
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  calendarSync: {
    enabled: { type: Boolean, default: false },
    eventId: { type: String, default: null }
  },
  analytics: {
    viewCount: { type: Number, default: 0 },
    viewHistory: [{
      date: { type: Date, default: Date.now }
    }],
    averageResponseTimeMs: { type: Number, default: null } // Time to accept/decline connection requests
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

RoommateProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('RoommateProfile', RoommateProfileSchema);
