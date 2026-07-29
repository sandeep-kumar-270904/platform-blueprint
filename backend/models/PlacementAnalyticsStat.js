const mongoose = require('mongoose');

const placementAnalyticsStatSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
  activeUsers: {
    type: Number,
    default: 0,
  },
  dsaSolved: {
    type: Number,
    default: 0,
  },
  mocksBooked: {
    type: Number,
    default: 0,
  },
  avgReadinessScore: {
    type: Number,
    default: 0,
  },
  anomaliesDetected: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
});

// Index for fast retrieval of the latest stat
placementAnalyticsStatSchema.index({ timestamp: -1 });

module.exports = mongoose.model('PlacementAnalyticsStat', placementAnalyticsStatSchema);
