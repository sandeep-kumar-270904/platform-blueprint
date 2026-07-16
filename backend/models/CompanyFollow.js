const mongoose = require('mongoose');

const CompanyFollowSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  followedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can only follow a company once
CompanyFollowSchema.index({ user: 1, companyName: 1 }, { unique: true });

module.exports = mongoose.model('CompanyFollow', CompanyFollowSchema);
