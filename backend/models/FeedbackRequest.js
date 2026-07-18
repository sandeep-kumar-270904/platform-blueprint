const mongoose = require('mongoose');

const feedbackRequestSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  resumeSnapshot: { type: mongoose.Schema.Types.Mixed }, // Frozen copy of the resume at request time
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestedFrom: { type: mongoose.Schema.Types.Mixed, required: true }, // ObjectId or "open"
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  pickedUpBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Used when requestedFrom is "open"
}, { timestamps: true });

feedbackRequestSchema.index({ resumeId: 1 });
feedbackRequestSchema.index({ requestedBy: 1 });
feedbackRequestSchema.index({ requestedFrom: 1, status: 1 });

module.exports = mongoose.model('FeedbackRequest', feedbackRequestSchema);
