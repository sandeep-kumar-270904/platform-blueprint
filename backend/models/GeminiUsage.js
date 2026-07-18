const mongoose = require('mongoose');

const geminiUsageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  feature: { type: String, required: true }, // e.g., 'cover_letter', 'ats_score', 'resume_parse'
  calls: { type: Number, default: 0 }
}, { timestamps: true });

geminiUsageSchema.index({ userId: 1, date: 1, feature: 1 }, { unique: true });

module.exports = mongoose.model('GeminiUsage', geminiUsageSchema);
