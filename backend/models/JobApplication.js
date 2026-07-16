const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applyMode: { type: String, enum: ['in-app', 'external'], required: true },
  resumeUrl: { 
    type: String, 
    required: function() { return this.applyMode === 'in-app'; } 
  },
  coverLetter: { type: String },
  screeningAnswers: [{ 
    question: { type: String }, 
    answer: { type: String } 
  }],
  status: { 
    type: String, 
    enum: ['applied', 'under_review', 'shortlisted', 'interview', 'offered', 'rejected', 'hired', 'withdrawn'], 
    default: 'applied' 
  },
  statusHistory: [{ 
    status: { type: String }, 
    changedAt: { type: Date }, 
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    note: { type: String } 
  }],
  recruiterNotes: { type: String },
  rejectionReason: { type: String }
}, { timestamps: true });

// Compound unique index so user cannot apply twice to the same job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
