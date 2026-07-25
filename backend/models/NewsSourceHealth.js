const mongoose = require('mongoose');

const newsSourceHealthSchema = new mongoose.Schema({
  sourceName: {
    type: String,
    required: true,
    unique: true
  },
  lastFetchTime: {
    type: Date,
    default: Date.now
  },
  lastStatus: {
    type: String,
    enum: ['success', 'error'],
    default: 'success'
  },
  lastError: {
    type: String,
    default: null
  },
  articlesIngestedLast24h: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('NewsSourceHealth', newsSourceHealthSchema);
