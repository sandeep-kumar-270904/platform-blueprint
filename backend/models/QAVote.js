const mongoose = require('mongoose');

const qaVoteSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['Question', 'Answer'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vote: { type: Number, enum: [1, -1], required: true }
}, { timestamps: true });

// Ensure one vote per user per target
qaVoteSchema.index({ user_id: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('QAVote', qaVoteSchema);
