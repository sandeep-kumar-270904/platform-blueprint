const mongoose = require('mongoose');

const AlumniProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  registryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AlumniRegistry',
    default: null
  },
  collegeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'College', 
    required: true 
  },
  branch: { 
    type: String, 
    required: true 
  },
  graduationYear: { 
    type: Number, 
    required: true 
  },
  currentRole: { 
    type: String 
  },
  currentCompany: { 
    type: String 
  },
  skills: [{ type: String }],
  about: { type: String },
  areasOfExpertise: [{ type: String }],
  careerHistory: [{
    role: String,
    company: String,
    startDate: Date,
    endDate: Date,
    isCurrent: Boolean,
    description: String
  }],
  visibility: { 
    type: String, 
    enum: ['public', 'students-only', 'private'], 
    default: 'students-only' 
  },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  verificationMethod: { 
    type: String // e.g. 'domain-match', 'manual'
  },
  willingness: {
    openToQa: { type: Boolean, default: false },
    openToMentoring: { type: Boolean, default: false },
    openToSalarySharing: { type: Boolean, default: false },
    openToResumeReview: { type: Boolean, default: false },
    openToMockInterviews: { type: Boolean, default: false },
    openToReferrals: { type: Boolean, default: false }
  },
  availabilityNote: { 
    type: String 
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true
});

AlumniProfileSchema.index({ collegeId: 1, verificationStatus: 1, visibility: 1 });
AlumniProfileSchema.index({ userId: 1 });
AlumniProfileSchema.index({ currentCompany: 1, currentRole: 1 });
AlumniProfileSchema.index({ skills: 1 });
AlumniProfileSchema.index({ visibility: 1, currentCompany: 1, graduationYear: 1 });

module.exports = mongoose.model('AlumniProfile', AlumniProfileSchema);
