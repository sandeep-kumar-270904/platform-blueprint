const mongoose = require('mongoose');

const dailyChallengeSchema = new mongoose.Schema({
  dateStr: { type: String, required: true, unique: true }, // e.g., '2026-07-26'
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }
}, { timestamps: true });

module.exports = mongoose.model('DailyChallenge', dailyChallengeSchema);
