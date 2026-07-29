const mongoose = require('mongoose');

const newsIngestionLogSchema = new mongoose.Schema({
  runAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  durationMs: {
    type: Number,
    required: true
  },
  sourcesProcessed: [{
    type: String
  }],
  metrics: {
    totalFetched: { type: Number, default: 0 },
    totalAdded: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    spamRejected: { type: Number, default: 0 }
  },
  errorLogs: [{
    type: String
  }]
});

module.exports = mongoose.model('NewsIngestionLog', newsIngestionLogSchema);
