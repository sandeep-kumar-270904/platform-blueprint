const mongoose = require('mongoose');

const resumeTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  layoutCode: { type: String, required: true }, // e.g. "classic", "modern", "minimal" or actual HTML/CSS structure
  sponsoredByCompany: { type: String }, // Endorsement text e.g. "Acme Corp ATS"
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Recruiter who submitted it
  isApproved: { type: Boolean, default: false }, // Admin approval
  rejectionReason: { type: String },
  usageCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ResumeTemplate', resumeTemplateSchema);
