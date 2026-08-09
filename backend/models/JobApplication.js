const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applyMode: { type: String, enum: ['in-app', 'external'], required: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  resumeSnapshot: { type: mongoose.Schema.Types.Mixed },
  coverLetterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter' },
  coverLetterSnapshot: { type: mongoose.Schema.Types.Mixed },
  resumeUrl: { type: String }, // For backward compatibility / external applies
  coverLetter: { type: String },
  screeningAnswers: [{ 
    question: { type: String }, 
    answer: { type: String } 
  }],
  studentManaged: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['interested', 'applied', 'under_review', 'assessment', 'shortlisted', 'interview', 'offered', 'rejected', 'hired', 'withdrawn', 'accepted'], 
    default: 'applied' 
  },
  statusHistory: [{ 
    status: { type: String }, 
    changedAt: { type: Date }, 
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    note: { type: String } 
  }],
  recruiterNotes: { type: String },
  rejectionReason: { type: String },
  rejectionFeedback: { type: String, enum: ['skills_gap', 'experience_level', 'culture_fit', 'other', null] },
  rejectionFeedbackNote: { type: String }
}, { timestamps: true });

// Compound unique index so user cannot apply twice to the same job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

jobApplicationSchema.index({ applicant: 1, createdAt: -1 });
jobApplicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
