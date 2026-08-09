const mongoose = require('mongoose');

const AlumniProfileSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
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
    openToSalarySharing: { type: Boolean, default: false }
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

AlumniProfileSchema.index({ collegeId: 1, verificationStatus: 1 });
AlumniProfileSchema.index({ userId: 1 });

module.exports = mongoose.model('AlumniProfile', AlumniProfileSchema);
