const mongoose = require('mongoose');

const fundingResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['grant', 'work-study', 'payment-plan', 'government-aid'],
    required: true,
  },
  link: {
    type: String,
  },
  region: {
    type: String, // e.g. "US", "CA", "Global"
    default: 'Global'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FundingResource', fundingResourceSchema);
