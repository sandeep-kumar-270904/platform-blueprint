const mongoose = require('mongoose');

const resumeWorkshopSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  scheduledFor: { type: Date, required: true },
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxParticipants: { type: Number, default: 20 },
  sharedResumes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resume' }], // Resumes actively shared for group critique
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' }
}, { timestamps: true });

module.exports = mongoose.model('ResumeWorkshop', resumeWorkshopSchema);
