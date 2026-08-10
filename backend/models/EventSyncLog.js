const mongoose = require('mongoose');

const eventSyncLogSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  status: { type: String, enum: ['SUCCESS', 'PARTIAL', 'FAILURE'], required: true },
  eventsImported: { type: Number, default: 0 },
  eventsUpdated: { type: Number, default: 0 },
  errors: [{ type: String }],
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

eventSyncLogSchema.index({ provider: 1, timestamp: -1 });

module.exports = mongoose.model('EventSyncLog', eventSyncLogSchema);
