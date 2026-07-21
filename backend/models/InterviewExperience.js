const mongoose = require('mongoose');

const interviewExperienceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyPrep', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  outcome: { type: String, enum: ['Offered', 'Rejected', 'Waitlisted'], required: true },
  rounds: [{
    roundName: { type: String, required: true },
    details: { type: String, required: true }
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: true });

module.exports = mongoose.model('InterviewExperience', interviewExperienceSchema);
