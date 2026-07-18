const mongoose = require('mongoose');

const resumeVersionSchema = new mongoose.Schema({
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  versionNumber: { type: Number, required: true },
  snapshotData: { type: mongoose.Schema.Types.Mixed, required: true },
  atsScoreAtVersion: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// Create a compound index to easily get latest version per resume
resumeVersionSchema.index({ resumeId: 1, versionNumber: -1 });

module.exports = mongoose.model('ResumeVersion', resumeVersionSchema);
