const mongoose = require('mongoose');

const interviewPrepProgressSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep', required: true },
  reviewed_tech: [{ type: mongoose.Schema.Types.ObjectId }],
  reviewed_hr: [{ type: mongoose.Schema.Types.ObjectId }]
}, { timestamps: true });

interviewPrepProgressSchema.index({ user_id: 1, company_id: 1 }, { unique: true });

module.exports = mongoose.model('InterviewPrepProgress', interviewPrepProgressSchema);
