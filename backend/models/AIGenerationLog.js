const mongoose = require('mongoose');

const aiGenerationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  difficulty: { type: String },
  countRequested: { type: Number, required: true },
  countGenerated: { type: Number, default: 0 },
  status: { type: String, enum: ['success', 'failed'], required: true },
  errorMessage: { type: String },
  durationMs: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIGenerationLog', aiGenerationLogSchema);
