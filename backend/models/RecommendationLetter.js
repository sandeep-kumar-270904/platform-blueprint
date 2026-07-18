const mongoose = require('mongoose');

const recommendationLetterSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // The writer can be an internal user or external (email only)
  writtenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  externalEmail: { type: String }, // Used if writtenBy is null
  
  relationship: { type: String, required: true }, // e.g. "Professor", "Manager", "Mentor"
  content: { type: String },
  
  status: { type: String, enum: ['requested', 'declined', 'drafted', 'submitted'], default: 'requested' },
  
  publicToken: { type: String }, // For external writers to access the submission form
  
  // Requester controls publication
  isPublished: { type: Boolean, default: false },
  linkedResumeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }],
  resumeSnapshot: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('RecommendationLetter', recommendationLetterSchema);
