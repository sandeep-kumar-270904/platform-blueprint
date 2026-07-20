const mongoose = require('mongoose');

const applicationBuddyPairingSchema = new mongoose.Schema({
  userAId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userBId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  matchedOn: {
    type: [String],
    default: []
  },
  sharedScholarships: [{
    scholarshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scholarship'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  endedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

applicationBuddyPairingSchema.index({ userAId: 1, status: 1 });
applicationBuddyPairingSchema.index({ userBId: 1, status: 1 });

module.exports = mongoose.model('ApplicationBuddyPairing', applicationBuddyPairingSchema);
