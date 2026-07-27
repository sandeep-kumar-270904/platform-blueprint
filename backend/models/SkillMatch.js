const mongoose = require('mongoose');

const skillMatchSchema = new mongoose.Schema({
  offerA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillOffer',
    required: true
  },
  offerB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SkillOffer',
    required: true
  },
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matchScore: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['suggested', 'requested', 'accepted', 'declined', 'completed'],
    default: 'suggested'
  }
}, { timestamps: true });

// Ensure we don't have duplicate matches for the same two offers
skillMatchSchema.index({ offerA: 1, offerB: 1 }, { unique: true });

module.exports = mongoose.model('SkillMatch', skillMatchSchema);
