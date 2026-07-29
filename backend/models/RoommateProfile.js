const mongoose = require('mongoose');

const RoommateProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
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
  }
}, { timestamps: true });

module.exports = mongoose.model('RoommateProfile', RoommateProfileSchema);
