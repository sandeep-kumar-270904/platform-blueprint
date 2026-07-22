const mongoose = require('mongoose');

const AtsAnalysisResultSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  breakdown: {
    type: mongoose.Schema.Types.Mixed
  },
  tips: [{
    issue: String,
    severity: String,
    tip: String
  }],
  jobDescriptionMatch: {
    percentage: Number,
    missingKeywords: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AtsAnalysisResult', AtsAnalysisResultSchema);
