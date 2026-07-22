const mongoose = require('mongoose');

const gdPeerFeedbackSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'GDLiveSession', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  strengths: { type: String, required: true },
  improvements: { type: String, required: true }
}, { timestamps: true });

// Prevent duplicate feedback from same reviewer to same reviewee for the same session
gdPeerFeedbackSchema.index({ session: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model('GDPeerFeedback', gdPeerFeedbackSchema);
