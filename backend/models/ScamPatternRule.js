const mongoose = require('mongoose');

const scamPatternRuleSchema = new mongoose.Schema({
  patternText: {
    type: String,
    required: true
  },
  matchType: {
    type: String,
    enum: ['contains', 'regex'],
    required: true
  },
  severity: {
    type: String,
    enum: ['flag_for_review', 'high_priority'],
    default: 'flag_for_review'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ScamPatternRule', scamPatternRuleSchema);
