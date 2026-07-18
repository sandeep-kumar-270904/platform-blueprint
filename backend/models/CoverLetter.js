const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  title: { type: String, required: true },
  jobTitle: { type: String },
  companyName: { type: String },
  jobDescription: { type: String },
  content: { type: String, default: '' },
  tone: { type: String, enum: ['formal', 'conversational', 'enthusiastic'], default: 'formal' },
}, { timestamps: true });

module.exports = mongoose.model('CoverLetter', coverLetterSchema);
