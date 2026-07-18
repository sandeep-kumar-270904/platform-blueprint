const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' }
}, { timestamps: true });

// Prevent duplicate connections regardless of order
connectionSchema.index({ userA: 1, userB: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);
