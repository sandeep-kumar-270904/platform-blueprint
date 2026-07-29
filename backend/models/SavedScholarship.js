const mongoose = require('mongoose');

const savedScholarshipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scholarshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  }
});

// Ensure a user can only save a scholarship once
savedScholarshipSchema.index({ userId: 1, scholarshipId: 1 }, { unique: true });

module.exports = mongoose.model('SavedScholarship', savedScholarshipSchema);
