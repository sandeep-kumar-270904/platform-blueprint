const mongoose = require('mongoose');

const SalaryEntrySchema = new mongoose.Schema({
  alumniId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AlumniProfile', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
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
    type: String,
    required: true
  },
  currentCompany: { 
    type: String 
  },
  showCompany: { 
    type: Boolean, 
    default: false 
  },
  showName: {
    type: Boolean,
    default: false
  },
  ctcBand: { 
    type: String, 
    enum: [
      '< 3 LPA', 
      '3-5 LPA', 
      '5-8 LPA', 
      '8-12 LPA', 
      '12-20 LPA', 
      '20-30 LPA', 
      '> 30 LPA'
    ],
    required: true 
  },
  yearsOfExperience: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'flagged', 'rejected'], 
    default: 'pending' // default pending to allow some minimal automated moderation or admin review
  },
  adminNote: {
    type: String
  }
}, {
  timestamps: true
});

SalaryEntrySchema.index({ collegeId: 1, branch: 1, graduationYear: 1, status: 1 });
SalaryEntrySchema.index({ alumniId: 1 });

module.exports = mongoose.model('SalaryEntry', SalaryEntrySchema);
